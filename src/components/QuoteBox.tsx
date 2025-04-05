import { useCallback, useRef, useState, useEffect, MouseEvent as ReactMouseEvent } from "react";
import clsx from 'clsx';
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import StarIcon from "@icons/Star.tsx";
import EditIcon from "@icons/Edit";
import StarMenuIcon from "@icons/StarMenu";
import TrashIcon from "@icons/Trash";
import CopyIcon from "@icons/Copy";
import Tooltip from "@components/Tooltip";
import EditableNoteBox from "@components/EditableQuoteBox";
import { Note, Quote, QuoteFts, Tag } from "src/types/index";
import DotsVertical from "./icons/DotsVertical";
import TagFill from "./icons/TagFill";

type DropdownMenuProps = {
  isOpen: boolean,
  onCopy: () => void,
  onClose: () => void,
  onEdit: () => void,
  onStar: () => void,
  onRemove: () => void,
  isStarred: boolean,
  withIcons?: boolean
}

// Custom dropdown menu component
function DropdownMenu({
  isOpen, onCopy, onClose, onEdit, onStar, onRemove, isStarred, withIcons = false
}: DropdownMenuProps) {
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
      className="absolute right-0 top-1.5 mt-6 w-32 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg z-10 overflow-hidden backdrop-blur-sm"
    >
      <div className="py-0.5">
        <button
          onClick={onCopy}
          className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150 flex items-center gap-2"
        >
          {withIcons && <CopyIcon />} Copy
        </button>
        <button
          onClick={onEdit}
          className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150 flex items-center gap-2"
        >
          {withIcons && <EditIcon />} Edit
        </button>
        <button
          onClick={onStar}
          className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150 flex items-center gap-2"
        >
          {withIcons && <StarMenuIcon filled={!isStarred} />} {isStarred ? "Unstar" : "Star"}
        </button>
        <div className="border-t border-slate-700/50 my-0.5"></div>
        <button
          onClick={onRemove}
          className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-slate-700 transition-colors duration-150 flex items-center gap-2"
        >
          {withIcons && <TrashIcon />} Delete
        </button>
      </div>
    </div>
  );
}

type QuoteBoxProps = {
  quote: Quote | QuoteFts,
  tags: Tag[],
  note?: Note | null,
  onStarClick: () => void,
  onClick: (e: ReactMouseEvent) => void,
  selected: boolean,
  onEdit: (content: string) => void,
  onRemove: () => void,
  onNoteEdit?: (noteId: string, content: string) => void,
}

function QuoteBox({
  quote, tags, note, onStarClick, onClick, selected, onEdit, onRemove, onNoteEdit,
}: QuoteBoxProps) {
  const [editable, setEditable] = useState(false);
  const [noteEditable, setNoteEditable] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mouseOver, setMouseOver] = useState(false);
  const quoteRef = useRef(null);

  const empty = quote.content?.trim() === '';
  const hasTags = tags.length > 0;

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

  const handleMenuCopy = useCallback(() => {
    setMenuOpen(false);
    writeText(quote.content ?? "");
  }, [quote.content]);

  const handleNoteEdit = useCallback((noteId: string, content: string) => {
    setNoteEditable(false);
    if (onNoteEdit) {
      onNoteEdit(noteId, content);
    }
  }, [onNoteEdit]);

  return (
    <div className="relative my-2 group select-none" ref={quoteRef}>
      <div
        className="absolute top-[8px] -left-[22.5px] cursor-pointer flex flex-col items-center gap-1"
        onClick={() => onStarClick()}
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
      {hasTags && (
        <div className="absolute top-[4px] -right-[30px] cursor-pointer gap-1">
          <Tooltip content="Edit tags" usePortal delay={{ open: 1000 }}>
            <div className="flex flex-row items-center gap-0.5 hover:fill-slate-500 fill-slate-600 text-slate-600 hover:text-slate-500">
              <TagFill className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{tags.length}</span>
            </div>
          </Tooltip>
        </div>
      )}

      <div className="select-none">
        {/* Quote */}
        {editable ? (
          <EditableNoteBox
            item={quote}
            onSave={handleQuoteEdit}
            onCancel={() => setEditable(false)}
          />
        ) : (
          <div
            className={clsx(
              "relative w-full select-none",
              "text-slate-300 py-[8px] pl-4 pr-5 whitespace-pre-line transition-all duration-200 border border-l-2 border-l-slate-700/90",
              "hover:bg-slate-700/30",
              selected && "bg-slate-700/20  shadow-md",
              selected ? "border-slate-600/70 rounded-sm" : "border-transparent",
              empty && "text-opacity-30 cursor-default",
            )}
            onClick={(e: ReactMouseEvent) => handleClick(e)}
            onContextMenu={(e: ReactMouseEvent) => handleContextMenu(e)}
            onMouseEnter={() => setMouseOver(true)}
            onMouseLeave={() => setMouseOver(false)}
          >
            <span className="select-auto">{empty ? "Empty" : quote.content}</span>
            {/* Quote context menu */}
            {(mouseOver || selected) && (
              <div
                className="absolute top-0 right-0 rounded-sm p-0.5 pt-1.5"
                onClick={(e: ReactMouseEvent) => handleContextMenu(e)}
              >
                <DotsVertical className={clsx(
                  "h-5 w-5 hover:text-slate-400",
                  menuOpen ? "text-slate-400" : "text-slate-500",
                )} />
              </div>
            )}
          </div>
        )}

        {/* Note */}
        {!!note && (
          <>
            {noteEditable ? (
              <EditableNoteBox
                item={note}
                onSave={(content) => handleNoteEdit(note.id, content)}
                onCancel={() => setNoteEditable(false)}
                info="Comment"
              />
            ) : (
              <div
                id={note.id}
                className="ml-8 text-sm leading-6 italic text-slate-300/85 py-2.5 px-4 border-slate-700/50 group/note hover:bg-slate-700/50 select-none"
                onDoubleClick={() => onNoteEdit && setNoteEditable(true)}
              >
                <span className="select-auto">{note.content}</span>
              </div>
            )}
          </>
        )}

        <DropdownMenu
          isOpen={menuOpen}
          onCopy={handleMenuCopy}
          onClose={() => setMenuOpen(false)}
          onEdit={handleMenuEdit}
          onStar={handleMenuStar}
          onRemove={handleMenuRemove}
          isStarred={!!quote.starred}
        />
      </div>
    </div>
  );
}

export default QuoteBox
