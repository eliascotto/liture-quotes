import { useState, useEffect, useRef, Fragment } from "react";
import clsx from "clsx";
import NoteBox from "@components/NoteBox.tsx";
import ItemMenu from '@components/ItemMenu.tsx';
import SortMenu from '@components/SortMenu.tsx';
import Tooltip from "@components/Tooltip.tsx";
import PlusIcon from '@icons/Plus';
import EditableNoteBox from "@components/EditableNoteBox.tsx";

function EditableTitle({ title, onSave, onCancel }) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const inputRef = useRef(null);
  const editableTitleRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event) {
      if (editableTitleRef.current && !editableTitleRef.current.contains(event.target)) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onSave(currentTitle);
    }
  };

  return (
    <div ref={editableTitleRef} className="items-center w-full rounded-lg bg-slate-800/80 shadow-lg border border-slate-700/50 pt-3 pb-2 px-5 backdrop-blur-sm">
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

function BookPage({
  book, quotes, author, starred,
  sortBy, sortOrder, setSortBy, setSortOrder,
  navigateToAuthor,
  createNewQuote, toggleFavouriteQuote, updateQuote, deleteQuote,
  newlyCreatedQuoteId,
  onDeleteBook, updateBook, ...props
}) {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newQuote, setNewQuote] = useState(null);
  const sortByFields = ["date_modified", "date_created", "chapter_progress"];

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleRemoveQuote = async (quote) => {
    setSelectedQuote(null);
    deleteQuote(quote);
  };

  const handleCreateQuote = () => {
    setNewQuote({
      content: "",
      date_created: new Date().toISOString(),
      date_modified: new Date().toISOString(),
      book_id: book.id,
      chapter_progress: 0,
    });
  };

  const handleNewQuoteSaving = (content) => {
    setNewQuote(null);
    createNewQuote(book.id, content);
  };

  const handleTitleClick = (e) => {
    if (e.detail === 2) { // Double click
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = async (newTitle) => {
    if (newTitle.trim() !== book.title) {
      await updateBook({ ...book, title: newTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
  };

  const bookHeader = (
    <div className="px-2 mb-4 pb-4 border-b border-slate-700/30">
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
              className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent"
              onClick={handleTitleClick}
            >
              {book.title}
            </h1>
            <ItemMenu
              onEdit={() => setIsEditingTitle(true)}
              onDelete={() => onDeleteBook(book.id)}
              itemType="Book"
              itemName={book.title}
            />
          </div>
          <div className="py-1.5">
            <h3 className="text-slate-300 font-medium">
              Author:
              <span
                className="text-slate-400 hover:text-cyan-400 transition-colors duration-200 cursor-pointer ml-1"
                onClick={() => navigateToAuthor(author.id)}
              >
                {author && author.name}
              </span>
            </h3>
          </div>
        </Fragment>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        {bookHeader}

        <div className="flex justify-between items-center mb-4">
          <Tooltip content="Add new quote">
            <button
              onClick={handleCreateQuote}
              className="px-1.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-700/90 transition-colors duration-200 flex items-center space-x-1"
            >
              <PlusIcon />
            </button>
          </Tooltip>
          <SortMenu
            sortBy={sortBy}
            sortOrder={sortOrder}
            sortByFields={sortByFields}
            onSortChange={handleSortChange}
          />
        </div>

        <div className="space-y-4">
          {/* Create new quote form, don't create quote until save is clicked */}
          {newQuote && (
            <EditableNoteBox
              quote={newQuote}
              onSave={handleNewQuoteSaving}
              onCancel={() => setNewQuote(null)}
              placeholder="Type your quote here..."
            />
          )}

          {quotes.map((quote) => (
            <NoteBox
              key={quote.id}
              quote={quote}
              selected={selectedQuote && selectedQuote.id === quote.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedQuote(quote);
              }}
              onStarClick={() => toggleFavouriteQuote(quote)}
              onEdit={(content) => updateQuote({ ...quote, content })}
              onRemove={() => handleRemoveQuote(quote)}
              starred={starred}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex flex-row w-full h-8 items-center justify-between px-6 shadow-md bg-slate-900/80 border-t border-slate-700/30 backdrop-blur-sm z-10">
        <div className="text-xs text-slate-400">
          {book && book.title}
        </div>
        <div className="text-xs text-slate-400">
          Items: <span className="text-cyan-400 font-medium">{quotes.length}</span>
        </div>
      </div>
    </div>
  );
}

export default BookPage;
