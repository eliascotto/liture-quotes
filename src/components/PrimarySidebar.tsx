import { useState, useEffect, useRef, MouseEvent, UIEvent } from "react";
import clsx from "clsx";
import BookIcon from "@icons/BookIcon";
import UsersIcon from "@icons/UsersIcon";
import Tooltip from "@components/Tooltip";
import { cleanText } from "@utils/index";
import SidebarLeft from "@components/icons/SidebarLeft";
import { usePrimarySidebarStore, useAppStore } from "@stores/index";

type PrimarySidebarProps = {
  property: string,
  items: any[],
  selected: any,
  onSelection: (item: any) => void,
}

function PrimarySidebar({
  property,
  items,
  selected,
  onSelection
}: PrimarySidebarProps) {
  const {
    isOpen,
    setIsOpen,
    width,
    setWidth,
    lastWidth,
    setLastWidth,
    isResizing,
    setIsResizing,
    isScrolled,
    setIsScrolled,
    isEmpty,
    setIsEmpty,
    fullyExpanded,
    setFullyExpanded,
    MIN_WIDTH,
    MAX_WIDTH,
  } = usePrimarySidebarStore();

  const appStore = useAppStore();

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

  const handleSidebarCollapse = () => {
    setLastWidth(width);
    setIsOpen(false);
    setFullyExpanded(false);
    setTimeout(() => setWidth(0));
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

  // Handle the navbar collapsing and uncollapsing animation
  useEffect(() => {
    if (!isOpen) {
      
    } else {
      setWidth(lastWidth); // Instantly restore to default width when uncollapsing
      setTimeout(() => setFullyExpanded(true), 100);
    }
  }, [isOpen]);

  const isBooks = property === "title";

  return (
    <div
      ref={navbarRef}
      className={clsx(
        "relative h-full border-r border-slate-700/30 bg-slate-900 select-none transition-all ease-linear",
        !isOpen && "border-r-0",
        fullyExpanded ? "duration-10" : "duration-100",
      )}
      style={{
        width: `${width}px`,
        // Avoid min-width when collapsed for smooth open-close animation
        ...(fullyExpanded && { minWidth: `${MIN_WIDTH}px` }),
        maxWidth: `${MAX_WIDTH}px`,
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

          {/* Sidebar Collapse Button */}
          <div className="flex items-center ml-[74px]">
            <button
              onClick={handleSidebarCollapse}
              className="px-1.5 py-1.5 text-slate-400 hover:text-cyan-500 hover:bg-slate-700/20 rounded-md transition-all duration-200"
            >
              <SidebarLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex w-full justify-end items-center" data-tauri-drag-region>
            {isOpen && (
              <div className="flex space-x-1 select-none">
                {/* Books Icon */}
                <button
                  onClick={() => appStore.setCurrentView("books")}
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
                  onClick={() => appStore.setCurrentView("authors")}
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
              <div className="text-slate-500 italic text-sm">No {appStore.currentView}s to show</div>
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

export default PrimarySidebar;
