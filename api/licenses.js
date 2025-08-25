const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // JWT 토큰 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 관리자 권한 확인
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    switch (req.method) {
      case 'GET':
        // 라이선스 목록 조회
        const { data: licenses, error: fetchError } = await supabase
          .from('licenses')
          .select(`
            *,
            institution:institutions(name)
          `)
          .order('created_at', { ascending: false });

        if (fetchError) {
          return res.status(500).json({ error: '라이선스 조회 실패', details: fetchError.message });
        }

        return res.status(200).json({ licenses });

      case 'POST':
        // 새 라이선스 생성
        const { name, description, institution_id, price, duration_months, max_users } = req.body;

        if (!name || !institution_id || !price || !duration_months) {
          return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
        }

        const { data: newLicense, error: createError } = await supabase
          .from('licenses')
          .insert({
            name,
            description,
            institution_id,
            price,
            duration_months,
            max_users,
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          return res.status(500).json({ error: '라이선스 생성 실패', details: createError.message });
        }

        return res.status(201).json({ license: newLicense });

      case 'PUT':
        // 라이선스 수정
        const { id } = req.query;
        const updateData = req.body;

        if (!id) {
          return res.status(400).json({ error: '라이선스 ID가 필요합니다.' });
        }

        const { data: updatedLicense, error: updateError } = await supabase
          .from('licenses')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({ error: '라이선스 수정 실패', details: updateError.message });
        }

        return res.status(200).json({ license: updatedLicense });

      case 'DELETE':
        // 라이선스 삭제 (소프트 삭제)
        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ error: '라이선스 ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('licenses')
          .update({ is_active: false })
          .eq('id', deleteId);

        if (deleteError) {
          return res.status(500).json({ error: '라이선스 삭제 실패', details: deleteError.message });
        }

        return res.status(200).json({ message: '라이선스가 성공적으로 삭제되었습니다.' });

      default:
        return res.status(405).json({ error: '지원하지 않는 HTTP 메서드입니다.' });
    }
  } catch (error) {
    console.error('라이선스 API 오류:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};