import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

// Mock login function
const mockLogin = jest.fn();

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
    isAuthenticated: false,
  }),
}));

// Mock ToastContext
jest.mock('../../contexts/ToastContext', () => ({
  ...jest.requireActual('../../contexts/ToastContext'),
  useToast: () => ({
    showToast: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
}));

const theme = createTheme();

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ToastProvider>
            <Login />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로그인 페이지가 올바르게 렌더링됨', () => {
    renderLogin();
    
    expect(screen.getByText('AI 구독 시스템')).toBeInTheDocument();
    expect(screen.getByText('로그인')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByText('계정이 없으신가요? 회원가입')).toBeInTheDocument();
  });

  it('이메일과 비밀번호 입력이 정상적으로 작동함', async () => {
    renderLogin();
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const passwordInput = screen.getByLabelText('비밀번호');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('빈 필드로 제출 시 에러 메시지 표시', async () => {
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('이메일과 비밀번호를 모두 입력해주세요.')).toBeInTheDocument();
    });
    
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('로그인 성공 시 대시보드로 이동', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('로그인 실패 시 에러 메시지 표시', async () => {
    const errorMessage = '로그인에 실패했습니다.';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));
    renderLogin();
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('로딩 중일 때 버튼이 비활성화되고 스피너 표시', async () => {
    // 로그인이 완료되지 않도록 Promise를 pending 상태로 유지
    let resolveLogin: () => void;
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(loginPromise);
    
    renderLogin();
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const passwordInput = screen.getByLabelText('비밀번호');
    const submitButton = screen.getByRole('button', { name: '로그인' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // 로딩 상태 확인
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    
    // 로그인 완료
    resolveLogin!();
  });

  it('입력 중 에러 메시지가 제거됨', async () => {
    renderLogin();
    
    // 먼저 에러 상태 만들기
    const submitButton = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('이메일과 비밀번호를 모두 입력해주세요.')).toBeInTheDocument();
    });
    
    // 입력 시 에러 메시지 제거 확인
    const emailInput = screen.getByLabelText('이메일 주소');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(screen.queryByText('이메일과 비밀번호를 모두 입력해주세요.')).not.toBeInTheDocument();
    });
  });

  it('회원가입 링크가 올바른 경로로 연결됨', () => {
    renderLogin();
    
    const registerLink = screen.getByText('계정이 없으신가요? 회원가입');
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});