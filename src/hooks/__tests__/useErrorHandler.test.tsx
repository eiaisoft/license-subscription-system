import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../contexts/ToastContext');
jest.mock('../../contexts/AuthContext');

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockShowError = jest.fn();
const mockLogout = jest.fn();

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({
      showToast: jest.fn(),
      showSuccess: jest.fn(),
      showError: mockShowError,
      showWarning: jest.fn(),
      showInfo: jest.fn(),
    });
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      isAuthenticated: false,
    });
  });

  it('일반 에러 처리', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(mockShowError).toHaveBeenCalledWith('Test error');
  });

  it('문자열 에러 처리', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError('String error');
    });

    expect(mockShowError).toHaveBeenCalledWith('String error');
  });

  it('401 에러 처리 (인증 실패)', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    };
    
    act(() => {
      result.current.handleError(error);
    });

    expect(mockShowError).toHaveBeenCalledWith('인증이 만료되었습니다. 다시 로그인해주세요.');
    expect(mockLogout).toHaveBeenCalled();
  });

  it('403 에러 처리 (권한 없음)', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = {
      response: {
        status: 403,
        data: { message: 'Forbidden' }
      }
    };
    
    act(() => {
      result.current.handleError(error);
    });

    expect(mockShowError).toHaveBeenCalledWith('접근 권한이 없습니다.');
  });

  it('네트워크 에러 처리', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = {
      code: 'NETWORK_ERROR',
      message: 'Network Error'
    };
    
    act(() => {
      result.current.handleError(error);
    });

    expect(mockShowError).toHaveBeenCalledWith('네트워크 연결을 확인해주세요.');
  });

  it('알 수 없는 에러 처리', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.handleError(null);
    });

    expect(mockShowError).toHaveBeenCalledWith('알 수 없는 오류가 발생했습니다.');
  });
});