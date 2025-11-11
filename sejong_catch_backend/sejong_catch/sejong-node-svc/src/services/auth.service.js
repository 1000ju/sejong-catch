"use strict";

const axios = require("axios");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { sequelize, models } = require("../models");
const tokenUtils = require("../utils/token"); // access/refresh 토큰 발급·검증 유틸

// ======================================================================
// 환경 변수 및 상수
// ======================================================================
const AUTH_PROVIDER = "local"; // CoreAuthAccount.provider 값으로 사용
const sanitizeBaseUrl = (value) => (value || "").replace(/\/$/, "");

const AUTH_CRAWLER_BASE_URL = sanitizeBaseUrl(
  process.env.AUTH_CRAWLER_BASE_URL
); // Python SSO 서비스 주소
const AUTH_CRAWLER_FALLBACK_URL = sanitizeBaseUrl(
  process.env.AUTH_CRAWLER_BASE_URL_FALLBACK || ""
); // 명시적으로 설정된 경우에만 예비 주소 사용
const AUTH_CRAWLER_TIMEOUT_MS = Number(
  process.env.AUTH_CRAWLER_TIMEOUT_MS || process.env.CRAWLER_TIMEOUT_MS || 5000
); // SSO 요청 타임아웃
const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12); // bcrypt salt 라운드

// ======================================================================
// 헬퍼: Sequelize User -> API 응답용 객체 변환
// ======================================================================
const mapUserToResponse = (userInstance) => {
  if (!userInstance) {
    return null;
  }

  const { id, email, name, role, major, year, createdAt, updatedAt } =
    userInstance;
  return {
    id,
    email,
    name,
    role,
    major,
    year,
    createdAt,
    updatedAt,
  };
};

// 401 Unauthorized 에러 생성
const createUnauthorizedError = () => {
  const error = new Error("Invalid studentId or password.");
  error.status = 401;
  return error;
};

// 외부 서비스 연동 실패 시 5xx 에러 생성
const createIntegrationError = (message, status = 502) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// ======================================================================
// Python SSO 서비스 호출
// ======================================================================
const resolveAuthCrawlerUrls = () => {
  const urls = [];
  if (AUTH_CRAWLER_BASE_URL) {
    urls.push(AUTH_CRAWLER_BASE_URL);
  }
  if (
    AUTH_CRAWLER_FALLBACK_URL &&
    AUTH_CRAWLER_FALLBACK_URL !== AUTH_CRAWLER_BASE_URL
  ) {
    urls.push(AUTH_CRAWLER_FALLBACK_URL);
  }
  return urls;
};

const fetchSsoResult = async ({ studentId, password }) => {
  const candidateUrls = resolveAuthCrawlerUrls();
  if (!candidateUrls.length) {
    throw createIntegrationError(
      "AUTH_CRAWLER_BASE_URL is not configured.",
      500
    );
  }

  try {
    // Python 서비스는 학번/비밀번호를 받아 여러 SSO 세션을 순차적으로 시도하고 성공 시 사용자 프로필을 반환한다.
    let lastError;
    for (let index = 0; index < candidateUrls.length; index += 1) {
      const baseUrl = candidateUrls[index];
      try {
        const response = await axios.post(
          `${baseUrl}/auth/sessions`,
          {
            student_id: studentId,
            password,
          },
          {
            timeout: AUTH_CRAWLER_TIMEOUT_MS,
          }
        );
        return response.data;
      } catch (error) {
        lastError = error;

        // 인증 실패(401)은 즉시 종료
        if (error.response && error.response.status === 401) {
          return null;
        }

        // 네트워크 레벨 오류(ENOTFOUND/ECONNREFUSED)라면 fallback 주소가 남아 있을 때만 다음 시도로 진행
        const recoverableCodes = new Set(["ENOTFOUND", "ECONNREFUSED"]);
        if (
          axios.isAxiosError(error) &&
          error.code &&
          recoverableCodes.has(error.code) &&
          index < candidateUrls.length - 1
        ) {
          continue;
        }

        // 그 외 오류(5xx 등)는 그대로 처리
        throw error;
      }
    }

    throw lastError;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 네트워크 오류나 5xx 등은 502 Bad Gateway 로 전달
      throw createIntegrationError(
        `SSO service request failed: ${error.message}`,
        error.response?.status || 502
      );
    }

    throw error;
  }
};

// ======================================================================
// 헬퍼: SSO 결과를 기반으로 로컬 DB(CoreUser/CoreAuthAccount) 갱신
// ======================================================================
const refreshLocalAccount = async ({
  studentId,
  password,
  profile,
  existingAccount,
}) => {
  const {
    id: profileId,
    email,
    name,
    role = "student",
    major = null,
    year = null,
  } = profile || {};

  const userId = existingAccount?.userId || profileId || `u_${studentId}`;
  const fallbackEmail =
    email || existingAccount?.user?.email || `${studentId}@sejong.local`;
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const accountId = existingAccount?.id || uuidv4();

  // User/Account upsert는 atomic하게 처리되어야 하므로 트랜잭션 사용
  await sequelize.transaction(async (transaction) => {
    await models.CoreUser.upsert(
      {
        id: userId,
        email: fallbackEmail,
        name: name || existingAccount?.user?.name || null,
        role: role || existingAccount?.user?.role || "student",
        major: major ?? existingAccount?.user?.major ?? null,
        year: year ?? existingAccount?.user?.year ?? null,
      },
      { transaction }
    );

    await models.CoreAuthAccount.upsert(
      {
        id: accountId,
        userId,
        provider: AUTH_PROVIDER,
        providerUserId: studentId,
        passwordHash,
        lastLoginAt: new Date(),
      },
      { transaction }
    );
  });

  const nextAccount = await models.CoreAuthAccount.findOne({
    where: {
      provider: AUTH_PROVIDER,
      providerUserId: studentId,
    },
    include: [
      {
        model: models.CoreUser,
        as: "user",
      },
    ],
  });

  if (!nextAccount || !nextAccount.user) {
    throw createIntegrationError("Failed to synchronize account with SSO.");
  }

  return nextAccount;
};

// ======================================================================
// 로그인
// ======================================================================
// 1) 로컬 DB에서 계정 조회 후 비밀번호 검증
// 2) 실패 시 Python SSO 호출 → 성공하면 DB 동기화
// 3) 최종적으로 access/refresh 토큰을 발급하고 refresh 토큰을 DB에 저장
const login = async ({ studentId, password }) => {
  let account = await models.CoreAuthAccount.findOne({
    where: {
      provider: AUTH_PROVIDER,
      providerUserId: studentId,
    },
    include: [
      {
        model: models.CoreUser,
        as: "user",
      },
    ],
  });

  // 로컬 캐시된 비밀번호가 있고 검증에 성공한 경우 → 토큰만 재발급
  if (account && account.passwordHash && account.user) {
    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (isValid) {
      const tokenPair = tokenUtils.issueTokenPair({
        userId: account.user.id,
        role: account.user.role,
        email: account.user.email,
      });

      // refresh token은 이 계정에서 유일해야 하므로 DB에 새 토큰으로 교체하고
      // 마지막 로그인 시각을 갱신한다. 이렇게 해야 logout 시 refreshToken을 찾아 무효화할 수 있다.
      await models.CoreAuthAccount.update(
        {
          refreshToken: tokenPair.refreshToken,
          lastLoginAt: new Date(),
        },
        {
          where: {
            id: account.id,
          },
        }
      );

      return {
        user: mapUserToResponse(account.user),
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      };
    }
  }

  // 로컬 검증 실패 → Python SSO 인증 시도
  const ssoResult = await fetchSsoResult({ studentId, password });
  if (!ssoResult || !ssoResult.success) {
    throw createUnauthorizedError();
  }

  // SSO 성공 → 프로필 정보를 저장하며 로컬 계정 업데이트
  const profile = ssoResult.user || {};
  account = await refreshLocalAccount({
    studentId,
    password,
    profile,
    existingAccount: account,
  });

  const tokenPair = tokenUtils.issueTokenPair({
    userId: account.user.id,
    role: account.user.role,
    email: account.user.email,
  });

  await models.CoreAuthAccount.update(
    {
      refreshToken: tokenPair.refreshToken,
      lastLoginAt: new Date(),
    },
    {
      where: {
        id: account.id,
      },
    }
  );

  return {
    user: mapUserToResponse(account.user),
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
  };
};

// ======================================================================
// 로그아웃: refresh 토큰 무효화
// ======================================================================
const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    const error = new Error("refreshToken is required.");
    error.status = 400;
    throw error;
  }

  // refresh 토큰은 CoreAuthAccount 테이블에 저장되어 있으므로 해당 값을 null로 설정해 폐기한다.
  // lastLoginAt을 갱신해 최근 activity 로그로도 활용한다.
  const [affected] = await models.CoreAuthAccount.update(
    { refreshToken: null, lastLoginAt: new Date() },
    {
      where: {
        provider: AUTH_PROVIDER,
        refreshToken,
      },
    }
  );

  if (affected === 0) {
    // 이미 무효화됐거나 존재하지 않는 토큰이 전달된 경우
    const error = new Error("Refresh token not found.");
    error.status = 404;
    throw error;
  }

  return;
};

module.exports = {
  login,
  logout,
};
