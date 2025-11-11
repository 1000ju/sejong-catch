# Sejong Node Service

## 전체 흐름 요약

이 서비스는 학번/비밀번호 기반 로그인 요청을 받아 다음 순서로 처리합니다.

1. **로컬 DB 조회**  
   `core_auth_accounts`와 `core_users`에서 기존 계정을 찾아 bcrypt로 비밀번호를 검증합니다.
2. **SSO 연동**  
   로컬 정보가 없거나 비밀번호가 맞지 않으면 Python SSO 서비스(`/auth/sessions`)에 학번/비밀번호를 전송해 인증을 위임합니다.
3. **DB 동기화**  
   SSO가 성공하면 내려받은 프로필(name/major/year/role)을 로컬 DB에 upsert합니다. 비밀번호 해시와 refresh token도 이 단계에서 저장됩니다.
4. **JWT 발급**  
   `jsonwebtoken` 기반 유틸(`src/utils/token.js`)로 access/refresh 토큰을 발급하고, refresh 토큰을 DB에 저장합니다.
5. **응답**  
   최종적으로 `user` 정보와 `accessToken`, `refreshToken`을 반환합니다.

로그아웃(`/auth/logout`)은 전달된 refresh 토큰을 DB에서 찾아 무효화합니다. access 토큰 검증은 보호된 API 앞단에서 `verifyAccessToken()`을 사용하는 방식으로 처리하면 됩니다.

## 구성 요소 상세

### Python SSO (`sejong-auth-crawler-svc`)

- `/auth/sessions` 요청을 받으면 `sejong_univ_auth` 라이브러리로 여러 SSO 세션을 순차적으로 시도합니다.
- 성공 시 `success: true`와 `user`(이름/학과/학년/role 등)를 반환하고, 실패하면 401을 응답합니다.
- Node 연동 로직은 없으며 SSO 인증에만 집중합니다.

### Node 서비스 (`sejong-node-svc`)

- `src/services/auth.service.js`
  - `login()`은 로컬 비밀번호 확인 → SSO 호출 → DB upsert → 토큰 발급 순서로 동작합니다.
  - `logout()`은 refresh 토큰을 Null로 만들고 `last_login_at`을 갱신합니다.
- `src/utils/token.js`
  - `issueTokenPair()`로 access/refresh 토큰을 한 번에 생성합니다.
  - `verifyAccessToken()`, `verifyRefreshToken()`을 제공해 API 보호와 refresh 흐름을 지원합니다.
- `src/models/coreUser.js` / `coreAuthAccount.js`
  - `major`, `year`, `refreshToken`, `lastLoginAt` 컬럼을 포함합니다.
- 환경변수(`.env`)
  - `AUTH_CRAWLER_BASE_URL` : Python SSO 서비스 주소
  - `JWT_*` : 토큰 발급 설정 (secret, 만료시간, issuer 등)
  - `DB_*` : MySQL 연결 정보
- Docker
  - `Dockerfile`에서 `npm install`을 수행하고 소스를 복사합니다.
  - `docker-compose.yml`에서 `node`, `auth`, `db` 컨테이너를 올리며, `node`는 `Dockerfile`을 기반으로 빌드됩니다.

## 실행 및 테스트

1. 의존성 설치와 이미지 빌드
   ```bash
   docker compose build node auth
   ```
2. 데이터베이스 마이그레이션
   ```bash
   docker compose run --rm node npm run db:migrate
   ```
3. 컨테이너 기동
   ```bash
   docker compose up -d
   ```
4. 로그인 테스트
   ```bash
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{"studentId":"학번","password":"비밀번호"}'
   ```
   응답에서 `accessToken`, `refreshToken`, `user` 정보를 확인합니다.
5. 로그아웃 테스트
   ```bash
   curl -X POST http://localhost:8080/auth/logout \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"..." }'
   ```
   이후 동일 refresh 토큰으로 다시 요청하면 404가 반환되는지 확인합니다.

## 추가 참고

- 보호된 API에서는 `tokenUtils.verifyAccessToken()`을 사용해 access 토큰을 검증하세요.
- refresh 토큰을 활용한 자동 재발급 흐름이 필요하다면 미들웨어에서 `verifyRefreshToken()` → `issueAccessToken()` 순으로 구현하면 됩니다.
- `.env`를 수정하거나 `package.json`을 변경한 뒤에는 항상 `docker compose build`를 다시 실행해 새 설정/의존성을 포함한 이미지를 만들어야 합니다.

//크롤링 내용 추가하면 됨
