import { useCallback, useRef, useState, useEffect } from "react";
import clsx from 'clsx';
import StarIcon from './icons/Star';
import EditIcon from './icons/Edit';
import StarMenuIcon from './icons/StarMenu';
import TrashIcon from './icons/Trash';

// Custom dropdown menu component
function DropdownMenu({ isOpen, onClose, onEdit, onStar, onRemove, isStarred }) {
  const menuRef = useRef(null);
  
  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
          <StarMenuIcon filled={isStarred} /> Star
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

function EditableBox(props) {
  const [currentText, setCurrentText] = useState(props.content);
  const textareaRef = useRef(null);

  useEffect(() => {
    // adjustTextareaHeight
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = textarea.scrollHeight;
      textarea.style.height = `${newHeight}px`;
    }
  }, [currentText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      props.onCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      props.onSave(currentText);
    }
  };

  return (
    <div className="rounded-lg my-2 bg-slate-800/80 shadow-lg border border-slate-700/50 py-3 px-5 backdrop-blur-sm">
      <textarea
        ref={textareaRef}
        className="outline-none bg-transparent w-full resize-none text-slate-200 focus:text-white transition-colors duration-200"
        autoFocus
        value={currentText}
        onChange={(e) => setCurrentText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-end mt-2 border-t border-slate-700/30 pt-2">
        <button
          onClick={props.onCancel}
          className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={() => props.onSave(currentText)}
          className="px-3 py-1.5 rounded-md text-cyan-500 hover:bg-slate-700/50 font-medium transition-colors duration-200"
          disabled={!currentText.trim()}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function NoteBox(props) {
  const [editable, setEditable] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const noteRef = useRef(null);

  const classBase = "text-slate-300 rounded-lg py-3 px-4 whitespace-pre-line transition-all duration-200";
  const selectedClass = `${classBase} bg-gradient-to-r from-slate-800/70 to-slate-800/80 shadow-md`;

  const handleClick = useCallback((e) => {
    if (e.detail === 1) {
      props.onClick?.(e);
    } else if (e.detail > 1) {
      // Multiple clicks
      props.onClick?.(e);
      window.getSelection().empty();
      setEditable(true);
    }
    e.preventDefault();
    e.stopPropagation();
  }, [props.onClick]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    props.onClick?.(e);
    setMenuOpen(true);
  }, [props.onClick]);

  const handleNoteEdit = useCallback((content) => {
    setEditable(false);
    if (props.onEdit) {
      props.onEdit(content);
    }
  }, [props.onEdit]);

  const handleStarClick = useCallback((e) => {
    e.stopPropagation();
    if (props.onStarClick) {
      props.onStarClick();
    }
  }, [props.onStarClick]);

  const handleMenuEdit = useCallback(() => {
    setMenuOpen(false);
    setEditable(true);
  }, []);

  const handleMenuStar = useCallback(() => {
    setMenuOpen(false);
    if (props.onStarClick) {
      props.onStarClick();
    }
  }, [props.onStarClick]);

  const handleMenuRemove = useCallback(() => {
    setMenuOpen(false);
    if (props.onRemove) {
      props.onRemove();
    }
  }, [props.onRemove]);

  if (editable) {
    return (
      <EditableBox
        content={props.note.content}
        onSave={handleNoteEdit}
        onCancel={() => setEditable(false)}
      />
    );
  }

  return (
    <div className="relative my-2 group" ref={noteRef}>
      <div 
        className={clsx(
          "absolute top-[10px] -left-[22.5px] cursor-pointer",
          {
            "text-yellow-500": props.starred,
            "text-slate-400": !props.starred && props.selected,
            "opacity-0 group-hover:opacity-100 text-slate-500": !props.starred && !props.selected
          }
        )}
        title="Star Note"
        onClick={handleStarClick}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <StarIcon fill={props.starred} />
      </div>
      <div className="relative">
        <div
          className={clsx(
            props.selected ? selectedClass : classBase,
            "hover:bg-slate-800/70"
          )}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >{props.note.content}</div>
        
        <DropdownMenu 
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onEdit={handleMenuEdit}
          onStar={handleMenuStar}
          onRemove={handleMenuRemove}
          isStarred={props.starred}
        />
      </div>
    </div>
  );
}

export default NoteBox
