const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
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
    const { email, password, name, institutionId } = req.body;

    if (!email || !password || !name || !institutionId) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({ error: '회원가입에 실패했습니다: ' + authError.message });
    }

    // users 테이블에 사용자 정보 저장
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        institution_id: institutionId,
        role: 'user',
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: '사용자 정보 저장에 실패했습니다.' });
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

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        institutionId: userData.institution_id
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};