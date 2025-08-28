import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { User, Institution } from '../../types/auth';

interface UserWithInstitution extends User {
  institution?: Institution;
}

interface UserFormData {
  email: string;
  name: string;
  role: 'admin' | 'user';
  institution_id: string;
  password?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithInstitution[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<UserWithInstitution | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'user',
    institution_id: '',
    password: ''
  });
  
  // Notification states
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Mock data for development
  const mockUsers: UserWithInstitution[] = useMemo(() => [
    {
      id: '1',
      email: 'admin@eiaisoft.com',
      name: '관리자',
      role: 'admin',
      institution_id: '1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      institution: {
        id: '1',
        name: '전북대학교',
        domain: 'jbnu.ac.kr',
        contact_email: 'contact@jbnu.ac.kr',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: '2',
      email: 'user1@jbnu.ac.kr',
      name: '김철수',
      role: 'user',
      institution_id: '1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      institution: {
        id: '1',
        name: '전북대학교',
        domain: 'jbnu.ac.kr',
        contact_email: 'contact@jbnu.ac.kr',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: '3',
      email: 'user2@snu.ac.kr',
      name: '이영희',
      role: 'user',
      institution_id: '2',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      institution: {
        id: '2',
        name: '서울대학교',
        domain: 'snu.ac.kr',
        contact_email: 'contact@snu.ac.kr',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
  ], []);

  const mockInstitutions: Institution[] = useMemo(() => [
    {
      id: '1',
      name: '전북대학교',
      domain: 'jbnu.ac.kr',
      contact_email: 'contact@jbnu.ac.kr',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: '서울대학교',
      domain: 'snu.ac.kr',
      contact_email: 'contact@snu.ac.kr',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ], []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      showNotification('사용자 목록 조회에 실패했습니다.', 'error');
      setLoading(false);
    }
  }, [mockUsers]); // mockUsers 의존성 추가

  const fetchInstitutions = useCallback(async () => {
    try {
      setInstitutions(mockInstitutions);
    } catch (error) {
      console.error('기관 목록 조회 실패:', error);
    }
  }, [mockInstitutions]); // mockInstitutions 의존성 추가

  useEffect(() => {
    fetchUsers();
    fetchInstitutions();
  }, [fetchUsers, fetchInstitutions]);
  
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode: 'add' | 'edit', user?: UserWithInstitution) => {
    setDialogMode(mode);
    if (mode === 'edit' && user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role,
        institution_id: user.institution_id || '',
        password: ''
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        name: '',
        role: 'user',
        institution_id: '',
        password: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      name: '',
      role: 'user',
      institution_id: '',
      password: ''
    });
  };

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/users', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        
        // Mock implementation
        const newUser: UserWithInstitution = {
          id: Date.now().toString(),
          email: formData.email,
          name: formData.name,
          role: formData.role,
          institution_id: formData.institution_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          institution: institutions.find(inst => inst.id === formData.institution_id)
        };
        
        setUsers(prev => [...prev, newUser]);
        showNotification('사용자가 성공적으로 추가되었습니다.', 'success');
      } else {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/users/${selectedUser?.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        
        // Mock implementation
        setUsers(prev => prev.map(user => 
          user.id === selectedUser?.id 
            ? {
                ...user,
                email: formData.email,
                name: formData.name,
                role: formData.role,
                institution_id: formData.institution_id,
                updated_at: new Date().toISOString(),
                institution: institutions.find(inst => inst.id === formData.institution_id)
              }
            : user
        ));
        showNotification('사용자 정보가 성공적으로 수정되었습니다.', 'success');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      showNotification('사용자 저장에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      
      // Mock implementation
      setUsers(prev => prev.filter(user => user.id !== userId));
      showNotification('사용자가 성공적으로 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
      showNotification('사용자 삭제에 실패했습니다.', 'error');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/users/${userId}/role`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ role: newRole })
      // });
      
      // Mock implementation
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, updated_at: new Date().toISOString() }
          : user
      ));
      
      showNotification(`사용자 권한이 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경되었습니다.`, 'success');
    } catch (error) {
      console.error('권한 변경 실패:', error);
      showNotification('권한 변경에 실패했습니다.', 'error');
    }
  };

  // Filter users based on search term, role, and institution
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesInstitution = institutionFilter === 'all' || user.institution_id === institutionFilter;
    
    return matchesSearch && matchesRole && matchesInstitution;
  });

  // Statistics
  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.role === 'admin').length;
  const regularUsers = users.filter(user => user.role === 'user').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        사용자 관리
      </Typography>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 2, 
        mb: 3 
      }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{totalUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                전체 사용자
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
              <AdminIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{adminUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                관리자
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{regularUsers}</Typography>
              <Typography variant="body2" color="text.secondary">
                일반 사용자
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { md: 'center' },
          justifyContent: 'space-between'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            flex: 1
          }}>
            <TextField
              placeholder="사용자 검색 (이름, 이메일)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>권한</InputLabel>
              <Select
                value={roleFilter}
                label="권한"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
                <MenuItem value="user">일반 사용자</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>기관</InputLabel>
              <Select
                value={institutionFilter}
                label="기관"
                onChange={(e) => setInstitutionFilter(e.target.value)}
              >
                <MenuItem value="all">전체 기관</MenuItem>
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={loading}
            >
              새로고침
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('add')}
            >
              사용자 추가
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>사용자</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>기관</TableCell>
                <TableCell>권한</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell>관리자 권한</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography>로딩 중...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      조건에 맞는 사용자가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          {user.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                          {user.institution?.name || '미지정'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'admin' ? '관리자' : '일반 사용자'}
                          color={user.role === 'admin' ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.role === 'admin'}
                              onChange={() => handleRoleToggle(user.id, user.role)}
                              color="error"
                            />
                          }
                          label={user.role === 'admin' ? '관리자' : '일반'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user.id)}
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
        
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? '사용자 추가' : '사용자 수정'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="이메일"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="이름"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              fullWidth
              required
            />
            
            {dialogMode === 'add' && (
              <TextField
                label="비밀번호"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                fullWidth
                required
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel>권한</InputLabel>
              <Select
                value={formData.role}
                label="권한"
                onChange={(e) => handleFormChange('role', e.target.value)}
              >
                <MenuItem value="user">일반 사용자</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>기관</InputLabel>
              <Select
                value={formData.institution_id}
                label="기관"
                onChange={(e) => handleFormChange('institution_id', e.target.value)}
              >
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.email || !formData.name || !formData.institution_id || 
                     (dialogMode === 'add' && !formData.password)}
          >
            {dialogMode === 'add' ? '추가' : '수정'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;