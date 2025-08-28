import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  // Grid, // 제거
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Assignment as LicenseIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { License, Subscription } from '../../types';
import { licensesAPI, subscriptionsAPI } from '../../lib/api';
import { getErrorMessage } from '../../utils/errors';

interface LicenseApplication {
  licenseId: string;
  reason: string;
  expectedUsers: number;
  startDate: string;
  duration: number; // months
}

const LicenseStore: React.FC = () => {
  const { user } = useAuth(); // loading: authLoading 제거
  const [licenses, setLicenses] = useState<License[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationDialog, setApplicationDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [application, setApplication] = useState<LicenseApplication>({
    licenseId: '',
    reason: '',
    expectedUsers: 1,
    startDate: new Date().toISOString().split('T')[0],
    duration: 12
  });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [licensesData, subscriptionsData] = await Promise.all([
          licensesAPI.getAll(),
          subscriptionsAPI.getAll() // getByUser 대신 getAll 사용
        ]);
        setLicenses(licensesData.data || []);
        // 현재 사용자의 구독만 필터링
        const userSubs = subscriptionsData.data?.filter(
          (sub: Subscription) => sub.user_id === user?.id
        ) || [];
        setUserSubscriptions(userSubs);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        setAlert({ type: 'error', message: getErrorMessage(error) });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic plan':
        return 'primary';
      case 'professional plan':
        return 'secondary';
      case 'enterprise plan':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isLicenseSubscribed = (licenseId: string): boolean => {
    return userSubscriptions.some(
      sub => sub.license_id === licenseId && sub.status === 'active'
    );
  };

  const handleApplyLicense = (license: License) => {
    setSelectedLicense(license);
    setApplication(prev => ({
      ...prev,
      licenseId: license.id
    }));
    setApplicationDialog(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedLicense || !application.reason.trim()) {
      setAlert({ type: 'error', message: '모든 필수 항목을 입력해주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      await subscriptionsAPI.create({
        license_id: application.licenseId,
        reason: application.reason,
        expected_users: application.expectedUsers,
        start_date: application.startDate,
        duration_months: application.duration
      });
      
      setAlert({ 
        type: 'success', 
        message: `${selectedLicense.name} 라이선스 신청이 완료되었습니다. 승인까지 1-2일 소요됩니다.` 
      });
      setApplicationDialog(false);
      setApplication({
        licenseId: '',
        reason: '',
        expectedUsers: 1,
        startDate: new Date().toISOString().split('T')[0],
        duration: 12
      });
    } catch (error) {
      setAlert({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
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
          라이선스 스토어
        </Typography>
        <Typography variant="body1" color="text.secondary">
          귀하의 기관에 적합한 AI 라이선스를 선택하고 신청하세요.
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

      {/* Current Subscriptions */}
      {userSubscriptions.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            현재 구독 중인 라이선스
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {userSubscriptions.map((subscription) => (
              <Card key={subscription.id} sx={{ border: '2px solid', borderColor: 'success.main' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <CheckIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {subscription.license?.name}
                      </Typography>
                      <Chip label="활성" color="success" size="small" />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    만료일: {new Date(subscription.end_date).toLocaleDateString('ko-KR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    기관: {subscription.institution?.name}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Available Licenses */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        이용 가능한 라이선스
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {licenses.map((license) => {
          const isSubscribed = isLicenseSubscribed(license.id);
          const planColor = getPlanColor(license.name);
          
          return (
            <Card 
              key={license.id} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                ...(license.name.toLowerCase().includes('professional') && {
                  border: '2px solid',
                  borderColor: 'primary.main'
                })
              }}
            >
              {license.name.toLowerCase().includes('professional') && (
                <Chip
                  label="추천"
                  color="primary"
                  size="small"
                  icon={<StarIcon />}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 1
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${planColor}.main`, mr: 2 }}>
                    <LicenseIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {license.name}
                    </Typography>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(license.price)}
                      <Typography component="span" variant="body2" color="text.secondary">
                        /월
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {license.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <List dense>
                  {license.features?.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {license.max_users === -1 ? '무제한' : `최대 ${license.max_users}명`}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {license.duration_months}개월
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant={isSubscribed ? "outlined" : "contained"}
                  disabled={isSubscribed}
                  onClick={() => handleApplyLicense(license)}
                  startIcon={isSubscribed ? <CheckIcon /> : <AddIcon />}
                >
                  {isSubscribed ? '구독 중' : '신청하기'}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {/* Application Dialog */}
      <Dialog 
        open={applicationDialog} 
        onClose={() => setApplicationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LicenseIcon sx={{ mr: 1 }} />
            {selectedLicense?.name} 신청
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="신청 사유"
              multiline
              rows={4}
              value={application.reason}
              onChange={(e) => setApplication(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="라이선스가 필요한 이유를 상세히 작성해주세요."
              sx={{ mb: 3 }}
              required
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
              <TextField
                label="예상 사용자 수"
                type="number"
                value={application.expectedUsers}
                onChange={(e) => setApplication(prev => ({ ...prev, expectedUsers: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: selectedLicense?.max_users === -1 ? 1000 : selectedLicense?.max_users }}
              />
              <TextField
                label="사용 기간 (개월)"
                type="number"
                value={application.duration}
                onChange={(e) => setApplication(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                inputProps={{ min: 1, max: 36 }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="시작 희망일"
              type="date"
              value={application.startDate}
              onChange={(e) => setApplication(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
            
            <Alert severity="info" sx={{ mt: 3 }}>
              신청 후 관리자 승인까지 1-2일 소요됩니다. 승인 결과는 이메일로 안내드립니다.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplicationDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={handleSubmitApplication}
            variant="contained"
            disabled={submitting || !application.reason.trim()}
          >
            {submitting ? <CircularProgress size={20} /> : '신청하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LicenseStore;