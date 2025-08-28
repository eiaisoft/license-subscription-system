import { User } from '../types/auth';

export interface TokenData {
  token: string;
  user: User;
}

// 토큰 저장
export const setAuthToken = (tokenData: TokenData): void => {
  localStorage.setItem('token', tokenData.token);
  localStorage.setItem('user', JSON.stringify(tokenData.user));
};

// 토큰 가져오기
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// 사용자 정보 가져오기
export const getUser = (): TokenData['user'] | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getUser();
  return !!(token && user);
};

// 관리자 권한 확인
export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'admin';
};

// 로그아웃
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// JWT 토큰 디코딩 (만료 시간 확인용)
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// 토큰 만료 확인
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};