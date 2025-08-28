import {
  isApiError,
  getErrorMessage,
  getStatusErrorMessage,
  handleNetworkError,
  ApiError,
} from '../errors';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('Error Utils', () => {
  beforeEach(() => {
    // Reset navigator.onLine to true before each test
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('isApiError', () => {
    it('should return true for valid ApiError object', () => {
      const apiError: ApiError = {
        success: false,
        message: 'Test error',
        error: 'VALIDATION_ERROR',
        statusCode: 400,
      };

      const result = isApiError(apiError);

      expect(result).toBe(true);
    });

    it('should return true for minimal ApiError object', () => {
      const apiError: ApiError = {
        success: false,
        message: 'Test error',
      };

      const result = isApiError(apiError);

      expect(result).toBe(true);
    });

    it('should return false for object with success: true', () => {
      const notApiError = {
        success: true,
        message: 'Success message',
      };

      const result = isApiError(notApiError);

      expect(result).toBe(false);
    });

    it('should return false for null', () => {
      const result = isApiError(null);

      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      const result = isApiError(undefined);

      expect(result).toBe(false);
    });

    it('should return false for string', () => {
      const result = isApiError('error string');

      expect(result).toBe(false);
    });

    it('should return false for Error instance', () => {
      const result = isApiError(new Error('test error'));

      expect(result).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from ApiError', () => {
      const apiError: ApiError = {
        success: false,
        message: 'API error message',
      };

      const result = getErrorMessage(apiError);

      expect(result).toBe('API error message');
    });

    it('should return message from Error instance', () => {
      const error = new Error('Standard error message');

      const result = getErrorMessage(error);

      expect(result).toBe('Standard error message');
    });

    it('should return string error as is', () => {
      const error = 'String error message';

      const result = getErrorMessage(error);

      expect(result).toBe('String error message');
    });

    it('should return default message for unknown error type', () => {
      const error = { someProperty: 'value' };

      const result = getErrorMessage(error);

      expect(result).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('should return default message for null', () => {
      const result = getErrorMessage(null);

      expect(result).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('should return default message for undefined', () => {
      const result = getErrorMessage(undefined);

      expect(result).toBe('알 수 없는 오류가 발생했습니다.');
    });
  });

  describe('getStatusErrorMessage', () => {
    it('should return correct message for 400 status', () => {
      const result = getStatusErrorMessage(400);
      expect(result).toBe('잘못된 요청입니다.');
    });

    it('should return correct message for 401 status', () => {
      const result = getStatusErrorMessage(401);
      expect(result).toBe('인증이 필요합니다.');
    });

    it('should return correct message for 403 status', () => {
      const result = getStatusErrorMessage(403);
      expect(result).toBe('접근 권한이 없습니다.');
    });

    it('should return correct message for 404 status', () => {
      const result = getStatusErrorMessage(404);
      expect(result).toBe('요청한 리소스를 찾을 수 없습니다.');
    });

    it('should return correct message for 409 status', () => {
      const result = getStatusErrorMessage(409);
      expect(result).toBe('데이터 충돌이 발생했습니다.');
    });

    it('should return correct message for 422 status', () => {
      const result = getStatusErrorMessage(422);
      expect(result).toBe('입력 데이터가 올바르지 않습니다.');
    });

    it('should return correct message for 500 status', () => {
      const result = getStatusErrorMessage(500);
      expect(result).toBe('서버 오류가 발생했습니다.');
    });

    it('should return default message for unknown status code', () => {
      const result = getStatusErrorMessage(999);
      expect(result).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('should return default message for negative status code', () => {
      const result = getStatusErrorMessage(-1);
      expect(result).toBe('알 수 없는 오류가 발생했습니다.');
    });
  });

  describe('handleNetworkError', () => {
    it('should return offline message when navigator is offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const result = handleNetworkError(new Error('Network error'));

      expect(result).toBe('인터넷 연결을 확인해주세요.');
    });

    it('should return network error message for NETWORK_ERROR code', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      };

      const result = handleNetworkError(networkError);

      expect(result).toBe('네트워크 연결에 문제가 있습니다.');
    });

    it('should return error message for other errors when online', () => {
      const error = new Error('Some other error');

      const result = handleNetworkError(error);

      expect(result).toBe('Some other error');
    });

    it('should handle ApiError when online', () => {
      const apiError: ApiError = {
        success: false,
        message: 'API error occurred',
      };

      const result = handleNetworkError(apiError);

      expect(result).toBe('API error occurred');
    });

    it('should return default message for unknown error when online', () => {
      const unknownError = { someProperty: 'value' };

      const result = handleNetworkError(unknownError);

      expect(result).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('should prioritize offline check over error code', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network failed',
      };

      const result = handleNetworkError(networkError);

      expect(result).toBe('인터넷 연결을 확인해주세요.');
    });
  });
});