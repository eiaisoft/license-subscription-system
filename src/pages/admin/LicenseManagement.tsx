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
  Switch,
  FormControlLabel,
  InputAdornment,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as LicenseIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { License } from '../../types';
import { licensesAPI } from '../../lib/api';
import { getErrorMessage } from '../../utils/errors';

interface LicenseFormData {
  name: string;
  description: string;
  price: number;
  duration_months: number;
  max_users: number;
  features: string[];
  is_active: boolean;
}

const LicenseManagement: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [formData, setFormData] = useState<LicenseFormData>({
    name: '',
    description: '',
    price: 0,
    duration_months: 12,
    max_users: 1,
    features: [],
    is_active: true
  });
  const [featureInput, setFeatureInput] = useState('');

  // 라이선스 목록 조회
  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await licensesAPI.getAll();
      setLicenses(response.data.licenses || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 라이선스 추가/수정
  const handleSubmit = async () => {
    try {
      if (editingLicense) {
        await licensesAPI.update(editingLicense.id, formData);
        setSuccess('라이선스가 성공적으로 수정되었습니다.');
      } else {
        await licensesAPI.create(formData);
        setSuccess('라이선스가 성공적으로 추가되었습니다.');
      }
      
      setOpenDialog(false);
      resetForm();
      fetchLicenses();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // 라이선스 삭제
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 라이선스를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await licensesAPI.delete(id);
      setSuccess('라이선스가 성공적으로 삭제되었습니다.');
      fetchLicenses();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // 라이선스 활성화/비활성화 토글
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await licensesAPI.update(id, { is_active: !currentStatus });
      setSuccess(`라이선스가 성공적으로 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
      fetchLicenses();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration_months: 12,
      max_users: 1,
      features: [],
      is_active: true
    });
    setFeatureInput('');
    setEditingLicense(null);
  };

  // 수정 모드로 전환
  const handleEdit = (license: License) => {
    setEditingLicense(license);
    setFormData({
      name: license.name,
      description: license.description,
      price: license.price,
      duration_months: license.duration_months,
      max_users: license.max_users,
      features: [...license.features],
      is_active: license.is_active
    });
    setOpenDialog(true);
  };

  // 새 라이선스 추가 모드
  const handleAdd = () => {
    resetForm();
    setOpenDialog(true);
  };

  // 기능 추가
  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  // 기능 제거
  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchLicenses();
  }, []);

  // 알림 메시지 자동 숨김
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LicenseIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            라이선스 관리
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          새 라이선스 추가
        </Button>
      </Box>

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

      {/* 라이선스 목록 테이블 */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>라이선스명</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>가격</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>기간</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>최대 사용자</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>상태</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>생성일</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">로딩 중...</Typography>
                  </TableCell>
                </TableRow>
              ) : licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">등록된 라이선스가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {license.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {license.description}
                        </Typography>
                        {license.features.length > 0 && (
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {license.features.slice(0, 3).map((feature, index) => (
                              <Chip
                                key={index}
                                label={feature}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                            {license.features.length > 3 && (
                              <Chip
                                label={`+${license.features.length - 3}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {formatPrice(license.price)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: 'info.main' }} />
                        <Typography variant="body2">
                          {license.duration_months}개월
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="body2">
                          {license.max_users}명
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={license.is_active}
                            onChange={() => handleToggleActive(license.id, license.is_active)}
                            size="small"
                          />
                        }
                        label={
                          <Chip
                            label={license.is_active ? '활성' : '비활성'}
                            color={license.is_active ? 'success' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        }
                        sx={{ m: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(license.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Tooltip title="수정">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(license)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(license.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 라이선스 추가/수정 다이얼로그 */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLicense ? '라이선스 정보 수정' : '새 라이선스 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="라이선스명"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                label="가격"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                }}
                sx={{ flex: 1 }}
                required
              />
              <TextField
                label="기간 (개월)"
                type="number"
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: Number(e.target.value) })}
                sx={{ flex: 1 }}
                required
              />
              <TextField
                label="최대 사용자 수"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: Number(e.target.value) })}
                sx={{ flex: 1 }}
                required
              />
            </Box>

            <Divider sx={{ my: 3 }} />
            
            {/* 기능 관리 */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              라이선스 기능
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="기능 추가"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                sx={{ flex: 1 }}
                placeholder="예: 무제한 저장공간"
              />
              <Button 
                variant="outlined" 
                onClick={handleAddFeature}
                disabled={!featureInput.trim()}
              >
                추가
              </Button>
            </Box>
            
            {formData.features.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>추가된 기능:</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {formData.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      onDelete={() => handleRemoveFeature(index)}
                      color="primary"
                      variant="outlined"
                      icon={<StarIcon />}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="라이선스 활성화"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.description || formData.price <= 0}
          >
            {editingLicense ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenseManagement;