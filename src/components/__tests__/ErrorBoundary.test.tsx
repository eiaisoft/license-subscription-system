import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // 콘솔 에러 메시지 숨기기
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  it('에러가 없을 때 자식 컴포넌트 정상 렌더링', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('에러 발생 시 폴백 UI 표시', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '페이지 새로고침' })).toBeInTheDocument();
  });

  it('새로고침 버튼 클릭 시 페이지 새로고침', () => {
    // window.location.reload 모킹
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: '페이지 새로고침' });
    fireEvent.click(refreshButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('개발 환경에서 에러 정보 표시', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // NODE_ENV를 올바르게 모킹
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('개발자 정보:')).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();

    // 원래 값으로 복원
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    });
  });

  it('프로덕션 환경에서 에러 정보 숨김', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // NODE_ENV를 올바르게 모킹
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('개발자 정보:')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error: Test error/)).not.toBeInTheDocument();

    // 원래 값으로 복원
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    });
  });
});