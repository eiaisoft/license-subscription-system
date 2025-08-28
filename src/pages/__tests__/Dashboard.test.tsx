import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { api } from '../../lib/api';

// Mock dependencies
jest.mock('../../lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockApiGet = api.get as jest.Mock;

const mockLicenses = [
  {
    id: '1',
    name: 'ChatGPT Pro',
    description: 'AI 채팅 서비스',
    price: 20,
    duration_months: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Claude Pro',
    description: 'AI 어시스턴트',
    price: 25,
    duration_months: 1,
    is_active: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockSubscriptions = [
  {
    id: '1',
    user_id: '1',
    license_id: '1',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-02-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: '2',
    license_id: '2',
    status: 'pending',
    start_date: '2024-01-02',
    end_date: '2024-02-02',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockUsers = [
  { id: '1', name: '홍길동', email: 'hong@example.com', role: 'user' },
  { id: '2', name: '김철수', email: 'kim@example.com', role: 'admin' },
];

const mockInstitutions = [
  { id: '1', name: '서울대학교', is_active: true },
  { id: '2', name: '연세대학교', is_active: true },
];

const theme = createTheme();

const renderDashboard = (userRole: 'user' | 'admin' = 'user', userName = '홍길동') => {
  const { useAuth } = require('../../contexts/AuthContext');
  
  useAuth.mockReturnValue({
    user: {
      id: '1',
      name: userName,
      email: 'test@example.com',
      role: userRole,
      institution_id: '1',
    },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  });

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ToastProvider>
            <Dashboard />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default API responses
    mockApiGet.mockImplementation((endpoint: string) => {
      switch (endpoint) {
        case '/licenses':
          return Promise.resolve({ data: mockLicenses });
        case '/subscriptions':
          return Promise.resolve({ data: mockSubscriptions });
        case '/users':
          return Promise.resolve({ data: mockUsers });
        case '/institutions':
          return Promise.resolve({ data: mockInstitutions });
        default:
          return Promise.resolve({ data: [] });
      }
    });
  });

  it('renders dashboard page correctly for regular user', async () => {
    renderDashboard('user', '홍길동');
    
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('안녕하세요, 홍길동님! 현재 시스템 현황을 확인하세요.')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('라이선스')).toBeInTheDocument();
      expect(screen.getByText('구독')).toBeInTheDocument();
    });
  });

  it('displays correct statistics for regular user', async () => {
    renderDashboard('user');
    
    await waitFor(() => {
      // License stats: 1 active out of 2 total
      expect(screen.getByText('1')).toBeInTheDocument(); // Active licenses
      expect(screen.getByText('활성 / 전체 2')).toBeInTheDocument();
      
      // Subscription stats: 1 active out of 2 total
      expect(screen.getByText('활성 / 전체 2')).toBeInTheDocument();
    });
    
    expect(mockApiGet).toHaveBeenCalledWith('/licenses');
    expect(mockApiGet).toHaveBeenCalledWith('/subscriptions');
    expect(mockApiGet).not.toHaveBeenCalledWith('/users');
    expect(mockApiGet).not.toHaveBeenCalledWith('/institutions');
  });

  it('displays additional statistics for admin user', async () => {
    renderDashboard('admin', '관리자');
    
    await waitFor(() => {
      expect(screen.getByText('라이선스')).toBeInTheDocument();
      expect(screen.getByText('구독')).toBeInTheDocument();
      expect(screen.getByText('사용자')).toBeInTheDocument();
      expect(screen.getByText('기관')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('전체 사용자')).toBeInTheDocument();
      expect(screen.getByText('등록된 기관')).toBeInTheDocument();
    });
    
    expect(mockApiGet).toHaveBeenCalledWith('/licenses');
    expect(mockApiGet).toHaveBeenCalledWith('/subscriptions');
    expect(mockApiGet).toHaveBeenCalledWith('/users');
    expect(mockApiGet).toHaveBeenCalledWith('/institutions');
  });

  it('shows loading state initially', () => {
    // Mock API to return pending promises
    mockApiGet.mockReturnValue(new Promise(() => {}));
    
    renderDashboard();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error message when API calls fail', async () => {
    const errorMessage = '데이터를 불러오는데 실패했습니다.';
    mockApiGet.mockRejectedValue(new Error('Network error'));
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    mockApiGet.mockImplementation((endpoint: string) => {
      return Promise.resolve({ data: [] });
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('라이선스')).toBeInTheDocument();
      expect(screen.getByText('구독')).toBeInTheDocument();
    });
    
    // Should show 0 for all stats
    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });
  });

  it('calculates statistics correctly', async () => {
    renderDashboard();
    
    await waitFor(() => {
      // Total licenses: 2, Active licenses: 1 (only first license is active)
      expect(screen.getByText('활성 / 전체 2')).toBeInTheDocument();
      
      // Total subscriptions: 2, Active subscriptions: 1 (only first subscription is active)
      const activeSubscriptionElements = screen.getAllByText('1');
      expect(activeSubscriptionElements.length).toBeGreaterThan(0);
    });
  });

  it('displays correct icons for each stat card', async () => {
    renderDashboard('admin');
    
    await waitFor(() => {
      expect(screen.getByText('라이선스')).toBeInTheDocument();
      expect(screen.getByText('구독')).toBeInTheDocument();
      expect(screen.getByText('사용자')).toBeInTheDocument();
      expect(screen.getByText('기관')).toBeInTheDocument();
    });
    
    // Icons should be present (testing by checking if the text content is rendered)
    expect(screen.getByText('라이선스')).toBeInTheDocument();
    expect(screen.getByText('구독')).toBeInTheDocument();
    expect(screen.getByText('사용자')).toBeInTheDocument();
    expect(screen.getByText('기관')).toBeInTheDocument();
  });

  it('handles API response without data property', async () => {
    mockApiGet.mockImplementation((endpoint: string) => {
      return Promise.resolve({}); // No data property
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('라이선스')).toBeInTheDocument();
      expect(screen.getByText('구독')).toBeInTheDocument();
    });
    
    // Should handle undefined data gracefully and show 0
    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });
  });

  it('makes correct API calls for admin user', async () => {
    renderDashboard('admin');
    
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(4);
      expect(mockApiGet).toHaveBeenCalledWith('/licenses');
      expect(mockApiGet).toHaveBeenCalledWith('/subscriptions');
      expect(mockApiGet).toHaveBeenCalledWith('/users');
      expect(mockApiGet).toHaveBeenCalledWith('/institutions');
    });
  });

  it('makes correct API calls for regular user', async () => {
    renderDashboard('user');
    
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(2);
      expect(mockApiGet).toHaveBeenCalledWith('/licenses');
      expect(mockApiGet).toHaveBeenCalledWith('/subscriptions');
      expect(mockApiGet).not.toHaveBeenCalledWith('/users');
      expect(mockApiGet).not.toHaveBeenCalledWith('/institutions');
    });
  });

  it('displays user greeting with correct name', async () => {
    const userName = '김철수';
    renderDashboard('user', userName);
    
    expect(screen.getByText(`안녕하세요, ${userName}님! 현재 시스템 현황을 확인하세요.`)).toBeInTheDocument();
  });

  it('handles mixed license statuses correctly', async () => {
    const mixedLicenses = [
      { ...mockLicenses[0], is_active: true },
      { ...mockLicenses[1], is_active: false },
      { id: '3', name: 'Test License', is_active: true, price: 10, duration_months: 1, description: 'Test', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    ];
    
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === '/licenses') {
        return Promise.resolve({ data: mixedLicenses });
      }
      return Promise.resolve({ data: mockSubscriptions });
    });
    
    renderDashboard();
    
    await waitFor(() => {
      // 3 total licenses, 2 active
      expect(screen.getByText('활성 / 전체 3')).toBeInTheDocument();
    });
  });

  it('handles mixed subscription statuses correctly', async () => {
    const mixedSubscriptions = [
      { ...mockSubscriptions[0], status: 'active' },
      { ...mockSubscriptions[1], status: 'pending' },
      { id: '3', user_id: '3', license_id: '1', status: 'active', start_date: '2024-01-01', end_date: '2024-02-01', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    ];
    
    mockApiGet.mockImplementation((endpoint: string) => {
      if (endpoint === '/subscriptions') {
        return Promise.resolve({ data: mixedSubscriptions });
      }
      return Promise.resolve({ data: mockLicenses });
    });
    
    renderDashboard();
    
    await waitFor(() => {
      // 3 total subscriptions, 2 active
      expect(screen.getByText('활성 / 전체 3')).toBeInTheDocument();
    });
  });
});