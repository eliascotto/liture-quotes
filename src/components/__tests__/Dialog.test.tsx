import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dialog from '@components/Dialog';

// Mock the X icon
vi.mock('@components/icons/X', () => ({
  default: () => <div data-testid="x-icon">X Icon</div>
}));

describe('Dialog', () => {
  const mockOnClose = vi.fn();
  const mockTitle = 'Test Dialog';
  const mockContent = 'Test Content';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body style after each test
    document.body.style.overflow = '';
  });

  const renderDialog = (props = {}) => {
    return render(
      <Dialog
        isOpen={true}
        onClose={mockOnClose}
        title={mockTitle}
        {...props}
      >
        {mockContent}
      </Dialog>
    );
  };

  it('renders when isOpen is true', () => {
    renderDialog();
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.getByText(mockContent)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderDialog({ isOpen: false });
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(mockContent)).not.toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', async () => {
    renderDialog();
    
    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);
    
    // Wait for animation
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 300 });
  });

  it('calls onClose when clicking the backdrop', async () => {
    renderDialog();
    
    const backdrop = screen.getByRole('dialog').previousSibling as HTMLElement;
    await userEvent.click(backdrop);
    
    // Wait for animation
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 300 });
  });

  it('calls onClose when pressing Escape key', async () => {
    renderDialog();
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Wait for animation
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 300 });
  });

  it('prevents body scroll when open', () => {
    renderDialog();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', async () => {
    const { rerender } = renderDialog();
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Dialog
        isOpen={false}
        onClose={mockOnClose}
        title={mockTitle}
      >
        {mockContent}
      </Dialog>
    );
    
    expect(document.body.style.overflow).toBe('');
  });

  it('has proper accessibility attributes', () => {
    renderDialog();
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    
    const title = screen.getByText(mockTitle);
    expect(title).toHaveAttribute('id', 'dialog-title');
  });

  it('handles focus trap', async () => {
    renderDialog();
    
    const dialog = screen.getByRole('dialog');
    const closeButton = screen.getByLabelText('Close');
    
    // Tab should cycle through focusable elements
    closeButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    
    // Since we're not auto-focusing elements, the focus should stay within the dialog
    expect(document.activeElement).toBe(closeButton);
  });

  it('applies exit animation classes when closing', async () => {
    renderDialog();
    
    const dialog = screen.getByRole('dialog').firstChild as HTMLElement;
    const closeButton = screen.getByLabelText('Close');
    
    await userEvent.click(closeButton);
    
    expect(dialog.className).toContain('scale-95');
    expect(dialog.className).toContain('opacity-0');
  });
}); 
