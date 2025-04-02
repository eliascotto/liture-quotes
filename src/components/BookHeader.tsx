import { useState, useRef, useEffect, KeyboardEvent, Fragment, MouseEvent } from "react";
import clsx from "clsx";
import Tooltip from "@components/Tooltip";
import ItemMenu from "@components/ItemMenu";
import { Author, Book } from "@customTypes/index";
import { cleanText } from "@utils/index";

interface EditableTitleProps {
  title: string;
  onSave: (title: string) => void;
  onCancel: () => void;
}

function EditableTitle({
  title, onSave, onCancel
}: EditableTitleProps) {
  const [currentTitle, setCurrentTitle] = useState(cleanText(title));
  const inputRef = useRef(null);
  const editableTitleRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (editableTitleRef.current && !(editableTitleRef.current as HTMLElement).contains(event.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onSave(currentTitle);
    }
  };

  return (
    <div ref={editableTitleRef} className="items-center w-full bg-slate-800/80 shadow-lg border border-slate-700/50 pt-3 pb-2 px-5 backdrop-blur-sm">
      <textarea
        ref={inputRef}
        className={clsx(
          "bg-transparent w-full text-2xl font-bold outline-none w-full text-white resize-none outline-none leading-[1]"
        )}
        value={currentTitle}
        onChange={(e) => setCurrentTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="flex justify-end mt-0 border-t border-slate-700/30 pt-2">
        <Tooltip content="Cancel quote" shortcut="Esc">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md text-slate-400 hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
        </Tooltip>
        <Tooltip content="Save quote" shortcut="⏎">
          <button
            onClick={() => onSave(currentTitle ?? "")}
            className="px-3 py-1.5 text-sm rounded-md text-cyan-500 hover:bg-slate-700/50 font-medium transition-colors duration-200"
          >
            Save
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

interface BookHeaderProps {
  book: Book;
  author: Author;
  isEditingTitle: boolean;
  setIsEditingTitle: (isEditingTitle: boolean) => void;
  handleTitleSave: (title: string) => void;
  handleTitleCancel: () => void;
  handleTitleClick: (e: MouseEvent<HTMLHeadingElement>) => void;
  navigateToAuthor: (authorId: string) => void;
  onDeleteBook: (bookId: string) => void;
}

function BookHeader({ 
  book,
  author,
  isEditingTitle,
  setIsEditingTitle,
  handleTitleSave, 
  handleTitleCancel, 
  handleTitleClick, 
  navigateToAuthor, 
  onDeleteBook 
}: BookHeaderProps) 
{
  return (
    <div className="px-2 mb-3 pb-3 border-b border-slate-700/30">
      {isEditingTitle ? (
        <EditableTitle
          title={book.title}
          onSave={handleTitleSave}
          onCancel={handleTitleCancel}
        />
      ) : (
        <Fragment>
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text truncate text-ellipsis"
              onClick={handleTitleClick}
            >
              {cleanText(book.title)}
            </h1>
            <ItemMenu
              onEdit={() => setIsEditingTitle(true)}
              onDelete={() => onDeleteBook(book.id)}
              itemType="Book"
              itemName={cleanText(book.title)}
            />
          </div>
          <div className="py-1.5">
            <h3 className="text-slate-300 font-medium">
              Author:
              <span
                className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 cursor-pointer ml-1"
                onClick={() => navigateToAuthor(author.id)}
              >
                {author && cleanText(author.name)}
              </span>
            </h3>
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default BookHeader;
