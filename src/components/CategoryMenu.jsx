import { useCallback, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

// Custom dropdown menu component
function DropdownMenu({ isOpen, onClose, options, onSelect, selected }) {
  const menuRef = useRef(null);
  
  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  return (
    <div 
      ref={menuRef}
      className="absolute left-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-10 overflow-hidden backdrop-blur-sm"
    >
      <div className="py-0.5">
        {options.map((option) => (
          <button 
            key={option}
            onClick={() => {
              onSelect(option);
              onClose();
            }}
            className={clsx(
              "w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 flex items-center select-none",
              option === selected 
                ? "text-cyan-300 bg-slate-700/50" 
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryMenu(props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleClick = useCallback(() => {
    setMenuOpen(true);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <div
        className="flex flex-row rounded-md py-1.5 px-3 cursor-default bg-slate-800/50 hover:bg-slate-700/60 text-slate-300 hover:text-cyan-300 text-sm items-center gap-2 font-medium transition-all duration-200 border border-slate-700/30 shadow-sm select-none"
        title="Switch category"
        onClick={handleClick}
      >
        <span className="tracking-wide">{props.selected}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </div>
      
      <DropdownMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        options={props.options}
        onSelect={props.onSelect}
        selected={props.selected}
      />
    </div>
  )
}

export default CategoryMenu;
