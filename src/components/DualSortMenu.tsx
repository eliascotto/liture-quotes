import { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import ChevronDown from '@icons/ChevronDown';

export default function DualSortMenu({ 
  primarySort, 
  secondarySort, 
  sortByFields,
  sortLabels,
  onPrimarySortChange,
  onSecondarySortChange 
}: {
  primarySort: { field: string, order: "ASC" | "DESC" },
  secondarySort: { field: string, order: "ASC" | "DESC" },
  sortByFields: { primary: string[], secondary: string[] },
  sortLabels?: { primary: string, secondary: string },
  onPrimarySortChange: (field: string, order: "ASC" | "DESC") => void,
  onSecondarySortChange: (field: string, order: "ASC" | "DESC") => void
}) {
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
    const arrow = primarySort.order === "ASC" ? "↑" : "↓";
    return `${primarySort.order === "ASC" ? "↑" : "↓"} ${getSortLabel(primarySort.field)}`;
  };

  const handlePrimarySortChange = (field: string) => {
    if (field === primarySort.field) {
      onPrimarySortChange(field, primarySort.order === "ASC" ? "DESC" : "ASC");
    } else {
      onPrimarySortChange(field, "DESC");
    }
  };

  const handleSecondarySortChange = (field: string) => {
    if (field === secondarySort.field) {
      onSecondarySortChange(field, secondarySort.order === "ASC" ? "DESC" : "ASC");
    } else {
      onSecondarySortChange(field, "DESC");
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm text-muted",
          "hover:bg-background/90 transition-colors",
          isOpen ? "bg-background/90" : "bg-transparent"
        )}
      >
        <span>{getCurrentSortLabel()}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={clsx(
          "absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg bg-menu ring-1 ring-black/5 z-50",
          "border border-menu-border"
        )}>
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-foreground uppercase tracking-wider">
              {sortLabels?.primary ? sortLabels.primary : "Primary Sort"}
            </div>
            {sortByFields?.primary.map((field) => (
              <button
                key={`primary-${field}`}
                onClick={() => handlePrimarySortChange(field)}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm",
                  primarySort.field === field
                    ? "bg-menu-selected-background text-menu-selected-foreground"
                    : "text-menu-foreground hover:bg-menu-hover hover:text-menu-foreground-hover"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{getSortLabel(field)}</span>
                  {primarySort.field === field && (
                    <span className="text-xs">{primarySort.order === "ASC" ? "↑" : "↓"}</span>
                  )}
                </div>
              </button>
            ))}
            
            <hr className="my-2 border-menu-border" />
            
            <div className="px-3 py-2 text-xs font-medium text-foreground uppercase tracking-wider">
              {sortLabels?.secondary ? sortLabels.secondary : "Secondary Sort"}
            </div>
            {sortByFields?.secondary.map((field) => (
              <button
                key={`secondary-${field}`}
                onClick={() => handleSecondarySortChange(field)}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm",
                  secondarySort.field === field
                    ? "bg-menu-selected-background text-menu-selected-foreground"
                    : "text-menu-foreground hover:bg-menu-hover hover:text-menu-foreground-hover"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{getSortLabel(field)}</span>
                  {secondarySort.field === field && (
                    <span className="text-xs">{secondarySort.order === "ASC" ? "↑" : "↓"}</span>
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
