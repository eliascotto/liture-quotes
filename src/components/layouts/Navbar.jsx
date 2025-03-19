import { useState, useEffect, useRef } from "react";
import BookIcon from "@icons/BookIcon";
import UsersIcon from "@icons/UsersIcon";

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

function Navbar(props) {
  const [width, setWidth] = useState(240); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const navbarRef = useRef(null);

  // Handle mouse down on the resize handle
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle mouse move to resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position
      const newWidth = e.clientX;
      
      // Set min and max constraints
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const isBooks = props.property === "title";

  return (
    <div 
      ref={navbarRef} 
      className="relative h-full border-r border-slate-700/50 dark:bg-[#1a1a24] bg-gradient-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-sm" 
      style={{ width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
    >
      <div className="h-full flex flex-col backdrop-blur-sm shadow-lg">
        {/* Sticky header with icons */}
        <div 
          className="sticky top-0 z-10 px-3 min-h-[55px] py-2.5 border-b border-slate-700/30 
          flex items-center bg-slate-900/95 backdrop-blur-sm"
          data-tauri-drag-region
        >
          <div className="flex w-full justify-end items-center" data-tauri-drag-region>
            <div className="flex space-x-3 select-none">
              {/* Books Icon */}
              <button
                onClick={() => props.onCategoryChange("Books")}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  isBooks 
                    ? 'text-cyan-500 bg-slate-700/10' 
                    : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-700/20'
                }`}
                title="Books"
              >
                <BookIcon />
              </button>
              
              {/* Authors Icon */}
              <button
                onClick={() => props.onCategoryChange("Authors")}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  !isBooks 
                    ? 'text-cyan-500 bg-slate-700/10' 
                    : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-700/20'
                }`}
                title="Authors"
              >
                <UsersIcon />
              </button>
            </div>
          </div>
        </div>
        
        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto overscroll-none p-1">
          <ul className="px-2 py-0.5 space-y-1">
            {props.list.map((item) => {
              const isSelected = props.selected && props.selected.id === item.id;
              return (
                <li
                  key={`navbar-item-${item.id}`}
                  className={`cursor-pointer py-1.5 px-1.5 text-sm font-medium truncate rounded transition-all duration-200 hover:bg-slate-700/20 select-none ${
                    isSelected 
                      ? 'text-cyan-400 bg-slate-700/30' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={item[props.property]}
                  onClick={() => props.onSelection(item)}>
                  {item[props.property]}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      {/* Resize handle */}
      <div 
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 transition-all duration-200 ${
          isResizing 
            ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' 
            : 'hover:bg-cyan-400/50 hover:shadow-[0_0_5px_rgba(34,211,238,0.4)]'
        }`}
        onMouseDown={startResizing}
      />
    </div>
  );
}

export default Navbar;
