import { createContext, useContext, useState, useCallback, useRef } from 'react';
import Dialog from '../components/Dialog.tsx';

interface DialogContextType {
  openDialog: (title: string, content: React.ReactNode, onCloseCallback?: () => void) => void;
  closeDialog: () => void;
}

// Create context
const DialogContext = createContext<DialogContextType | null>(null);

interface DialogState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode | null;
  onClose: () => void;
}

// Dialog provider component
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    content: null,
    onClose: () => { },
  });

  // Use a ref to track if a dialog is currently closing
  const isClosingRef = useRef(false);

  // Open dialog with provided content
  const openDialog = useCallback((title: string, content: React.ReactNode, onCloseCallback = () => { }) => {
    // Prevent opening a new dialog while one is closing
    if (isClosingRef.current) return;

    setDialogState({
      isOpen: true,
      title,
      content: content || null,
      onClose: () => {
        // Set the closing flag
        isClosingRef.current = true;

        // Close the dialog
        setDialogState(prev => ({ ...prev, isOpen: false }));

        // Call the provided callback
        onCloseCallback();

        // Reset the closing flag after a short delay
        setTimeout(() => {
          isClosingRef.current = false;
        }, 300); // Match this with animation duration
      },
    });
  }, []);

  // Close dialog
  const closeDialog = useCallback(() => {
    // Prevent closing if already closing
    if (isClosingRef.current) return;

    // Set the closing flag
    isClosingRef.current = true;

    // Close the dialog
    setDialogState(prev => ({ ...prev, isOpen: false }));

    // Reset the closing flag after a short delay
    setTimeout(() => {
      isClosingRef.current = false;
    }, 300); // Match this with animation duration
  }, []);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}

      {/* Global dialog component */}
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={dialogState.onClose}
        title={dialogState.title}
      >
        {dialogState.content}
      </Dialog>
    </DialogContext.Provider>
  );
}

// Custom hook to use the dialog context
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
} 
