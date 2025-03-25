import { useCallback, useRef, useState, useEffect, MouseEvent as ReactMouseEvent } from "react";
import clsx from 'clsx';
import StarIcon from './icons/Star';
import EditIcon from './icons/Edit';
import StarMenuIcon from './icons/StarMenu';
import TrashIcon from './icons/Trash';
import Tooltip from "./Tooltip";
import { Quote } from "src/types/index";

// Custom dropdown menu component
function DropdownMenu(
  { isOpen, onClose, onEdit, onStar, onRemove, isStarred }:
    {
      isOpen: boolean,
      onClose: () => void,
      onEdit: () => void,
      onStar: () => void,
      onRemove: () => void,
      isStarred: boolean
    }
) {
  const menuRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
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
      className="absolute right-0 top-0 mt-6 w-32 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-10 overflow-hidden backdrop-blur-sm"
    >
      <div className="py-0.5">
        <button
          onClick={onEdit}
          className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-150 flex items-center gap-2"
        >
          <EditIcon /> Edit
        </button>
        <button
          onClick={onStar}
          className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors duration-150 flex items-center gap-2"
        >
          <StarMenuIcon filled={!isStarred} /> {isStarred ? "Unstar" : "Star"}
        </button>
        <div className="border-t border-slate-700/50 my-0.5"></div>
        <button
          onClick={onRemove}
          className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-slate-700/50 hover:text-red-300 transition-colors duration-150 flex items-center gap-2"
        >
          <TrashIcon /> Remove
        </button>
      </div>
    </div>
  );
}

function EditableBox(
  { quote, onSave, onCancel }:
    { quote: Quote, onSave: (content: string) => void, onCancel: () => void }
) {
  const [currentText, setCurrentText] = useState(quote.content);
  const textareaRef = useRef(null);
  const editableBoxRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
      if (editableBoxRef.current && !(editableBoxRef.current as HTMLElement).contains(event.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  useEffect(() => {
    // adjustTextareaHeight
    const textarea = textareaRef.current;
    if (textarea) {
      (textarea as HTMLTextAreaElement).style.height = "auto";
      const newHeight = (textarea as HTMLTextAreaElement).scrollHeight;
      (textarea as HTMLTextAreaElement).style.height = `${newHeight}px`;
    }
  }, [currentText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSave(currentText ?? "");
    }
  };

  return (
    <div 
      ref={editableBoxRef}
      className="rounded-lg my-2 bg-slate-800/80 shadow-lg border border-slate-700/50 py-3 px-5 backdrop-blur-sm select-none"
    >
      <textarea
        ref={textareaRef}
        className="outline-none bg-transparent w-full resize-none text-slate-200 focus:text-white transition-colors duration-200"
        autoFocus
        value={currentText ?? ""}
        onChange={(e) => setCurrentText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-end mt-2 border-t border-slate-700/30 pt-2">
        <Tooltip content="Cancel quote" shortcut="Esc">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
        </Tooltip>
        <Tooltip content="Save quote" shortcut="⌘ ⏎">
          <button
            onClick={() => onSave(currentText ?? "")}
            className="px-3 py-1.5 rounded-md text-cyan-500 hover:bg-slate-700/50 font-medium transition-colors duration-200"
          >
            Save
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function NoteBox(
  { quote, onStarClick, onClick, selected, onEdit, onRemove, editable: editableProp }:
    {
      quote: Quote,
      selected: boolean,
      editable: boolean,
      onClick: (e: ReactMouseEvent) => void,
      onStarClick: () => void,
      onEdit: (content: string) => void,
      onRemove: () => void,
    }
) {
  const [editable, setEditable] = useState(editableProp);
  const [menuOpen, setMenuOpen] = useState(false);
  const quoteRef = useRef(null);

  const classBase = "text-slate-300 rounded-lg py-3 px-4 whitespace-pre-line transition-all duration-200";
  const selectedClass = `${classBase} bg-gradient-to-r from-slate-800/70 to-slate-800/80 shadow-md`;

  const empty = quote.content?.trim() === '';

  const handleClick = useCallback((e: ReactMouseEvent) => {
    if (e.detail === 1) {
      onClick?.(e);
    } else if (e.detail > 1) {
      // Multiple clicks
      onClick?.(e);
      window.getSelection()?.empty();
      setEditable(true);
    }
    e.preventDefault();
    e.stopPropagation();
  }, [onClick]);

  const handleContextMenu = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    onClick?.(e);
    setMenuOpen(true);
  }, [onClick]);

  const handleQuoteEdit = useCallback((content: string) => {
    setEditable(false);
    if (onEdit) {
      onEdit(content);
    }
  }, [onEdit]);

  const handleMenuEdit = useCallback(() => {
    setMenuOpen(false);
    setEditable(true);
  }, []);

  const handleMenuStar = useCallback(() => {
    setMenuOpen(false);
    if (onStarClick) {
      onStarClick();
    }
  }, [onStarClick]);

  const handleMenuRemove = useCallback(() => {
    setMenuOpen(false);
    if (onRemove) {
      onRemove();
    }
  }, [onRemove]);

  return (
    <div className="relative my-2 group" ref={quoteRef}>
      <div
        className="absolute top-[10px] -left-[22.5px] cursor-pointer"
        onClick={() => onStarClick()}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Tooltip content={quote.starred ? "Unstar Quote" : "Star Quote"} usePortal>
          <div className={clsx({
            "text-yellow-500": !!quote.starred,
            "text-slate-400": !quote.starred && selected,
            "opacity-0 group-hover:opacity-100 text-slate-500": !quote.starred && !selected
          })}>
            <StarIcon fill={!!quote.starred} />
          </div>
        </Tooltip>
      </div>
      {editable ? (
        <EditableBox
          quote={quote}
          onSave={handleQuoteEdit}
          onCancel={() => setEditable(false)}
        />
      ) : (
        <div className="relative">
          <div
            className={clsx(
              "min-h-[48px]",
              selected ? selectedClass : classBase,
              empty && "text-opacity-30 select-none cursor-default",
              "hover:bg-slate-800/70"
            )}
            onClick={(e: ReactMouseEvent) => handleClick(e)}
            onContextMenu={(e: ReactMouseEvent) => handleContextMenu(e)}
          >{empty ? "Empty" : quote.content}</div>

          <DropdownMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onEdit={handleMenuEdit}
            onStar={handleMenuStar}
            onRemove={handleMenuRemove}
            isStarred={!!quote.starred}
          />
        </div>
      )}

    </div>
  );
}

export default NoteBox
