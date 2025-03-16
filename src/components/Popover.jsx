import { useEffect, useRef } from 'react';

function Popover({ isOpen, onClose, children, position = 'bottom-right' }) {
  const popoverRef = useRef(null);

  // Handle click outside to close the popover
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Position classes
  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2',
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 z-50"
        onClick={onClose}
      />
      
      {/* Popover content */}
      <div 
        ref={popoverRef}
        className={`absolute ${positionClasses[position]} z-[60] min-w-48 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden`}
      >
        {children}
      </div>
    </>
  );
}

export default Popover; 
