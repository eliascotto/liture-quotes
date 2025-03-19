import { useRef, useState, useEffect } from 'react';
import ChevronDown from './icons/ChevronDown';

export default function SortMenu({ sortBy, sortOrder, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const sortByFields = ["date_modified", "date_created", "chapter_progress"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSortLabel = (field) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCurrentSortLabel = () => {
    return `${sortOrder === "ASC" ? "↑" : "↓"} ${getSortLabel(sortBy)}`;
  };

  const handleSortChange = (field) => {
    if (field === sortBy) {
      onSortChange(field, sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      onSortChange(field, "DESC");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <span>{getCurrentSortLabel()}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Sort by
            </div>
            {sortByFields.map((field) => (
              <button
                key={field}
                onClick={() => handleSortChange(field)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  sortBy === field
                    ? "bg-cyan-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
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
