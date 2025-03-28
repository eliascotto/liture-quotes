import { useState, useRef, useEffect } from "react";
import PlusIcon from "@icons/Plus";
import NewAuthorForm from "@components/NewAuthorForm.jsx";
import NewBookForm from "@components/NewBookForm.jsx";
import { useDialog } from "@context/DialogContext.tsx";

function AddButton({ onClick, selectedOption, authors, selectedAuthor }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { openDialog } = useDialog();
  const popoverRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event) {
      if (isPopoverOpen && popoverRef.current && !popoverRef.current.contains(event.target)) {
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
        onSubmit={async (authorName) => {
          try {
            return await onClick("author", { name: authorName });
          } catch (error) {
            console.error("Error creating author:", error);
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
        className="p-1.5 rounded-md transition-colors duration-200 text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50"
        title="Add new item"
        onClick={togglePopover}
        aria-expanded={isPopoverOpen}
      >
        <PlusIcon />
      </button>

      {isPopoverOpen && (
        <div className="absolute top-full left-0 z-[60] min-w-40 bg-slate-800 border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
          <div className="py-1">
            <div className="my-1">
              <button
                className="w-full text-left px-3 py-2.5 text-sm transition-colors duration-150 text-slate-300 hover:bg-slate-700/50 hover:text-slate-300 flex items-center"
                onClick={handleAddAuthor}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                New Author
              </button>
              <button
                className="w-full text-left px-3 py-2.5 text-sm transition-colors duration-150 text-slate-300 hover:bg-slate-700/50 hover:text-slate-300 flex items-center"
                onClick={handleAddBook}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                New Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddButton;
