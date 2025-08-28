import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errors';

export const useErrorHandler = () => {
  const { showError } = useToast();
  const { logout } = useAuth();

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const errorMessage = customMessage || getErrorMessage(error);
    
    // API 에러 상태 코드별 처리
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as any).status;
      
      switch (status) {
        case 401:
          showError('인증이 만료되었습니다. 다시 로그인해 주세요.');
          logout();
          return;
        case 403:
          showError('접근 권한이 없습니다.');
          return;
        case 404:
          showError('요청한 리소스를 찾을 수 없습니다.');
          return;
        case 500:
          showError('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
          return;
        default:
          break;
      }
    }
    
    showError(errorMessage);
    console.error('Error handled:', error);
  }, [showError, logout]);

  const handleApiError = useCallback((error: unknown, operation?: string) => {
    const baseMessage = operation ? `${operation} 중 오류가 발생했습니다` : '작업 중 오류가 발생했습니다';
    handleError(error, baseMessage);
  }, [handleError]);

  return {
    handleError,
    handleApiError
  };
};