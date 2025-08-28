import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Assignment as LicenseIcon,
  People as PeopleIcon,
  Subscriptions as SubscriptionsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { License, Subscription } from '../types';

// CSS Grid 스타일 정의
const StatsGrid = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(4, 1fr)'
  },
  gap: 3,
  mb: 4
};

const ContentGrid = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    md: 'repeat(2, 1fr)'
  },
  gap: 3
};

interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalUsers?: number; // 관리자만
  totalInstitutions?: number; // 관리자만
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
  
      // 통계 데이터 가져오기
      const [licensesRes, subscriptionsRes] = await Promise.all([
        api.get('/licenses'),
        api.get('/subscriptions')
      ]);
  
      // ApiResponse 구조에 맞게 데이터 추출
      const licenses = licensesRes.data || [];
      const subscriptions = subscriptionsRes.data || [];
  
      // 통계 계산
      const dashboardStats: DashboardStats = {
        totalLicenses: licenses.length,
        activeLicenses: licenses.filter((l: License) => l.is_active === true).length,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter((s: Subscription) => s.status === 'active').length
      };
  
      // 관리자인 경우 추가 통계
      if (user?.role === 'admin') {
        const [usersRes, institutionsRes] = await Promise.all([
          api.get('/users'),
          api.get('/institutions')
        ]);
        dashboardStats.totalUsers = usersRes.data?.length || 0;
        dashboardStats.totalInstitutions = institutionsRes.data?.length || 0;
      }
  
      setStats(dashboardStats);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          안녕하세요, {user?.name}님! 현재 시스템 현황을 확인하세요.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Box sx={StatsGrid}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LicenseIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">라이선스</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {stats?.activeLicenses || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              활성 / 전체 {stats?.totalLicenses || 0}
            </Typography>
          </CardContent>
        </Card>
      
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SubscriptionsIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="h6">구독</Typography>
            </Box>
            <Typography variant="h4" color="secondary">
              {stats?.activeSubscriptions || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              활성 / 전체 {stats?.totalSubscriptions || 0}
            </Typography>
          </CardContent>
        </Card>
      
        {/* 관리자용 추가 통계 */}
        {user?.role === 'admin' && (
          <>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">사용자</Typography>
                </Box>
                <Typography variant="h4" color="info">
                  {stats?.totalUsers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  전체 사용자
                </Typography>
              </CardContent>
            </Card>
      
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">기관</Typography>
                </Box>
                <Typography variant="h4" color="success">
                  {stats?.totalInstitutions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  등록된 기관
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
      
      {/* 하단 콘텐츠도 동일하게 처리 */}
      <Box sx={ContentGrid}>
        <Card>
          {/* 최근 라이선스 내용 */}
        </Card>
        <Card>
          {/* 최근 구독 내용 */}
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;