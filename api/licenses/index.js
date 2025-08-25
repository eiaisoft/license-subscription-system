const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('../middleware/auth');

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
    // 모든 작업에 관리자 권한 필요
    const user = requireAdmin(req, res);
    if (!user) return; // 이미 응답 전송됨

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
          return res.status(500).json({ 
            success: false,
            error: '라이선스 조회 실패', 
            message: fetchError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          data: { licenses },
          message: '라이선스 목록 조회 성공'
        });

      case 'POST':
        // 새 라이선스 생성
        const { name, description, institution_id, price, duration_months, max_users } = req.body;

        if (!name || !institution_id || !price || !duration_months) {
          return res.status(400).json({ 
            success: false,
            error: '필수 필드가 누락되었습니다.',
            message: '모든 필수 필드를 입력해주세요.'
          });
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
          return res.status(500).json({ 
            success: false,
            error: '라이선스 생성 실패', 
            message: createError.message 
          });
        }

        return res.status(201).json({ 
          success: true,
          data: { license: newLicense },
          message: '라이선스가 성공적으로 생성되었습니다.'
        });

      case 'PUT':
        // 라이선스 수정
        const { id } = req.query;
        const updateData = req.body;

        if (!id) {
          return res.status(400).json({ 
            success: false,
            error: '라이선스 ID가 필요합니다.',
            message: '수정할 라이선스를 선택해주세요.'
          });
        }

        const { data: updatedLicense, error: updateError } = await supabase
          .from('licenses')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({ 
            success: false,
            error: '라이선스 수정 실패', 
            message: updateError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          data: { license: updatedLicense },
          message: '라이선스가 성공적으로 수정되었습니다.'
        });

      case 'DELETE':
        // 라이선스 삭제 (소프트 삭제)
        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ 
            success: false,
            error: '라이선스 ID가 필요합니다.',
            message: '삭제할 라이선스를 선택해주세요.'
          });
        }

        const { error: deleteError } = await supabase
          .from('licenses')
          .update({ is_active: false })
          .eq('id', deleteId);

        if (deleteError) {
          return res.status(500).json({ 
            success: false,
            error: '라이선스 삭제 실패', 
            message: deleteError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          data: null,
          message: '라이선스가 성공적으로 삭제되었습니다.'
        });

      default:
        return res.status(405).json({ 
          success: false,
          error: '지원하지 않는 HTTP 메서드입니다.',
          message: '지원하지 않는 요청입니다.'
        });
    }
  } catch (error) {
    console.error('라이선스 API 오류:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: '유효하지 않은 토큰입니다.',
        message: '다시 로그인해주세요.'
      });
    }
    return res.status(500).json({ 
      success: false,
      error: '서버 내부 오류가 발생했습니다.',
      message: error.message
    });
  }
};