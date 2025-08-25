const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    console.log('Login attempt for:', email);

    // Supabase Auth로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        institutions (name, domain)
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      return res.status(404).json({ error: '사용자 정보를 찾을 수 없습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        institution_id: userData.institution_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          institution: userData.institutions
        }
      },
      message: '로그인 성공'
    });
  } catch (error) {
    console.error('Login API error:', error);
    res.status(500).json({ 
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message 
    });
  }
};