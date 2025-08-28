export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}

// API 에러 타입 가드
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && error.success === false;
};

// 에러 메시지 추출
export const getErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};

// HTTP 상태 코드별 에러 메시지
export const getStatusErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return '잘못된 요청입니다.';
    case 401:
      return '인증이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 409:
      return '데이터 충돌이 발생했습니다.';
    case 422:
      return '입력 데이터가 올바르지 않습니다.';
    case 500:
      return '서버 오류가 발생했습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
};

// 네트워크 에러 처리
export const handleNetworkError = (error: any): string => {
  if (!navigator.onLine) {
    return '인터넷 연결을 확인해주세요.';
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return '네트워크 연결에 문제가 있습니다.';
  }
  
  return getErrorMessage(error);
};