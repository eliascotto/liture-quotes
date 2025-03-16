import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import XIcon from './icons/XIcon';

function Dialog({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle mounting and unmounting with animations
  useEffect(() => {
    if (isOpen && !isMounted) {
      setIsMounted(true);
      setIsExiting(false);
    } else if (!isOpen && isMounted) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300); // Match this with animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  // Handle click outside to close the dialog
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        handleClose();
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Handle escape key
    function handleEscKey(event) {
      if (event.key === 'Escape') {
        handleClose();
      }
    }
    
    document.addEventListener('keydown', handleEscKey);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Focus trap - Comment out or remove the automatic focus
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // We're keeping the focus trap logic but removing the automatic focus
      // This will still trap focus within the dialog when tabbing
      // but won't automatically focus any element when the dialog opens
      
      // Find all focusable elements
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Remove the automatic focus
      // if (focusableElements.length > 0) {
      //   // Focus the first element
      //   focusableElements[0].focus();
      // }
      
      // Keep the focus trap functionality
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (!dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            if (focusableElements.length > 0) {
              focusableElements[0].focus();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleTabKey);
      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 200);
  };

  if (!isMounted) return null;

  // Create portal to render dialog at the root level
  return createPortal(
    <>
      {/* Backdrop overlay with enhanced blur */}
      <div 
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-lg z-[9999] transition-opacity duration-300 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
        onClick={handleClose}
      />
      
      {/* Dialog content - centered with animation */}
      <div 
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-300 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div 
          ref={dialogRef}
          className={`bg-slate-800 border border-slate-700/50 rounded-lg shadow-2xl w-full max-w-md 
                    overflow-hidden transition-all duration-300 transform ${
                      isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                    }`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/90">
            <h2 id="dialog-title" className="text-lg font-medium text-slate-200">
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-200 transition-colors outline-none focus:outline-none rounded-full p-1"
              aria-label="Close"
            >
              <XIcon />
            </button>
          </div>
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body // Render directly into the body element
  );
}

export default Dialog; 
