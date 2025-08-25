const jwt = require('jsonwebtoken');

// JWT 토큰 검증 미들웨어
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// 인증 필수 미들웨어
function requireAuth(req, res, next) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다.',
      message: '로그인이 필요합니다.'
    });
  }
  
  req.user = user;
  if (next) next();
  return user;
}

// 관리자 권한 필수 미들웨어
function requireAdmin(req, res, next) {
  const user = requireAuth(req, res);
  if (!user) return; // 이미 401 응답 전송됨
  
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '관리자 권한이 필요합니다.',
      message: '접근 권한이 없습니다.'
    });
  }
  
  if (next) next();
  return user;
}

// 선택적 인증 (토큰이 있으면 검증, 없어도 통과)
function optionalAuth(req, res, next) {
  const user = verifyToken(req);
  req.user = user; // null일 수도 있음
  if (next) next();
  return user;
}

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin,
  optionalAuth
};