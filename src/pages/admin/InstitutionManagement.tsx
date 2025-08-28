import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import { Institution } from '../../types';
import { institutionsAPI } from '../../lib/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useToast } from '../../contexts/ToastContext';

interface InstitutionFormData {
  name: string;
  domain: string;
  contact_email: string;
  is_active: boolean;
}

const InstitutionManagement: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState<InstitutionFormData>({
    name: '',
    domain: '',
    contact_email: '',
    is_active: false // 기본값을 false로 변경
  });

  const { handleApiError } = useErrorHandler();
  const { showSuccess } = useToast();

  // 기관 목록 조회 (관리자는 모든 기관 조회)
  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await institutionsAPI.getAll();
      setInstitutions(response.data.institutions || []);
    } catch (err) {
      handleApiError(err, '기관 목록 조회');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // 기관 상태 토글
  const handleToggleStatus = async (institution: Institution) => {
    try {
      const newStatus = !institution.is_active;
      await institutionsAPI.update(institution.id, {
        ...institution,
        is_active: newStatus
      });
      showSuccess(`기관이 ${newStatus ? '활성화' : '비활성화'}되었습니다.`);
      fetchInstitutions();
    } catch (err) {
      handleApiError(err, '기관 상태 변경');
    }
  };

  // 기관 추가/수정
  const handleSubmit = async () => {
    try {
      if (editingInstitution) {
        await institutionsAPI.update(editingInstitution.id, formData);
        showSuccess('기관이 성공적으로 수정되었습니다.');
      } else {
        await institutionsAPI.create(formData);
        showSuccess('기관이 성공적으로 추가되었습니다.');
      }
      
      setOpenDialog(false);
      resetForm();
      fetchInstitutions();
    } catch (err) {
      handleApiError(err, editingInstitution ? '기관 수정' : '기관 추가');
    }
  };

  // 기관 삭제
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 기관을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await institutionsAPI.delete(id);
      showSuccess('기관이 성공적으로 삭제되었습니다.');
      fetchInstitutions();
    } catch (err) {
      handleApiError(err, '기관 삭제');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      contact_email: '',
      is_active: false // 기본값을 false로 변경
    });
    setEditingInstitution(null);
  };

  // 수정 모드로 전환
  const handleEdit = (institution: Institution) => {
    setEditingInstitution(institution);
    setFormData({
      name: institution.name,
      domain: institution.domain,
      contact_email: institution.contact_email,
      is_active: institution.is_active
    });
    setOpenDialog(true);
  };

  // 새 기관 추가 모드
  const handleAdd = () => {
    resetForm();
    setOpenDialog(true);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h4" component="h1">
            기관 관리
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          기관 추가
        </Button>
      </Box>

      {/* 기관 목록 테이블 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>기관명</TableCell>
                <TableCell>도메인</TableCell>
                <TableCell>연락처 이메일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : institutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    등록된 기관이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                institutions.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell>{institution.name}</TableCell>
                    <TableCell>{institution.domain}</TableCell>
                    <TableCell>{institution.contact_email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={institution.is_active ? '활성' : '비활성'}
                          color={institution.is_active ? 'success' : 'default'}
                          size="small"
                        />
                        <Tooltip title={institution.is_active ? '비활성화' : '활성화'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(institution)}
                            color={institution.is_active ? 'success' : 'default'}
                          >
                            {institution.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(institution.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="수정">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(institution)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(institution.id)}
                        >
                          <DeleteIcon />
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

      {/* 기관 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingInstitution ? '기관 수정' : '기관 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="기관명"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="도메인"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              fullWidth
              required
              placeholder="example.com"
            />
            <TextField
              label="연락처 이메일"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              fullWidth
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="활성 상태"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.domain || !formData.contact_email}
          >
            {editingInstitution ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstitutionManagement;