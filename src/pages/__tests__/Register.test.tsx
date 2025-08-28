import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Register } from '../Register';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { institutionsAPI } from '../../lib/api';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../lib/api', () => ({
  institutionsAPI: {
    getAll: jest.fn(),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockRegister = jest.fn();

const mockInstitutions = [
  { id: '1', name: '서울대학교', is_active: true },
  { id: '2', name: '연세대학교', is_active: true },
  { id: '3', name: '고려대학교', is_active: true },
];

const theme = createTheme();

const renderRegister = () => {
  const { useNavigate } = require('react-router-dom');
  const { useAuth } = require('../../contexts/AuthContext');
  
  useNavigate.mockReturnValue(mockNavigate);
  useAuth.mockReturnValue({
    register: mockRegister,
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  });

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ToastProvider>
            <Register />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (institutionsAPI.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: mockInstitutions,
    });
  });

  it('renders register page correctly', async () => {
    renderRegister();
    
    expect(screen.getByText('AI 구독 시스템')).toBeInTheDocument();
    expect(screen.getByText('회원가입')).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByText('이미 계정이 있으신가요? 로그인')).toBeInTheDocument();

    // Wait for institutions to load
    await waitFor(() => {
      expect(screen.getByLabelText('기관')).toBeInTheDocument();
    });
  });

  it('loads institutions on mount', async () => {
    renderRegister();
    
    await waitFor(() => {
      expect(institutionsAPI.getAll).toHaveBeenCalledTimes(1);
    });
  });

  it('allows user to fill out the form', async () => {
    renderRegister();
    
    const nameInput = screen.getByLabelText('이름');
    const emailInput = screen.getByLabelText('이메일 주소');
    const passwordInput = screen.getByLabelText('비밀번호');
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인');
    
    fireEvent.change(nameInput, { target: { value: '홍길동' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    
    expect(nameInput).toHaveValue('홍길동');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('shows error when submitting empty form', async () => {
    renderRegister();
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('모든 필드를 입력해주세요.')).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();
    
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일 주소'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'different' } });
    
    // Wait for institutions to load and select one
    await waitFor(() => {
      const institutionSelect = screen.getByLabelText('기관');
      fireEvent.mouseDown(institutionSelect);
    });
    
    const institutionOption = screen.getByText('서울대학교');
    fireEvent.click(institutionOption);
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error for short password', async () => {
    renderRegister();
    
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일 주소'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: '123' } });
    
    // Wait for institutions to load and select one
    await waitFor(() => {
      const institutionSelect = screen.getByLabelText('기관');
      fireEvent.mouseDown(institutionSelect);
    });
    
    const institutionOption = screen.getByText('서울대학교');
    fireEvent.click(institutionOption);
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다.')).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error for invalid email format', async () => {
    renderRegister();
    
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일 주소'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password123' } });
    
    // Wait for institutions to load and select one
    await waitFor(() => {
      const institutionSelect = screen.getByLabelText('기관');
      fireEvent.mouseDown(institutionSelect);
    });
    
    const institutionOption = screen.getByText('서울대학교');
    fireEvent.click(institutionOption);
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식을 입력해주세요.')).toBeInTheDocument();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('successfully registers user with valid data', async () => {
    mockRegister.mockResolvedValue(undefined);
    renderRegister();
    
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일 주소'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password123' } });
    
    // Wait for institutions to load and select one
    await waitFor(() => {
      const institutionSelect = screen.getByLabelText('기관');
      fireEvent.mouseDown(institutionSelect);
    });
    
    const institutionOption = screen.getByText('서울대학교');
    fireEvent.click(institutionOption);
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: '홍길동',
        email: 'test@example.com',
        password: 'password123',
        institution_id: '1',
      });
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('shows error message when registration fails', async () => {
    const errorMessage = '이미 존재하는 이메일입니다.';
    mockRegister.mockRejectedValue(new Error(errorMessage));
    renderRegister();
    
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일 주소'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password123' } });
    
    // Wait for institutions to load and select one
    await waitFor(() => {
      const institutionSelect = screen.getByLabelText('기관');
      fireEvent.mouseDown(institutionSelect);
    });
    
    const institutionOption = screen.getByText('서울대학교');
    fireEvent.click(institutionOption);
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading state during registration', async () => {
    let resolveRegister: () => void;
    const registerPromise = new Promise<void>((resolve) => {
      resolveRegister = resolve;
    });
    mockRegister.mockReturnValue(registerPromise);
    
    renderRegister();
    
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText('이메일 주소'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'password123' } });
    
    // Wait for institutions to load and select one
    await waitFor(() => {
      const institutionSelect = screen.getByLabelText('기관');
      fireEvent.mouseDown(institutionSelect);
    });
    
    const institutionOption = screen.getByText('서울대학교');
    fireEvent.click(institutionOption);
    
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise
    resolveRegister!();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('clears error message when user starts typing', async () => {
    renderRegister();
    
    // Trigger an error first
    const submitButton = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('모든 필드를 입력해주세요.')).toBeInTheDocument();
    });
    
    // Start typing in name field
    const nameInput = screen.getByLabelText('이름');
    fireEvent.change(nameInput, { target: { value: '홍' } });
    
    await waitFor(() => {
      expect(screen.queryByText('모든 필드를 입력해주세요.')).not.toBeInTheDocument();
    });
  });

  it('navigates to login page when login link is clicked', () => {
    renderRegister();
    
    const loginLink = screen.getByText('이미 계정이 있으신가요? 로그인');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('handles institution loading error gracefully', async () => {
    (institutionsAPI.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderRegister();
    
    // Should still render the form even if institutions fail to load
    expect(screen.getByText('회원가입')).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(institutionsAPI.getAll).toHaveBeenCalledTimes(1);
    });
  });
});