const authService = require("../services/auth.service"); // 서비스 계층: 비즈니스 로직/DB 접근

const pickClientContext = (req) => ({
  ip: req.ip,
  userAgent: req.headers["user-agent"] || null,
});

exports.login = async (req, res, next) => {
  try {
    const { studentId, password } = req.body || {};
    if (!studentId || !password) {
      // 필수 값 누락 시 즉시 400 응답
      return res
        .status(400)
        .json({ message: "studentId and password are required." });
    }

    const result = await authService.login({
      studentId,
      password,
      context: pickClientContext(req),
    });

    return res.status(200).json(result); // 로그인 성공 정보 반환(access/refresh 포함)
  } catch (error) {
    return next(error); // 에러 미들웨어로 전달
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required." });
    }

    await authService.logout({
      refreshToken,
      context: pickClientContext(req),
    });

    return res.status(204).send(); // 추가 응답 본문 없이 성공 처리
  } catch (error) {
    return next(error);
  }
};
