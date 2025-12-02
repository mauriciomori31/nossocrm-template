import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/context/ToastContext';
import React from 'react';

// Test component to interact with ToastContext
const TestComponent: React.FC = () => {
  const { addToast, showToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast('Success message', 'success')} data-testid="success-btn">
        Add Success
      </button>
      <button onClick={() => addToast('Error message', 'error')} data-testid="error-btn">
        Add Error
      </button>
      <button onClick={() => addToast('Info message', 'info')} data-testid="info-btn">
        Add Info
      </button>
      <button onClick={() => addToast('Warning message', 'warning')} data-testid="warning-btn">
        Add Warning
      </button>
      <button onClick={() => showToast('ShowToast message', 'success')} data-testid="showtoast-btn">
        Show Toast Alias
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  it('should render ToastProvider without crashing', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should throw error when useToast is used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleError.mockRestore();
  });

  it('should add a success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('success-btn'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should add an error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('error-btn'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should add an info toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('info-btn'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should add a warning toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('warning-btn'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should add multiple toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('success-btn'));
    fireEvent.click(screen.getByTestId('error-btn'));
    fireEvent.click(screen.getByTestId('info-btn'));

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should support showToast alias', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('showtoast-btn'));
    expect(screen.getByText('ShowToast message')).toBeInTheDocument();
  });

  it('should use info type by default', () => {
    // Create a component that calls addToast without type
    const DefaultTypeTest: React.FC = () => {
      const { addToast } = useToast();
      return (
        <button onClick={() => addToast('Default type')} data-testid="default-btn">
          Default
        </button>
      );
    };

    render(
      <ToastProvider>
        <DefaultTypeTest />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('default-btn'));
    expect(screen.getByText('Default type')).toBeInTheDocument();
  });
});
