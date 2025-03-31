import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import ChevronDown from '@icons/ChevronDown';

export default function SortMenu(
  { sortBy, sortOrder, sortByFields, onSortChange }: 
  { sortBy: string, 
    sortOrder: string, 
    sortByFields: string[], 
    onSortChange: (field: string, order: string) => void }
) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSortLabel = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getCurrentSortLabel = () => {
    return `${sortOrder === "ASC" ? "↑" : "↓"} ${getSortLabel(sortBy)}`;
  };

  const handleSortChange = (field: string) => {
    if (field === sortBy) {
      onSortChange(field, sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      onSortChange(field, "DESC");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative select-none" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm text-slate-300",
          "hover:bg-slate-700/90 transition-colors", 
          isOpen ? "bg-slate-700/90" : "bg-transparent"
        )}
      >
        <span>{getCurrentSortLabel()}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={clsx(
          "absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black/5 z-50",
          "border border-slate-700/50 border border-slate-700/50"
        )}>
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Sort by
            </div>
            {sortByFields.map((field) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm",
                  sortBy === field
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{getSortLabel(field)}</span>
                  {sortBy === field && (
                    <span className="text-xs">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
