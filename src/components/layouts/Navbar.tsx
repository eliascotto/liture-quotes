import { useState, useEffect, useRef, MouseEvent, UIEvent } from "react";
import { platform } from '@tauri-apps/plugin-os';
import BookIcon from "@icons/BookIcon";
import UsersIcon from "@icons/UsersIcon";
import clsx from "clsx";
import Tooltip from "@components/Tooltip";

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

type NavbarProps = {
  property: string,
  items: any[],
  itemType: string,
  selected: any,
  onCategoryChange: (category: string) => void,
  onSelection: (item: any) => void,
}

function Navbar({
  property, items, itemType, selected, onCategoryChange, onSelection
}: NavbarProps) {
  const [width, setWidth] = useState(240); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const navbarRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const currentPlatform = platform();

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const scrollTop = (e.target as HTMLElement).scrollTop;
    setIsScrolled(scrollTop > 0);
  };

  // Handle mouse down on the resize handle
  const startResizing = (e: MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    setIsEmpty(items.length === 0);
  }, [items]);

  // Handle mouse move to resize
  useEffect(() => {
    const handleMouseMove: any = (e: MouseEvent) => {
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

  const isBooks = property === "title";

  return (
    <div
      ref={navbarRef}
      className={clsx(
        "relative h-full border-r border-slate-700/50 bg-slate-900/90 select-none",
        {
          "bg-opacity-[0.25]": currentPlatform === "macos"
        }
      )}
      style={{ width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
    >
      <div className="h-full flex flex-col backdrop-blur-sm shadow-lg select-none">
        {/* Sticky header with icons */}
        <div
          className={clsx(
            "sticky top-0 z-10 px-1.5 min-h-[55px] py-2.5 border-b",
            "flex items-center",
            {
              "border-slate-700/30": isScrolled,
              "border-transparent": !isScrolled,
            }
          )}
          data-tauri-drag-region
        >
          <div className="flex w-full justify-end items-center" data-tauri-drag-region>
            <div className="flex space-x-3 select-none">
              {/* Books Icon */}
              <button
                onClick={() => onCategoryChange("Books")}
                className={clsx(
                  "px-1.5 py-1 rounded-md transition-all duration-200",
                  {
                    "text-cyan-500 bg-slate-700/10": isBooks,
                    "text-slate-500 hover:text-cyan-300 hover:bg-slate-700/20": !isBooks,
                  }
                )}
                title="Books"
              >
                <BookIcon />
              </button>

              {/* Authors Icon */}
              <button
                onClick={() => onCategoryChange("Authors")}
                className={clsx(
                  "px-1.5 py-1 rounded-md transition-all duration-200",
                  {
                    "text-cyan-500 bg-slate-700/10": !isBooks,
                    "text-slate-500 hover:text-cyan-300 hover:bg-slate-700/20": isBooks,
                  }
                )}
                title="Authors"
              >
                <UsersIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable list */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-none p-1 select-none"
          onScroll={handleScroll}
        >
          {isEmpty && (
            <div className="flex-1 flex items-center justify-center h-full select-auto">
              <div className="text-slate-500 italic text-sm">No {itemType}s to show</div>
            </div>
          )}
          {!isEmpty && (
            <ul className="px-2 py-0.5 space-y-1">
              {items.map((item) => {
                const isSelected = selected && selected.id === item.id;
                return (
                  <Tooltip
                    content={item[property]}
                    usePortal={true}
                  >
                    <li
                      key={`navbar-item-${item.id}`}
                      className={`cursor-pointer py-1.5 px-1.5 text-sm font-medium truncate rounded transition-all duration-200 hover:bg-slate-700/20 select-none ${isSelected
                        ? 'text-cyan-400 bg-slate-700/30'
                        : 'text-slate-300 hover:text-white'
                        }`}
                      onClick={() => onSelection(item)}>
                      {item[property]}
                    </li>
                  </Tooltip>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 transition-all duration-200 ${isResizing
          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
          : 'hover:bg-cyan-400/50 hover:shadow-[0_0_5px_rgba(34,211,238,0.4)]'
          }`}
        onMouseDown={startResizing}
      />
    </div>
  );
}

export default Navbar;
