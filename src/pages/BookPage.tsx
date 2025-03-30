import { useState, useEffect, useRef, Fragment, MouseEvent as MouseEventHandler, KeyboardEvent } from "react";
import clsx from "clsx";
import QuoteBox from "@components/QuoteBox";
import ItemMenu from '@components/ItemMenu.tsx';
import SortMenu from '@components/SortMenu.tsx';
import Tooltip from "@components/Tooltip.tsx";
import PlusIcon from '@icons/Plus';
import EditableNoteBox from "@components/EditableQuoteBox";
import { Book, Quote, StarredQuote, Author, Note } from "../../types/index";
import ChatBubble from "@components/icons/ChatBubble";

function EditableTitle({
  title, onSave, onCancel
}: {
  title: string, onSave: (title: string) => void, onCancel: () => void
}
) {
  const [currentTitle, setCurrentTitle] = useState(title);
  const inputRef = useRef(null);
  const editableTitleRef = useRef(null);

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
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

interface BookPageProps {
  book: Book;
  quotes: Quote[];
  author: Author;
  notes: Note[];
  sortBy: string;
  sortOrder: string;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: string) => void;
  navigateToAuthor: (authorId: string) => void;
  createNewQuote: (bookId: string, content: string) => void;
  toggleFavouriteQuote: (quote: Quote) => void;
  updateQuote: (quote: Quote) => void;
  deleteQuote: (quote: Quote) => void;
  onDeleteBook: (bookId: string) => void;
  updateBook: (book: Book) => void;
  updateNote: (noteId: string, content: string) => void;
}

function BookPage({
  book, quotes, author, notes,
  sortBy, sortOrder, setSortBy, setSortOrder,
  navigateToAuthor,
  createNewQuote, toggleFavouriteQuote, updateQuote, deleteQuote,
  onDeleteBook, updateBook, updateNote,
}: BookPageProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newQuote, setNewQuote] = useState<Quote | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [hasNotes, setHasNotes] = useState(true);
  const sortByFields = ["date_modified", "date_created", "chapter_progress"];

  const handleSortChange = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleRemoveQuote = async (quote: Quote) => {
    setSelectedQuote(null);
    deleteQuote(quote);
  };

  const handleCreateQuote = () => {
    let now = new Date().toISOString();
    setNewQuote({
      id: "",
      content: "",
      created_at: now,
      updated_at: now,
      book_id: book.id,
      chapter_progress: 0,
      book_title: book.title,
      author_id: author.id,
      author_name: author.name,
      starred: 0,
      chapter: null,
      deleted_at: null,
      imported_at: null,
      original_id: null,
    });
  };

  const handleNewQuoteSaving = (content: string) => {
    setNewQuote(null);
    createNewQuote(book.id, content);
  };

  const handleTitleClick = (e: MouseEventHandler<HTMLHeadingElement>) => {
    if (e.detail === 2) { // Double click
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = async (newTitle: string) => {
    if (newTitle.trim() !== book.title) {
      await updateBook({ ...book, title: newTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
  };

  const quoteWithNotes = quotes.map((quote) => {
    const note = notes.find((note) => note.quote_id === quote.id) || null;
    return { ...quote, note };
  });

  useEffect(() => {
    setHasNotes(notes.length > 0);
  }, [notes]);

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
          <div className="flex items-center space-x-2">
            <Tooltip content="Add new quote">
              <button
                onClick={handleCreateQuote}
                className="px-1.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-700/90 transition-colors duration-200 flex items-center space-x-1"
              >
                <PlusIcon />
              </button>
            </Tooltip>
            {hasNotes && (
              <Tooltip content="Toggle show notes">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="px-1.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-700/90 transition-colors duration-200 flex items-center space-x-1"
                >
                  <ChatBubble className={clsx("h-4 w-4", showNotes && "text-cyan-400")} />
                </button>
              </Tooltip>
            )}
          </div>
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
              item={newQuote}
              onSave={handleNewQuoteSaving}
              onCancel={() => setNewQuote(null)}
              placeholder="Type your quote here..."
            />
          )}

          {quoteWithNotes.map((quote) => (
            <QuoteBox
              key={quote.id}
              quote={quote}
              note={showNotes ? quote.note : null}
              selected={!!selectedQuote && !!selectedQuote.id && selectedQuote.id === quote.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedQuote(quote);
              }}
              onStarClick={() => toggleFavouriteQuote(quote)}
              onEdit={(content) => updateQuote({ ...quote, content })}
              onRemove={() => handleRemoveQuote(quote)}
              onNoteEdit={updateNote}
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
