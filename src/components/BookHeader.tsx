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
    <div 
      ref={editableTitleRef} 
      className="items-center w-full bg-editable-box-background shadow-lg border border-editable-box-border pt-3 pb-2 px-5 backdrop-blur-sm rounded-sm"
      >
      <textarea
        ref={inputRef}
        className={clsx(
          "bg-transparent w-full text-2xl font-bold outline-none w-full text-editable-box-foreground resize-none outline-none leading-[1]"
        )}
        value={currentTitle}
        onChange={(e) => setCurrentTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="flex justify-end mt-0 border-t border-editable-box-separator pt-2">
        <Tooltip content="Cancel quote" shortcut="Esc">
          <button
            onClick={onCancel}
            className={clsx(
              "px-3 py-1.5 text-sm rounded-md text-editable-box-button-foreground",
              "hover:text-editable-box-button-foreground-hover transition-colors duration-200"
            )}
          >
            Cancel
          </button>
        </Tooltip>
        <Tooltip content="Save quote" shortcut="⏎">
          <button
            onClick={() => onSave(currentTitle ?? "")}
            className={clsx(
              "px-3 py-1.5 text-sm rounded-md text-brand-primary-dark",
              "hover:bg-quote-box-selected font-medium transition-colors duration-200"
            )}
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
    <div className="px-2 mb-3 pb-3 border-b border-generic-border select-none">
      {isEditingTitle ? (
        <EditableTitle
          title={book.title}
          onSave={handleTitleSave}
          onCancel={handleTitleCancel}
        />
      ) : (
        <Fragment>
          <div className="flex items-center justify-between select-none">
            <h1
              className="text-2xl font-bold text-title bg-clip-text truncate text-ellipsis select-auto"
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
          <div className="py-1.5 select-none">
            <h3 className="text-subtitle font-medium select-auto">
              Author:
              <span
                className="text-foreground hover:text-brand-primary transition-colors duration-200 cursor-pointer ml-1"
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
