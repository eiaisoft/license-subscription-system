import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Alert,
  Button,
  Chip,
  // Grid, // 제거
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Assignment as LicenseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription } from '../../types';
import { subscriptionsAPI } from '../../lib/api';
import { getErrorMessage } from '../../utils/errors';

const MySubscriptions: React.FC = () => {
  const { user } = useAuth(); // loading: authLoading 제거
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const data = await subscriptionsAPI.getAll();
        // 현재 사용자의 구독만 필터링
        const userSubs = data.data?.filter(
          (sub: Subscription) => sub.user_id === user?.id
        ) || [];
        setSubscriptions(userSubs);
      } catch (error) {
        console.error('구독 정보 로딩 실패:', error);
        setAlert({ type: 'error', message: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchSubscriptions();
    }
  }, [user?.id]);

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { label: '활성', color: 'success' as const, icon: <CheckIcon /> },
      pending: { label: '승인 대기', color: 'warning' as const, icon: <ScheduleIcon /> },
      expired: { label: '만료', color: 'default' as const, icon: <CancelIcon /> },
      cancelled: { label: '취소됨', color: 'error' as const, icon: <CancelIcon /> }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small" 
        icon={config.icon}
      />
    );
  };

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUsageProgress = (subscription: Subscription): number => {
    const start = new Date(subscription.start_date);
    const end = new Date(subscription.end_date);
    const now = new Date();
    
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const usedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.min(Math.max((usedDays / totalDays) * 100, 0), 100);
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;
    
    try {
      await subscriptionsAPI.cancel(selectedSubscription.id);
      
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === selectedSubscription.id 
            ? { ...sub, status: 'cancelled' }
            : sub
        )
      );
      
      setAlert({ type: 'success', message: '구독이 취소되었습니다.' });
      setCancelDialog(false);
      setSelectedSubscription(null);
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          내 구독 관리
        </Typography>
        <Typography variant="body1" color="text.secondary">
          현재 구독 중인 라이선스를 관리하고 사용 현황을 확인하세요.
        </Typography>
      </Box>

      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <LicenseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              구독 중인 라이선스가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              라이선스 스토어에서 적합한 플랜을 선택해보세요.
            </Typography>
            <Button variant="contained" href="/licenses">
              라이선스 둘러보기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {subscriptions.map((subscription) => {
            const daysRemaining = getDaysRemaining(subscription.end_date);
            const usageProgress = getUsageProgress(subscription);
            
            return (
              <Card key={subscription.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LicenseIcon sx={{ mr: 2, fontSize: 32 }} />
                      <Box>
                        <Typography variant="h6">
                          {subscription.license?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {subscription.license?.description}
                        </Typography>
                      </Box>
                    </Box>
                    {getStatusChip(subscription.status)}
                  </Box>
                  
                  {subscription.status === 'active' && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          사용 기간 진행률
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {daysRemaining > 0 ? `${daysRemaining}일 남음` : '만료됨'}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={usageProgress}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={daysRemaining <= 7 ? 'warning' : 'primary'}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        시작일
                      </Typography>
                      <Typography variant="body2">
                        {new Date(subscription.start_date).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        종료일
                      </Typography>
                      <Typography variant="body2">
                        {new Date(subscription.end_date).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        최대 사용자
                      </Typography>
                      <Typography variant="body2">
                        {subscription.license?.max_users === -1 ? '무제한' : `${subscription.license?.max_users}명`}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {subscription.status === 'active' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setCancelDialog(true);
                        }}
                      >
                        구독 취소
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                    >
                      갱신
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>구독 취소 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 <strong>{selectedSubscription?.license?.name}</strong> 구독을 취소하시겠습니까?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            구독을 취소하면 즉시 서비스 이용이 중단되며, 남은 기간에 대한 환불은 불가능합니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            취소
          </Button>
          <Button onClick={handleCancelSubscription} color="error" variant="contained">
            구독 취소
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MySubscriptions;