import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  Stack,
  Avatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Business as InstitutionIcon,
  Person as PersonIcon,
  Assignment as LicenseIcon,
  DateRange as DateIcon,
  TrendingUp as StatusIcon
} from '@mui/icons-material';
import { Subscription } from '../../types';
import { subscriptionsAPI } from '../../lib/api';
import { getErrorMessage } from '../../utils/errors';

interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
}

const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    expired: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 구독 목록 조회
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionsAPI.getAll();
      const subscriptionsData = response.data.subscriptions || [];
      setSubscriptions(subscriptionsData);
      
      // 통계 계산
      const total = subscriptionsData.length;
      const active = subscriptionsData.filter((s: Subscription) => s.status === 'active').length;
      const expired = subscriptionsData.filter((s: Subscription) => s.status === 'expired').length;
      const cancelled = subscriptionsData.filter((s: Subscription) => s.status === 'cancelled').length;
      
      setStats({ total, active, expired, cancelled });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 구독 상태 변경
  const updateSubscriptionStatus = async (id: string, status: 'active' | 'expired' | 'cancelled') => {
    try {
      await subscriptionsAPI.update(id, { status });
      setSuccess('구독 상태가 성공적으로 변경되었습니다.');
      fetchSubscriptions();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // 구독 삭제
  const deleteSubscription = async (id: string) => {
    try {
      await subscriptionsAPI.cancel(id);
      setSuccess('구독이 성공적으로 삭제되었습니다.');
      setDeleteDialogOpen(false);
      fetchSubscriptions();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // 필터링된 구독 목록
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      subscription.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.license?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.institution?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 상태별 한글 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'expired': return '만료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        구독 관리
      </Typography>

      {/* 알림 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <StatusIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  전체 구독
                </Typography>
                <Typography variant="h5">
                  {stats.total}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <ApproveIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  활성 구독
                </Typography>
                <Typography variant="h5">
                  {stats.active}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <DateIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  만료된 구독
                </Typography>
                <Typography variant="h5">
                  {stats.expired}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                <RejectIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  취소된 구독
                </Typography>
                <Typography variant="h5">
                  {stats.cancelled}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* 필터 및 검색 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="검색"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="사용자명, 라이선스명, 기관명으로 검색"
            sx={{ minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>상태 필터</InputLabel>
            <Select
              value={statusFilter}
              label="상태 필터"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="active">활성</MenuItem>
              <MenuItem value="expired">만료</MenuItem>
              <MenuItem value="cancelled">취소</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={fetchSubscriptions}
            disabled={loading}
          >
            새로고침
          </Button>
        </Stack>
      </Paper>

      {/* 구독 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>사용자</TableCell>
              <TableCell>기관</TableCell>
              <TableCell>라이선스</TableCell>
              <TableCell>시작일</TableCell>
              <TableCell>종료일</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>가격</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  구독이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {subscription.user?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {subscription.user?.email || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InstitutionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {subscription.institution?.name || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LicenseIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {subscription.license?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {subscription.license?.duration_months}개월
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(subscription.start_date)}</TableCell>
                  <TableCell>{formatDate(subscription.end_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(subscription.status)}
                      color={getStatusColor(subscription.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {subscription.license?.price ? formatPrice(subscription.license.price) : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="상세 보기">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setViewDialogOpen(true);
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="상태 변경">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          구독 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>사용자 정보</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">이름</Typography>
                    <Typography variant="body1">{selectedSubscription.user?.name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">이메일</Typography>
                    <Typography variant="body1">{selectedSubscription.user?.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">역할</Typography>
                    <Typography variant="body1">{selectedSubscription.user?.role || 'N/A'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>기관 정보</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">기관명</Typography>
                    <Typography variant="body1">{selectedSubscription.institution?.name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">도메인</Typography>
                    <Typography variant="body1">{selectedSubscription.institution?.domain || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">연락처</Typography>
                    <Typography variant="body1">{selectedSubscription.institution?.contact_email || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>라이선스 정보</Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2 
                }}>
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">라이선스명</Typography>
                      <Typography variant="body1">{selectedSubscription.license?.name || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">설명</Typography>
                      <Typography variant="body1">{selectedSubscription.license?.description || 'N/A'}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">가격</Typography>
                      <Typography variant="body1">
                        {selectedSubscription.license?.price ? formatPrice(selectedSubscription.license.price) : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">기간</Typography>
                      <Typography variant="body1">{selectedSubscription.license?.duration_months}개월</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">최대 사용자</Typography>
                      <Typography variant="body1">{selectedSubscription.license?.max_users}명</Typography>
                    </Box>
                  </Box>
                </Box>
                {selectedSubscription.license?.features && selectedSubscription.license.features.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>기능</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedSubscription.license.features.map((feature, index) => (
                        <Chip key={index} label={feature} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>구독 정보</Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2 
                }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">시작일</Typography>
                    <Typography variant="body1">{formatDate(selectedSubscription.start_date)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">종료일</Typography>
                    <Typography variant="body1">{formatDate(selectedSubscription.end_date)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">상태</Typography>
                    <Chip
                      label={getStatusText(selectedSubscription.status)}
                      color={getStatusColor(selectedSubscription.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>구독 상태 변경</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Box sx={{ pt: 2, minWidth: 300 }}>
              <Typography variant="body1" gutterBottom>
                <strong>{selectedSubscription.user?.name}</strong>님의 
                <strong>{selectedSubscription.license?.name}</strong> 구독 상태를 변경하시겠습니까?
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>새 상태</InputLabel>
                <Select
                  value={selectedSubscription.status}
                  label="새 상태"
                  onChange={(e) => {
                    if (selectedSubscription) {
                      setSelectedSubscription({
                        ...selectedSubscription,
                        status: e.target.value as 'active' | 'expired' | 'cancelled'
                      });
                    }
                  }}
                >
                  <MenuItem value="active">활성</MenuItem>
                  <MenuItem value="expired">만료</MenuItem>
                  <MenuItem value="cancelled">취소</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button
            onClick={() => {
              if (selectedSubscription) {
                updateSubscriptionStatus(selectedSubscription.id, selectedSubscription.status);
                setEditDialogOpen(false);
              }
            }}
            variant="contained"
          >
            변경
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>구독 삭제</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Typography>
              <strong>{selectedSubscription.user?.name}</strong>님의 
              <strong>{selectedSubscription.license?.name}</strong> 구독을 정말 삭제하시겠습니까?
              <br /><br />
              이 작업은 되돌릴 수 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            onClick={() => {
              if (selectedSubscription) {
                deleteSubscription(selectedSubscription.id);
              }
            }}
            color="error"
            variant="contained"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;