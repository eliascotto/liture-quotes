import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationControls from '@components/NavigationControls';

// Mock the arrow icons
vi.mock('@icons/ArrowLeft.tsx', () => ({
  default: () => <div data-testid="arrow-left-icon">←</div>
}));

vi.mock('@icons/ArrowRight.tsx', () => ({
  default: () => <div data-testid="arrow-right-icon">→</div>
}));

describe('NavigationControls', () => {
  const mockOnBack = vi.fn();
  const mockOnForward = vi.fn();

  const renderNavigationControls = (props = {}) => {
    return render(
      <NavigationControls
        canGoBack={true}
        canGoForward={true}
        onBack={mockOnBack}
        onForward={mockOnForward}
        {...props}
      />
    );
  };

  it('renders both back and forward buttons', () => {
    renderNavigationControls();
    
    expect(screen.getByTitle('Go back')).toBeInTheDocument();
    expect(screen.getByTitle('Go forward')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
  });

  it('disables back button when canGoBack is false', () => {
    renderNavigationControls({ canGoBack: false });
    
    const backButton = screen.getByTitle('Go back');
    expect(backButton).toBeDisabled();
    expect(backButton).toHaveClass('text-slate-600', 'cursor-not-allowed');
  });

  it('disables forward button when canGoForward is false', () => {
    renderNavigationControls({ canGoForward: false });
    
    const forwardButton = screen.getByTitle('Go forward');
    expect(forwardButton).toBeDisabled();
    expect(forwardButton).toHaveClass('text-slate-600', 'cursor-not-allowed');
  });

  it('calls onBack when back button is clicked', async () => {
    renderNavigationControls();
    
    const backButton = screen.getByTitle('Go back');
    await userEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onForward when forward button is clicked', async () => {
    renderNavigationControls();
    
    const forwardButton = screen.getByTitle('Go forward');
    await userEvent.click(forwardButton);
    
    expect(mockOnForward).toHaveBeenCalledTimes(1);
  });

  it('does not call onBack when disabled back button is clicked', async () => {
    renderNavigationControls({ canGoBack: false });
    
    const backButton = screen.getByTitle('Go back');
    await userEvent.click(backButton);
    
    expect(mockOnBack).not.toHaveBeenCalled();
  });

  it('does not call onForward when disabled forward button is clicked', async () => {
    renderNavigationControls({ canGoForward: false });
    
    const forwardButton = screen.getByTitle('Go forward');
    await userEvent.click(forwardButton);
    
    expect(mockOnForward).not.toHaveBeenCalled();
  });

  it('applies hover styles to enabled buttons', () => {
    renderNavigationControls();
    
    const backButton = screen.getByTitle('Go back');
    const forwardButton = screen.getByTitle('Go forward');
    
    expect(backButton).toHaveClass('hover:text-cyan-400', 'hover:bg-slate-700/50');
    expect(forwardButton).toHaveClass('hover:text-cyan-400', 'hover:bg-slate-700/50');
  });
}); 
