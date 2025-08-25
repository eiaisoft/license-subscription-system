const { createClient } = require('@supabase/supabase-js');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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
    switch (req.method) {
      case 'GET':
        // 구독 목록 조회 (인증 필요)
        const userForGet = requireAuth(req, res);
        if (!userForGet) return; // 이미 응답 전송됨
        
        let query = supabase
          .from('subscriptions')
          .select(`
            *,
            users:user_id(id, email, name),
            licenses:license_id(id, name, description, price)
          `);

        // 관리자가 아니면 본인 구독만 조회
        if (userForGet.role !== 'admin') {
          query = query.eq('user_id', userForGet.id);
        }

        const { data: subscriptions, error: getError } = await query;

        if (getError) {
          return res.status(500).json({ 
            success: false,
            error: '구독 조회 실패', 
            message: getError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          data: { subscriptions },
          message: '구독 목록을 성공적으로 조회했습니다.'
        });

      case 'POST':
        // 새 구독 생성 (인증 필요)
        const userForPost = requireAuth(req, res);
        if (!userForPost) return; // 이미 응답 전송됨
        
        const { license_id, user_id } = req.body;

        if (!license_id) {
          return res.status(400).json({ 
            success: false,
            error: '라이선스 ID가 필요합니다.',
            message: '구독할 라이선스를 선택해주세요.'
          });
        }

        // 일반 사용자는 본인만 구독 가능
        const targetUserId = userForPost.role === 'admin' ? (user_id || userForPost.id) : userForPost.id;

        // 라이선스 정보 조회
        const { data: license, error: licenseError } = await supabase
          .from('licenses')
          .select('duration_months, price')
          .eq('id', license_id)
          .eq('is_active', true)
          .single();

        if (licenseError || !license) {
          return res.status(404).json({ 
            success: false,
            error: '유효한 라이선스를 찾을 수 없습니다.',
            message: '선택한 라이선스가 존재하지 않습니다.'
          });
        }

        // 구독 종료일 계산
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + license.duration_months);

        const { data: newSubscription, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: targetUserId,
            license_id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            payment_amount: license.price
          })
          .select()
          .single();

        if (createError) {
          return res.status(500).json({ 
            success: false,
            error: '구독 생성 실패', 
            message: createError.message 
          });
        }

        return res.status(201).json({ 
          success: true,
          data: { subscription: newSubscription },
          message: '구독이 성공적으로 생성되었습니다.'
        });

      case 'PUT':
        // 구독 상태 수정 (관리자만)
        const userForPut = requireAuth(req, res);
        if (!userForPut) return; // 이미 응답 전송됨
        
        if (userForPut.role !== 'admin') {
          return res.status(403).json({ 
            success: false,
            error: '관리자 권한이 필요합니다.',
            message: '접근 권한이 없습니다.'
          });
        }

        const { id } = req.query;
        const { status } = req.body;

        if (!id || !status) {
          return res.status(400).json({ 
            success: false,
            error: '구독 ID와 상태가 필요합니다.',
            message: '필수 정보를 입력해주세요.'
          });
        }

        const { data: updatedSubscription, error: updateError } = await supabase
          .from('subscriptions')
          .update({ status })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({ 
            success: false,
            error: '구독 수정 실패', 
            message: updateError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          data: { subscription: updatedSubscription },
          message: '구독이 성공적으로 수정되었습니다.'
        });

      case 'DELETE':
        // 구독 취소 (관리자만)
        const userForDelete = requireAuth(req, res);
        if (!userForDelete) return; // 이미 응답 전송됨
        
        if (userForDelete.role !== 'admin') {
          return res.status(403).json({ 
            success: false,
            error: '관리자 권한이 필요합니다.',
            message: '접근 권한이 없습니다.'
          });
        }

        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ 
            success: false,
            error: '구독 ID가 필요합니다.',
            message: '취소할 구독을 선택해주세요.'
          });
        }

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', deleteId);

        if (deleteError) {
          return res.status(500).json({ 
            success: false,
            error: '구독 취소 실패', 
            message: deleteError.message 
          });
        }

        return res.status(200).json({ 
          success: true,
          data: null,
          message: '구독이 성공적으로 취소되었습니다.'
        });

      default:
        return res.status(405).json({ 
          success: false,
          error: '지원하지 않는 HTTP 메서드입니다.',
          message: '지원하지 않는 요청입니다.'
        });
    }
  } catch (error) {
    console.error('구독 API 오류:', error);
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