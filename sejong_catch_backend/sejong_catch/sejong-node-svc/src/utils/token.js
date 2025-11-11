"use strict";

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// =====================================================================================
// JWT 설정값 로드
// =====================================================================================
// Access/Refresh 토큰에 사용할 시크릿과 만료시간은 .env에서 주입한다.
// issuer/audience를 명시해 환경 간 일관성을 보장한다.
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const ISSUER = process.env.JWT_ISSUER || "sejong-node-svc";
const AUDIENCE = process.env.JWT_AUDIENCE || "sejong-catch-api";

if (!ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is not configured.");
}

if (!REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not configured.");
}

// =====================================================================================
// Payload 생성 헬퍼
// =====================================================================================
const buildAccessPayload = ({ userId, role, email }) => ({
  sub: userId,
  uid: userId,
  role,
  email: email || null,
});

const buildRefreshPayload = ({ userId, role }) => ({
  sub: userId,
  uid: userId,
  role,
  type: "refresh",
});

// =====================================================================================
// 토큰 발급 유틸
// =====================================================================================
// issueAccessToken() / issueRefreshToken()으로 각각의 토큰을 생성한다.
// 필요하다면 한 번에 페어를 반환하는 issueTokenPair()도 제공한다.
const issueAccessToken = ({ userId, role, email }) =>
  jwt.sign(buildAccessPayload({ userId, role, email }), ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
    issuer: ISSUER,
    audience: AUDIENCE,
    jwtid: uuidv4(),
  });

const issueRefreshToken = ({ userId, role }) =>
  jwt.sign(buildRefreshPayload({ userId, role }), REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
    issuer: ISSUER,
    jwtid: uuidv4(),
  });

const issueTokenPair = ({ userId, role, email }) => ({
  accessToken: issueAccessToken({ userId, role, email }),
  refreshToken: issueRefreshToken({ userId, role }),
});

// =====================================================================================
// 토큰 검증
// =====================================================================================
const verifyAccessToken = (token) =>
  jwt.verify(token, ACCESS_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, REFRESH_SECRET, {
    issuer: ISSUER,
  });

  if (payload.type && payload.type !== "refresh") {
    const error = new Error("Invalid refresh token payload.");
    error.name = "InvalidRefreshTokenError";
    throw error;
  }

  return payload;
};

module.exports = {
  issueAccessToken,
  issueRefreshToken,
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
};

// jwt.sign(payload, secret, options)
// payload와 비밀 키, 만료 시간 등을 전달하면 서명된 JWT 문자열을 만들어 줍니다. access/refresh 토큰을 생성할 때 사용했습니다.

// jwt.verify(token, secret, options)
// 전달된 토큰이 지정한 시크릿으로 서명됐는지, 만료·issuer·audience 조건을 만족하는지 검증하고 payload를 돌려줍니다.
// refresh 토큰이 유효한지 확인할 때 사용합니다.
