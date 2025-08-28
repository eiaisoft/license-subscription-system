import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LoginCredentials, RegisterData, AuthState } from '../types/auth';
import { authAPI } from '../lib/api';
import { setAuthToken, getAuthToken, getUser, logout as removeAuth } from '../utils/auth';
import { getErrorMessage } from '../utils/errors';

// 중복된 인터페이스 정의 제거
// interface LoginCredentials { ... } - 제거
// interface RegisterData { ... } - 제거  
// interface AuthState { ... } - 제거

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  });

  // 초기 인증 상태 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        const savedUser = getUser();
        
        if (token && savedUser) {
          // 토큰이 유효한지 확인 (선택적)
          setState({ 
            user: savedUser, 
            token,
            isAuthenticated: true,
            loading: false 
          });
        } else {
          setState({ 
            user: null, 
            token: null,
            isAuthenticated: false,
            loading: false 
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // 토큰이나 사용자 정보가 손상된 경우 정리
        removeAuth();
        setState({ 
          user: null, 
          token: null,
          isAuthenticated: false,
          loading: false 
        });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      console.log('로그인 시도:', credentials.email);
      const response = await authAPI.login(credentials);
      console.log('로그인 응답:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        console.log('로그인 성공 - 사용자:', user);
        console.log('로그인 성공 - 토큰:', token);
        
        // 토큰과 사용자 정보 저장
        setAuthToken({ token, user });
        
        setState({ 
          user, 
          token,
          isAuthenticated: true,
          loading: false 
        });
        console.log('상태 업데이트 완료');
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false 
        }));
        throw new Error(response.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false 
      }));
      const errorMessage = getErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authAPI.register(userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // 토큰과 사용자 정보 저장
        setAuthToken({ token, user });
        
        setState({ 
          user, 
          token,
          isAuthenticated: true,
          loading: false 
        });
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false 
        }));
        throw new Error(response.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false 
      }));
      const errorMessage = getErrorMessage(error);
      throw new Error(errorMessage);
    }
  };

  const logout = (): void => {
    // 토큰과 사용자 정보 제거
    removeAuth();
    setState({ 
      user: null, 
      token: null,
      isAuthenticated: false,
      loading: false 
    });
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};