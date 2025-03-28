import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import ChevronUpDown from './icons/ChevronUpDown';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id: string;
  label: string;
  maxHeightPx?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function Select({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option",
  disabled = false,
  error = '',
  id,
  label,
  size = 'md',
  maxHeightPx,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const selectedOption = options.find(option => option.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClass = {
    xs: 'max-h-24',
    sm: 'max-h-32',
    md: 'max-h-48',
    lg: 'max-h-60',
  }[size];

  return (
    <div className="relative" ref={menuRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      
      <button
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md",
          "text-sm text-left text-slate-200 flex items-center justify-between",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
          "transition-all duration-200",
          {
            "opacity-50 cursor-not-allowed": disabled,
            "cursor-pointer": !disabled,
            "ring-2 ring-cyan-500 border-transparent": isOpen
          }
        )}
        type="button"
        disabled={disabled}
      >
        <span className={clsx(
          { "text-slate-400": !selectedOption }
        )}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronUpDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={clsx(
          "absolute top-full left-0 right-0 mt-1 overflow-y-auto rounded-md",
          "shadow-lg bg-slate-800 border border-slate-700/50 z-50",
          "transition-all duration-200 animate-fadeIn",
          sizeClass && sizeClass,
          maxHeightPx && `max-h-[${maxHeightPx}px]`
        )}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm",
                  option.id === value
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
} 
