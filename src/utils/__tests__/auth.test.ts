import {
  setAuthToken,
  getAuthToken,
  getUser,
  isAuthenticated,
  isAdmin,
  logout,
  decodeToken,
  isTokenExpired,
  TokenData,
} from '../auth';
import { User } from '../../types/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Date.now for token expiration tests
const mockDateNow = jest.spyOn(Date, 'now');

describe('Auth Utils', () => {
  const mockUser: User = {
    id: '1',
    name: '홍길동',
    email: 'hong@example.com',
    role: 'user',
    institution_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockAdminUser: User = {
    id: '2',
    name: '관리자',
    email: 'admin@example.com',
    role: 'admin',
    institution_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKzJl8h6I4teLlgkKLp-38RKzJl8h6I4teLlgk';
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    mockDateNow.mockReturnValue(1609459200000); // 2021-01-01 00:00:00
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  describe('setAuthToken', () => {
    it('should store token and user data in localStorage', () => {
      const tokenData: TokenData = {
        token: mockToken,
        user: mockUser,
      };

      setAuthToken(tokenData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });

  describe('getAuthToken', () => {
    it('should return token from localStorage', () => {
      localStorageMock.setItem('token', mockToken);

      const result = getAuthToken();

      expect(result).toBe(mockToken);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    });

    it('should return null when no token exists', () => {
      const result = getAuthToken();

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return user data from localStorage', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = getUser();

      expect(result).toEqual(mockUser);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null when no user data exists', () => {
      const result = getUser();

      expect(result).toBeNull();
    });

    it('should return null when user data is invalid JSON', () => {
      localStorageMock.setItem('user', 'invalid-json');

      const result = getUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when both token and user exist', () => {
      localStorageMock.setItem('token', mockToken);
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when token is missing', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when user is missing', () => {
      localStorageMock.setItem('token', mockToken);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when both token and user are missing', () => {
      const result = isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      localStorageMock.setItem('user', JSON.stringify(mockAdminUser));

      const result = isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for regular user', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = isAdmin();

      expect(result).toBe(false);
    });

    it('should return false when no user exists', () => {
      const result = isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove token and user from localStorage', () => {
      localStorageMock.setItem('token', mockToken);
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('decodeToken', () => {
    it('should decode valid JWT token', () => {
      const result = decodeToken(mockToken);

      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('exp');
    });

    it('should return null for invalid token', () => {
      const result = decodeToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const result = decodeToken('not.a.jwt');

      expect(result).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      // Mock current time to be before token expiration
      mockDateNow.mockReturnValue(1516239000000); // Before exp: 9999999999

      const result = isTokenExpired(mockToken);

      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      // Mock current time to be after token expiration
      mockDateNow.mockReturnValue(9999999999000 + 1000); // After exp: 9999999999

      const result = isTokenExpired(mockToken);

      expect(result).toBe(true);
    });

    it('should return true for invalid token', () => {
      const result = isTokenExpired('invalid-token');

      expect(result).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const result = isTokenExpired(tokenWithoutExp);

      expect(result).toBe(true);
    });
  });
});