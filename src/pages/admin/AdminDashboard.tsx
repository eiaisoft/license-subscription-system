import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Assignment as LicenseIcon,
  Subscriptions as SubscriptionIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalInstitutions: number;
  totalLicenses: number;
  totalSubscriptions: number;
  totalUsers: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'subscription' | 'user' | 'license' | 'institution';
  title: string;
  description: string;
  timestamp: string;
  status?: 'pending' | 'approved' | 'rejected';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalInstitutions: 0,
    totalLicenses: 0,
    totalSubscriptions: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingSubscriptions: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // 통화 포맷팅 함수
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // Mock data
  const mockStats: DashboardStats = {
    totalInstitutions: 25,
    totalLicenses: 12,
    totalSubscriptions: 156,
    totalUsers: 1247,
    activeSubscriptions: 142,
    pendingSubscriptions: 14,
    monthlyRevenue: 15600000,
    revenueGrowth: 12.5
  };

  const mockActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'subscription',
      title: '새로운 구독 신청',
      description: '전북대학교에서 Premium 라이선스 신청',
      timestamp: '2024-01-20T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      type: 'user',
      title: '새 사용자 등록',
      description: '김철수님이 계정을 생성했습니다',
      timestamp: '2024-01-20T09:15:00Z'
    },
    {
      id: '3',
      type: 'license',
      title: '라이선스 업데이트',
      description: 'Standard 라이선스 기능이 업데이트되었습니다',
      timestamp: '2024-01-19T16:45:00Z'
    },
    {
      id: '4',
      type: 'institution',
      title: '기관 정보 수정',
      description: '서울대학교 기관 정보가 업데이트되었습니다',
      timestamp: '2024-01-19T14:20:00Z'
    },
    {
      id: '5',
      type: 'subscription',
      title: '구독 승인',
      description: '고려대학교 Enterprise 라이선스 승인 완료',
      timestamp: '2024-01-19T11:30:00Z',
      status: 'approved'
    }
  ];

  useEffect(() => {
    // 실제 환경에서는 API 호출
    const fetchData = async () => {
      try {
        // API 호출 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(mockStats);
        setRecentActivities(mockActivities);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <SubscriptionIcon />;
      case 'user':
        return <PeopleIcon />;
      case 'license':
        return <LicenseIcon />;
      case 'institution':
        return <BusinessIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getStatusChip = (status?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      pending: { label: '대기중', color: 'warning' as const },
      approved: { label: '승인됨', color: 'success' as const },
      rejected: { label: '거부됨', color: 'error' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Chip label={config.label} color={config.color} size="small" /> : null;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          대시보드
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        관리자 대시보드
      </Typography>

      {/* Stats Cards - CSS Grid 사용 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  총 기관 수
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalInstitutions}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BusinessIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  총 라이선스 수
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalLicenses}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <LicenseIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  총 구독 수
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalSubscriptions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  활성: {stats.activeSubscriptions} | 대기: {stats.pendingSubscriptions}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <SubscriptionIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  총 사용자 수
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalUsers}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <PeopleIcon />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Revenue and Subscription Status Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              월간 수익
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="div" sx={{ mr: 2 }}>
                {formatCurrency(stats.monthlyRevenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stats.revenueGrowth > 0 ? (
                  <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={stats.revenueGrowth > 0 ? 'success.main' : 'error.main'}
                >
                  {Math.abs(stats.revenueGrowth)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              전월 대비 {stats.revenueGrowth > 0 ? '증가' : '감소'}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              구독 현황
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">활성 구독</Typography>
                <Typography variant="body2">
                  {stats.activeSubscriptions}/{stats.totalSubscriptions}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(stats.activeSubscriptions / stats.totalSubscriptions) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {stats.pendingSubscriptions}개 구독이 승인 대기 중
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activities */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            최근 활동
          </Typography>
          <Button size="small" onClick={() => navigate('/admin/activities')}>
            전체 보기
          </Button>
        </Box>
        
        <List>
          {recentActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(activity.status)}
                    <IconButton edge="end" size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary' }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.timestamp).toLocaleString('ko-KR')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;