import { useState, useRef, useEffect } from "react";
import clsx from 'clsx';
import PlusIcon from "@icons/Plus";
import NewAuthorForm from "@components/NewAuthorForm.tsx";
import NewBookForm from "@components/NewBookForm.jsx";
import { useDialog } from "@context/DialogContext.tsx";
import { Author } from "@customTypes/index";
import Logger from "@utils/logger";
import UserIcon from "@icons/User";
import ImportIcon from "./icons/Import";

const logger = Logger.getInstance();

type AddButtonProps = {
  onClick: (type: string, data: any) => Promise<boolean>,
  authors: Author[],
  selectedAuthor: Author | null,
}

function AddButton({
  onClick, authors, selectedAuthor
}: AddButtonProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { openDialog } = useDialog();
  const popoverRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
      if (isPopoverOpen && popoverRef.current && !(popoverRef.current as HTMLElement).contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const togglePopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const handleAddAuthor = () => {
    closePopover();

    openDialog(
      "Add New Author",
      <NewAuthorForm
        onSubmit={async (authorName: string) => {
          logger.debug("Attempting to create author:", authorName);
          try {
            const result = await onClick("author", { authorName });
            logger.debug("Author creation result:", result);
            return result;
          } catch (error) {
            logger.error("Error creating author:", error);
            return false;
          }
        }}
        onCancel={() => { }} // Dialog will be closed by the DialogProvider
      />
    );
  };

  const handleAddBook = () => {
    closePopover();

    openDialog(
      "Add New Book",
      <NewBookForm
        onSubmit={async (bookData) => {
          try {
            return await onClick("book", bookData);
          } catch (error) {
            console.error("Error creating book:", error);
            return false;
          }
        }}
        onCancel={() => { }} // Dialog will be closed by the DialogProvider
        authors={authors || []}
        selectedAuthor={selectedAuthor}
      />
    );
  };

  return (
    <div className="relative z-40" ref={popoverRef}>
      <button
        className={clsx(
          "p-1.5 rounded-md transition-colors duration-200 bg-transparent",
          "hover:text-cyan-400 hover:bg-slate-700/50",
          isPopoverOpen ? "text-cyan-400" : "text-slate-300"
        )}
        title="Add new item"
        onClick={togglePopover}
        aria-expanded={isPopoverOpen}
      >
        <PlusIcon />
      </button>

      {isPopoverOpen && (
        <div className={clsx(
          "absolute top-full left-0 z-[60] min-w-40 bg-slate-800 border border-slate-700/50 ring-1 ring-black/5 z-50 rounded-md shadow-xl overflow-hidden",
          "border border-slate-700/50"
        )}>
          <div className="my-0.5">
            <button
              className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 text-slate-300 hover:bg-slate-700/50 hover:text-slate-300 flex items-center"
              onClick={handleAddAuthor}
            >
              <UserIcon className="w-4 h-4 mr-2" />
              New Author
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 text-slate-300 hover:bg-slate-700/50 hover:text-slate-300 flex items-center"
              onClick={handleAddBook}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              New Book
            </button>
            <div className="my-0.5 border-t border-slate-700/50"></div>
            <button
              className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 text-slate-300 hover:bg-slate-700/50 hover:text-slate-300 flex items-center"
              onClick={handleAddBook}
            >
              <ImportIcon className="w-4 h-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddButton;
