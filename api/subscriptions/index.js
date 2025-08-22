const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
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

    switch (req.method) {
      case 'GET':
        // 구독 목록 조회 (관리자는 모든 구독, 일반 사용자는 본인 구독만)
        let query = supabase
          .from('subscriptions')
          .select(`
            *,
            user:users(name, email),
            license:licenses(name, institution:institutions(name))
          `);

        if (decoded.role !== 'admin') {
          query = query.eq('user_id', decoded.userId);
        }

        const { data: subscriptions, error: fetchError } = await query
          .order('created_at', { ascending: false });

        if (fetchError) {
          return res.status(500).json({ error: '구독 조회 실패', details: fetchError.message });
        }

        return res.status(200).json({ subscriptions });

      case 'POST':
        // 새 구독 생성
        const { license_id, user_id } = req.body;

        if (!license_id) {
          return res.status(400).json({ error: '라이선스 ID가 필요합니다.' });
        }

        // 일반 사용자는 본인만 구독 가능
        const targetUserId = decoded.role === 'admin' ? (user_id || decoded.userId) : decoded.userId;

        // 라이선스 정보 조회
        const { data: license, error: licenseError } = await supabase
          .from('licenses')
          .select('duration_months, price')
          .eq('id', license_id)
          .eq('is_active', true)
          .single();

        if (licenseError || !license) {
          return res.status(404).json({ error: '유효한 라이선스를 찾을 수 없습니다.' });
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
          return res.status(500).json({ error: '구독 생성 실패', details: createError.message });
        }

        return res.status(201).json({ subscription: newSubscription });

      case 'PUT':
        // 구독 상태 수정 (관리자만)
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
        }

        const { id } = req.query;
        const { status } = req.body;

        if (!id || !status) {
          return res.status(400).json({ error: '구독 ID와 상태가 필요합니다.' });
        }

        const { data: updatedSubscription, error: updateError } = await supabase
          .from('subscriptions')
          .update({ status })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({ error: '구독 수정 실패', details: updateError.message });
        }

        return res.status(200).json({ subscription: updatedSubscription });

      case 'DELETE':
        // 구독 취소 (관리자만)
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
        }

        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ error: '구독 ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', deleteId);

        if (deleteError) {
          return res.status(500).json({ error: '구독 취소 실패', details: deleteError.message });
        }

        return res.status(200).json({ message: '구독이 성공적으로 취소되었습니다.' });

      default:
        return res.status(405).json({ error: '지원하지 않는 HTTP 메서드입니다.' });
    }
  } catch (error) {
    console.error('구독 API 오류:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
};