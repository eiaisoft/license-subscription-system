const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// 환경 변수 확인
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JWT 토큰 검증 함수
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // 기관 목록 조회 (인증 불필요 - 회원가입용)
        console.log('Fetching institutions...');
        
        const { data: institutions, error: getError } = await supabase
          .from('institutions')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (getError) {
          console.error('Supabase error:', getError);
          throw getError;
        }
        
        console.log('Found institutions:', institutions?.length || 0);
        return res.status(200).json({ institutions: institutions || [] });

      case 'POST':
      case 'PUT':
      case 'DELETE':
        // 이 작업들은 인증 필요
        const user = verifyToken(req);
        if (!user) {
          return res.status(401).json({ error: '인증이 필요합니다.' });
        }

        if (req.method === 'POST') {
          // 새 기관 생성 (관리자만)
          if (user.role !== 'admin') {
            return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
          }

          const { name, domain, address, phone } = req.body;
          if (!name || !domain) {
            return res.status(400).json({ error: '기관명과 도메인은 필수입니다.' });
          }

          const { data: newInstitution, error: createError } = await supabase
            .from('institutions')
            .insert({ name, domain, address, phone, status: 'active' })
            .select()
            .single();

          if (createError) throw createError;
          return res.status(201).json({ institution: newInstitution });
        }

        if (req.method === 'PUT') {
          // 기관 정보 수정 (관리자만)
          if (user.role !== 'admin') {
            return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
          }

          const { id, ...updateData } = req.body;
          if (!id) {
            return res.status(400).json({ error: '기관 ID가 필요합니다.' });
          }

          const { data: updatedInstitution, error: updateError } = await supabase
            .from('institutions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (updateError) throw updateError;
          return res.status(200).json({ institution: updatedInstitution });
        }

        if (req.method === 'DELETE') {
          // 기관 삭제 (관리자만)
          if (user.role !== 'admin') {
            return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
          }

          const institutionId = req.query.id;
          if (!institutionId) {
            return res.status(400).json({ error: '기관 ID가 필요합니다.' });
          }

          const { error: deleteError } = await supabase
            .from('institutions')
            .delete()
            .eq('id', institutionId);

          if (deleteError) throw deleteError;
          return res.status(200).json({ message: '기관이 삭제되었습니다.' });
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Institution API error:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
};