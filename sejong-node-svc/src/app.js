const express = require("express"); // Express 프레임워크로 HTTP 서버 생성
const morgan = require("morgan"); // 요청/응답 로깅 미들웨어
const dotenv = require("dotenv"); // .env 파일을 읽어 process.env에 주입
const swaggerUi = require("swagger-ui-express"); // Swagger UI 미들웨어
const swaggerSpec = require("./docs/swagger"); // OpenAPI 스펙

dotenv.config(); // 환경 변수 초기화

// 라우트 모듈 임포트
const authRoutes = require("./routes/auth.routes");

const app = express(); // 애플리케이션 인스턴스 생성

// 공통 미들웨어 등록
app.use(express.json()); // JSON 요청 본문 파서
app.use(express.urlencoded({ extended: false })); // 폼-urlencoded 본문 파서
app.use(morgan("dev")); // 개발용 간단 로그 출력
app.use("/docs", swaggerUi.serve); // Swagger UI 정적 파일 제공
app.get("/docs", swaggerUi.setup(swaggerSpec)); // Swagger UI HTML 서빙

// 라우터 마운트
app.use("/auth", authRoutes); // /auth 경로에 인증 API 연결

// 존재하지 않는 경로 처리
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// 에러 처리 미들웨어
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err); // TODO: 이후 공통 로깅 시스템으로 대체 예정
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
});

// 서버 기동 설정
const port = Number(process.env.PORT || 8080);

if (require.main === module) {
  // 현재 파일이 직접 실행될 때만 실제로 서버를 띄운다 (테스트 시 import 가능)
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app; // 다른 모듈에서 재사용할 수 있도록 export
