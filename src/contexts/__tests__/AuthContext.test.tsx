import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { authAPI } from '../../lib/api';
import * as authUtils from '../../utils/auth';

// Mock dependencies
jest.mock('../../lib/api');
jest.mock('../../utils/auth');
jest.mock('../../utils/errors', () => ({
  getErrorMessage: jest.fn((error) => error.message || 'Unknown error')
}));

const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;
const mockAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

// Test component to access AuthContext
const TestComponent: React.FC = () => {
  const { user, loading, login, register, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button 
        data-testid="register-btn" 
        onClick={() => register({ email: 'test@example.com', password: 'password', name: 'Test User', institution_id: '1' })}
      >
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthUtils.getAuthToken.mockReturnValue(null);
    mockAuthUtils.getUser.mockReturnValue(null);
  });

  describe('초기화', () => {
    it('초기 상태에서 사용자가 인증되지 않은 상태여야 함', async () => {
      renderWithAuthProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('저장된 토큰과 사용자 정보가 있으면 자동 로그인되어야 함', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      mockAuthUtils.getAuthToken.mockReturnValue('mock-token');
      mockAuthUtils.getUser.mockReturnValue(mockUser);
      
      renderWithAuthProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  describe('로그인', () => {
    it('성공적인 로그인', async () => {
      // const user = userEvent.setup(); // 이 줄 제거
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      mockAuthAPI.login.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' },
        message: '로그인 성공'
      });
      
      renderWithAuthProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn')); // user.click 대신 userEvent.click
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
      
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(mockAuthUtils.setAuthToken).toHaveBeenCalledWith({ token: 'mock-token', user: mockUser });
    });

    it('로그인 실패', async () => {
      // const user = userEvent.setup(); // 이 줄 제거
      
      mockAuthAPI.login.mockResolvedValue({
        success: false,
        message: '로그인 실패'
      });
      
      renderWithAuthProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      await expect(async () => {
        await act(async () => {
          await userEvent.click(screen.getByTestId('login-btn')); // user.click 대신 userEvent.click
        });
      }).rejects.toThrow('로그인 실패');
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  describe('회원가입', () => {
    it('성공적인 회원가입', async () => {
      // const user = userEvent.setup(); // 이 줄 제거
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      mockAuthAPI.register.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: 'mock-token' },
        message: '회원가입 성공'
      });
      
      renderWithAuthProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('register-btn')); // user.click 대신 userEvent.click
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
      
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(mockAuthUtils.setAuthToken).toHaveBeenCalledWith({ token: 'mock-token', user: mockUser });
    });
  });

  describe('로그아웃', () => {
    it('로그아웃 시 사용자 정보가 제거되어야 함', async () => {
      // const user = userEvent.setup(); // 이 줄 제거
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      
      // 초기에 로그인된 상태로 설정
      mockAuthUtils.getAuthToken.mockReturnValue('mock-token');
      mockAuthUtils.getUser.mockReturnValue(mockUser);
      
      renderWithAuthProvider(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn')); // user.click 대신 userEvent.click
      });
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(mockAuthUtils.logout).toHaveBeenCalled();
    });
  });

  describe('useAuth 훅', () => {
    it('AuthProvider 외부에서 사용 시 에러를 던져야 함', () => {
      const TestComponentOutsideProvider = () => {
        useAuth();
        return <div>Test</div>;
      };
      
      // 콘솔 에러를 숨기기 위해
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });
});