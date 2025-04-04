import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogProvider, useDialog } from './DialogContext';
import { ReactNode } from 'react';

// Test component that uses the dialog context
const TestComponent = ({ onOpen }: { onOpen: () => void }) => {
  const { openDialog, closeDialog } = useDialog();

  return (
    <div>
      <button onClick={() => {
        openDialog('Test Dialog', <div>Dialog Content</div>);
        onOpen();
      }}>
        Open Dialog
      </button>
      <button onClick={closeDialog}>Close Dialog</button>
    </div>
  );
};

// Dialog test components
const DialogTestComponent = ({ onClose }: { onClose?: () => void }) => {
  const { openDialog, closeDialog } = useDialog();

  const handleOpen = () => {
    openDialog('Test', <div>Content</div>, onClose);
  };

  return (
    <button onClick={handleOpen}>Open Dialog</button>
  );
};

const MultiDialogTestComponent = () => {
  const { openDialog, closeDialog } = useDialog();

  const openFirstDialog = () => {
    openDialog('First Dialog', <div>First Content</div>);
  };

  const openSecondDialog = () => {
    openDialog('Second Dialog', <div>Second Content</div>);
  };

  return (
    <div>
      <button onClick={openFirstDialog}>Open First</button>
      <button onClick={openSecondDialog}>Open Second</button>
      <button onClick={closeDialog}>Close Dialog</button>
    </div>
  );
};

// Wrapper component for testing hooks
const Wrapper = ({ children }: { children: ReactNode }) => (
  <DialogProvider>{children}</DialogProvider>
);

describe('DialogContext', () => {
  const mockOnOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides dialog context to children', () => {
    const { result } = renderHook(() => useDialog(), {
      wrapper: Wrapper
    });

    expect(result.current.openDialog).toBeDefined();
    expect(result.current.closeDialog).toBeDefined();
  });

  it('throws error when useDialog is used outside provider', () => {
    // Suppress the console.error during this test
    const originalError = console.error;
    console.error = vi.fn();

    let caughtError: any;
    try {
      renderHook(() => {
        try {
          useDialog();
        } catch (e) {
          caughtError = e;
          throw e; // Re-throw to maintain test behavior
        }
      });
    } catch (e) {
      // Expected error
    }

    // Restore console.error
    console.error = originalError;

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError.message).toBe('useDialog must be used within a DialogProvider');
  });

  it('opens dialog with provided content', async () => {
    render(
      <DialogProvider>
        <TestComponent onOpen={mockOnOpen} />
      </DialogProvider>
    );

    const openButton = screen.getByText('Open Dialog');
    await userEvent.click(openButton);

    expect(mockOnOpen).toHaveBeenCalled();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
  });

  it('closes dialog when closeDialog is called', async () => {
    render(
      <DialogProvider>
        <TestComponent onOpen={mockOnOpen} />
      </DialogProvider>
    );

    // Open dialog
    const openButton = screen.getByText('Open Dialog');
    await userEvent.click(openButton);
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();

    // Close dialog
    const closeButton = screen.getByText('Close Dialog');
    await userEvent.click(closeButton);

    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
    }, { timeout: 400 });
  });

  it('executes onClose callback when dialog is closed', async () => {
    const mockOnClose = vi.fn();
    render(
      <DialogProvider>
        <DialogTestComponent onClose={mockOnClose} />
      </DialogProvider>
    );

    // Open dialog
    await userEvent.click(screen.getByText('Open Dialog'));
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Close dialog using the close button in the dialog
    const closeButton = screen.getByLabelText('Close');
    await userEvent.click(closeButton);

    // Wait for animation and callback
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 400 });
  });

  it('prevents opening new dialog while one is closing', async () => {
    render(
      <DialogProvider>
        <MultiDialogTestComponent />
      </DialogProvider>
    );

    // Open first dialog
    await userEvent.click(screen.getByText('Open First'));
    expect(screen.getByText('First Dialog')).toBeInTheDocument();

    // Close dialog
    await userEvent.click(screen.getByText('Close Dialog'));

    // Try to open second dialog immediately
    await userEvent.click(screen.getByText('Open Second'));

    // The second dialog should not be visible during the closing animation
    expect(screen.queryByText('Second Dialog')).not.toBeInTheDocument();

    // Wait for closing animation to complete
    await waitFor(() => {
      expect(screen.queryByText('First Dialog')).not.toBeInTheDocument();
    }, { timeout: 400 });
  });

  it('handles multiple dialogs in sequence', async () => {
    render(
      <DialogProvider>
        <MultiDialogTestComponent />
      </DialogProvider>
    );

    // Open first dialog
    await userEvent.click(screen.getByText('Open First'));
    expect(screen.getByText('First Dialog')).toBeInTheDocument();

    // Close first dialog
    await userEvent.click(screen.getByText('Close Dialog'));

    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.queryByText('First Dialog')).not.toBeInTheDocument();
    }, { timeout: 400 });

    // Open second dialog
    await userEvent.click(screen.getByText('Open Second'));
    expect(screen.getByText('Second Dialog')).toBeInTheDocument();
  });
}); 
