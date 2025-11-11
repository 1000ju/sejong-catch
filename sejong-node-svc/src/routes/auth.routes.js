const { Router } = require("express"); // Express 라우터 생성 유틸
const authController = require("../controllers/auth.controller"); // 인증 컨트롤러 함수 집합

const router = Router(); // /auth 전용 하위 라우터
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 학번/비밀번호 로그인
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, password]
 *             properties:
 *               studentId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       400:
 *         description: 필수 값 누락
 *       401:
 *         description: 인증 실패
 */
router.post("/login", authController.login); // 로그인 엔드포인트

router.post("/logout", authController.logout); // 로그아웃(토큰 무효화 예정) 엔드포인트

//권한 수정 엔드포인트 하나 추가

module.exports = router;
