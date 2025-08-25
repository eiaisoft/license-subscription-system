const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        return res.status(200).json({ 
          success: true,
          data: { institutions: institutions || [] },
          message: '기관 목록 조회 성공'
        });

      case 'POST':
      case 'PUT':
      case 'DELETE':
        // 이 작업들은 관리자 권한 필요
        const user = requireAdmin(req, res);
        if (!user) return; // 이미 응답 전송됨

        if (req.method === 'POST') {
          // 새 기관 생성 (관리자만)
          if (user.role !== 'admin') {
            return res.status(403).json({ 
              success: false,
              error: '관리자 권한이 필요합니다.',
              message: '접근 권한이 없습니다.'
            });
          }

          const { name, domain, address, phone } = req.body;
          if (!name || !domain) {
            return res.status(400).json({ 
              success: false,
              error: '기관명과 도메인은 필수입니다.',
              message: '필수 필드를 입력해주세요.'
            });
          }

          const { data: newInstitution, error: createError } = await supabase
            .from('institutions')
            .insert({ name, domain, address, phone, status: 'active' })
            .select()
            .single();

          if (createError) throw createError;
          return res.status(201).json({ 
            success: true,
            data: { institution: newInstitution },
            message: '기관이 성공적으로 생성되었습니다.'
          });
        }

        if (req.method === 'PUT') {
          // 기관 정보 수정 (관리자만)
          if (user.role !== 'admin') {
            return res.status(403).json({ 
              success: false,
              error: '관리자 권한이 필요합니다.',
              message: '접근 권한이 없습니다.'
            });
          }

          const { id, ...updateData } = req.body;
          if (!id) {
            return res.status(400).json({ 
              success: false,
              error: '기관 ID가 필요합니다.',
              message: '수정할 기관을 선택해주세요.'
            });
          }

          const { data: updatedInstitution, error: updateError } = await supabase
            .from('institutions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (updateError) throw updateError;
          return res.status(200).json({ 
            success: true,
            data: { institution: updatedInstitution },
            message: '기관 정보가 성공적으로 수정되었습니다.'
          });
        }

        if (req.method === 'DELETE') {
          // 기관 삭제 (관리자만)
          if (user.role !== 'admin') {
            return res.status(403).json({ 
              success: false,
              error: '관리자 권한이 필요합니다.',
              message: '접근 권한이 없습니다.'
            });
          }

          const institutionId = req.query.id;
          if (!institutionId) {
            return res.status(400).json({ 
              success: false,
              error: '기관 ID가 필요합니다.',
              message: '삭제할 기관을 선택해주세요.'
            });
          }

          const { error: deleteError } = await supabase
            .from('institutions')
            .delete()
            .eq('id', institutionId);

          if (deleteError) throw deleteError;
          return res.status(200).json({ 
            success: true,
            data: null,
            message: '기관이 성공적으로 삭제되었습니다.'
          });
        }
        break;

      default:
        return res.status(405).json({ 
          success: false,
          error: 'Method not allowed',
          message: '지원하지 않는 HTTP 메서드입니다.'
        });
    }
  } catch (error) {
    console.error('Institution API error:', error);
    res.status(500).json({ 
      success: false,
      error: '서버 오류가 발생했습니다.',
      message: error.message 
    });
  }
};