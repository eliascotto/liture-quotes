import { useState, useEffect, useRef } from "react";
import CategoryMenu from './CategoryMenu';

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
      if (newWidth >= 150 && newWidth <= 400) {
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

  return (
    <div 
      ref={navbarRef} 
      className="relative h-full pt-5 border-r border-slate-700/50 dark:bg-[#1a1a24] bg-gradient-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-sm" 
      style={{ width: `${width}px`, minWidth: '150px', maxWidth: '400px' }}
    >
      <div className="h-full flex flex-col backdrop-blur-sm shadow-lg">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 px-3 py-2 border-b border-slate-700/30 flex justify-between items-center bg-slate-900/95 backdrop-blur-sm">
          <CategoryMenu
            options={["Books", "Authors"]}
            selected={props.property === "title" ? "Books" : "Authors"}
            onSelect={props.onCategoryChange}
          />
        </div>
        
        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto overscroll-none p-1">
          <ul className="px-3 py-0.5 space-y-1">
            {props.list.map((item) => {
              const isSelected = props.selected && props.selected.id === item.id;
              return (
                <li
                  key={`navbar-item-${item.id}`}
                  className={`cursor-pointer py-1.5 px-1 text-sm font-medium truncate rounded transition-all duration-200 hover:bg-slate-700/20 ${
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
