import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../ToastContext';

// Test component to access ToastContext
const TestComponent: React.FC = () => {
  const { showToast, showSuccess, showError, showWarning, showInfo } = useToast();
  
  return (
    <div>
      <button 
        data-testid="show-toast-btn" 
        onClick={() => showToast('Test toast message', 'info', 1000)}
      >
        Show Toast
      </button>
      <button 
        data-testid="show-success-btn" 
        onClick={() => showSuccess('Success message')}
      >
        Show Success
      </button>
      <button 
        data-testid="show-error-btn" 
        onClick={() => showError('Error message')}
      >
        Show Error
      </button>
      <button 
        data-testid="show-warning-btn" 
        onClick={() => showWarning('Warning message')}
      >
        Show Warning
      </button>
      <button 
        data-testid="show-info-btn" 
        onClick={() => showInfo('Info message')}
      >
        Show Info
      </button>
    </div>
  );
};

const renderWithToastProvider = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('기본 토스트 기능', () => {
    it('토스트 메시지를 표시해야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-toast-btn'));
      });
      
      expect(screen.getByText('Test toast message')).toBeInTheDocument();
    });

    it('성공 토스트를 표시해야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-success-btn'));
      });
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledSuccess');
    });

    it('에러 토스트를 표시해야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-error-btn'));
      });
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledError');
    });

    it('경고 토스트를 표시해야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-warning-btn'));
      });
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledWarning');
    });

    it('정보 토스트를 표시해야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-info-btn'));
      });
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledInfo');
    });
  });

  describe('토스트 자동 제거', () => {
    it('지정된 시간 후 토스트가 자동으로 제거되어야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-toast-btn'));
      });
      
      expect(screen.getByText('Test toast message')).toBeInTheDocument();
      
      // 1초 후 토스트가 제거되어야 함
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Test toast message')).not.toBeInTheDocument();
      });
    });

    it('에러 토스트는 더 오래 표시되어야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-error-btn'));
      });
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      
      // 6초 후에도 여전히 표시되어야 함
      act(() => {
        jest.advanceTimersByTime(6000);
      });
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      
      // 8초 후에는 제거되어야 함
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });
    });
  });

  describe('수동 토스트 닫기', () => {
    it('닫기 버튼을 클릭하면 토스트가 제거되어야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-success-btn'));
      });
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await act(async () => {
        await userEvent.click(closeButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });
  });

  describe('다중 토스트', () => {
    it('여러 토스트를 동시에 표시할 수 있어야 함', async () => {
      renderWithToastProvider(<TestComponent />);
      
      await act(async () => {
        await userEvent.click(screen.getByTestId('show-success-btn'));
        await userEvent.click(screen.getByTestId('show-error-btn'));
        await userEvent.click(screen.getByTestId('show-warning-btn'));
      });
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('useToast 훅', () => {
    it('ToastProvider 외부에서 사용 시 에러를 던져야 함', () => {
      const TestComponentOutsideProvider = () => {
        useToast();
        return <div>Test</div>;
      };
      
      // 콘솔 에러를 숨기기 위해
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useToast must be used within a ToastProvider');
      
      consoleSpy.mockRestore();
    });
  });
});