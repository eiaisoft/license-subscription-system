const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

// 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

// 로그인 API
app.post('/api/auth/login', require('./auth/login'));

// 기관 API
app.get('/api/institutions', require('./institutions'));

// 라이선스 API
app.get('/api/licenses', require('./licenses'));

// 구독 API
app.get('/api/subscriptions', require('./subscriptions'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});