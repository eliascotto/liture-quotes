import { useState, useEffect, useRef, MouseEvent, UIEvent } from "react";
import clsx from "clsx";
import BookIcon from "@icons/BookIcon";
import UsersIcon from "@icons/UsersIcon";
import Tooltip from "@components/Tooltip";
import { cleanText } from "@utils/index";
import SidebarLeft from "@components/icons/SidebarLeft";

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 240;

type NavbarProps = {
  property: string,
  items: any[],
  itemType: string,
  selected: any,
  collapsed: boolean,
  setCollapsed: (collapsed: boolean) => void,
  onCategoryChange: (category: string) => void,
  onSelection: (item: any) => void,
}

function Navbar({
  property, items, itemType, selected, collapsed, setCollapsed, onCategoryChange, onSelection
}: NavbarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const navbarRef = useRef(null);
  const scrollContainerRef = useRef(null);

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

  }, [collapsed]);

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

  // Handle the navbar collapsing and uncollapsing animation
  useEffect(() => {
    if (collapsed) {
      setTimeout(() => setWidth(0));
    } else {
      setWidth(DEFAULT_WIDTH); // Instantly restore to default width when uncollapsing
    }
  }, [collapsed]);

  const isBooks = property === "title";

  return (
    <div
      ref={navbarRef}
      className={clsx(
        "relative h-full border-r border-slate-700/50 bg-slate-900 select-none",
        {
          "border-r-0": collapsed,
        }
      )}
      style={{
        width: `${width}px`,
        // Avoid min-width when collapser for smooth animation
        ...(!collapsed ? { minWidth: `${MIN_WIDTH}px` } : {}),
        maxWidth: `${MAX_WIDTH}px`,
        transition: "width 0.1s",
      }}
    >
      <div className="h-full flex flex-col select-none">
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
          <div className="flex items-center ml-[74px]">
            <button
              onClick={() => setCollapsed(true)}
              className="px-1.5 py-1 text-slate-400 hover:text-cyan-500 hover:bg-slate-700/20 rounded-md transition-all duration-200"
            >
              <SidebarLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex w-full justify-end items-center" data-tauri-drag-region>
            {!collapsed && (
              <div className="flex space-x-1.5 select-none">
                {/* Books Icon */}
                <button
                  onClick={() => onCategoryChange("Books")}
                className={clsx(
                  "px-1.5 py-1 rounded-md transition-all duration-200",
                  {
                    "text-cyan-500 bg-slate-700/10": isBooks,
                    "text-slate-400 hover:text-cyan-300 hover:bg-slate-700/20": !isBooks,
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
                    "text-slate-400 hover:text-cyan-300 hover:bg-slate-700/20": isBooks,
                  }
                )}
                title="Authors"
              >
                <UsersIcon />
                </button>
              </div>
            )}
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
                const isEmpty = item[property] === "";
                const cleanedText = cleanText(item[property]);

                if (isEmpty) {
                  return (
                    <li
                      className={clsx(
                        "cursor-pointer min-h-[32px] py-1.5 px-1.5 text-sm italic font-medium truncate rounded transition-all duration-200 hover:bg-slate-700/20 select-none",
                        isSelected ? "text-cyan-400 bg-slate-700/30" : "text-slate-600 hover:text-white"
                      )}
                      onClick={() => onSelection(item)}>
                      No title
                    </li>
                  )
                }

                return (
                  <Tooltip
                    key={`navbar-item-${item.id}`}
                    content={cleanedText}
                    usePortal={true}
                  >
                    <li
                      className={clsx(
                        "cursor-pointer min-h-[32px] py-1.5 px-1.5 text-sm font-medium truncate rounded transition-all duration-200 hover:bg-slate-700/20 select-none",
                        isSelected ? "text-cyan-400 bg-slate-700/30" : "text-slate-300 hover:text-white"
                      )}
                      onClick={() => onSelection(item)}>
                      {cleanedText}
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
