import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import Toast from '@components/Toast';

// Mock the clipboard manager
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeText: vi.fn(),
}));

describe('Toast', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders success toast with correct styles and icon', () => {
    render(<Toast message="Success message" messageType="success" onClose={mockOnClose} />);
    
    const toast = screen.getByText('Success message').parentElement?.parentElement;
    expect(toast).toHaveClass('bg-slate-800/90', 'border-green-500/30', 'text-green-400');
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('renders error toast with correct styles and icon', () => {
    render(<Toast message="Error message" messageType="error" onClose={mockOnClose} />);
    
    const toast = screen.getByText('Error message').parentElement?.parentElement;
    expect(toast).toHaveClass('bg-slate-800/90', 'border-red-500/30', 'text-red-400');
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });

  it('renders info toast with correct styles', () => {
    render(<Toast message="Info message" messageType="info" onClose={mockOnClose} />);
    
    const toast = screen.getByText('Info message').parentElement?.parentElement;
    expect(toast).toHaveClass('bg-slate-800/90', 'border-slate-700', 'text-slate-300');
  });

  it('renders warning toast with correct styles', () => {
    render(<Toast message="Warning message" messageType="warning" onClose={mockOnClose} />);
    
    const toast = screen.getByText('Warning message').parentElement?.parentElement;
    expect(toast).toHaveClass('bg-slate-800/90', 'border-yellow-500/30', 'text-yellow-400');
  });

  it('calls onClose when close button is clicked', async () => {
    render(<Toast message="Test message" messageType="info" onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    await userEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('copies message to clipboard when toast is clicked', async () => {
    render(<Toast message="Copy this message" messageType="info" onClose={mockOnClose} />);
    
    const toast = screen.getByText('Copy this message').parentElement?.parentElement;
    const toastContent = screen.getByTestId('toast-content');
    expect(toast).toBeInTheDocument();
    
    if (toast) {
      await userEvent.click(toastContent);
      expect(writeText).toHaveBeenCalledWith('Copy this message');
    }
  });

  it('prevents close button click from triggering copy', async () => {
    render(<Toast message="Test message" messageType="info" onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    await userEvent.click(closeButton);
    
    expect(writeText).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 
