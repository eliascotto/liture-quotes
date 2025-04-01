import { useState, useEffect, useRef, Fragment, MouseEvent as MouseEventHandler, KeyboardEvent, useMemo } from "react";
import clsx from "clsx";
import QuoteBox from "@components/QuoteBox";
import ItemMenu from '@components/ItemMenu.tsx';
import SortMenu from '@components/SortMenu.tsx';
import Tooltip from "@components/Tooltip.tsx";
import EditableNoteBox from "@components/EditableQuoteBox";
import ChatBubble from "@components/icons/ChatBubble";
import BookHeader from "@components/BookHeader";
import PlusIcon from '@icons/Plus';
import DetailsIcon from '@icons/Details';
import { Book, Quote, Author, Note, Chapter } from "@customTypes/index";

const QUOTES_GAP = "gap-y-1";

type QuoteWithNote = Quote & { note: Note | null };

interface BookPageProps {
  book: Book;
  quotes: Quote[];
  author: Author;
  notes: Note[];
  chapters: Chapter[];
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
  book, quotes, author, notes, chapters,
  sortBy, sortOrder, setSortBy, setSortOrder,
  navigateToAuthor,
  createNewQuote, toggleFavouriteQuote, updateQuote, deleteQuote,
  onDeleteBook, updateBook, updateNote,
}: BookPageProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newQuote, setNewQuote] = useState<Quote | null>(null);

  const [showNotes, setShowNotes] = useState(true);
  const [showChapters, setShowChapters] = useState(false);

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

  const renderQuotes = (quotes: QuoteWithNote[]) => {
    return quotes.map((quote) => (
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
    ))
  }

  const getQuotesWithNotes = (): QuoteWithNote[] => {
    return quotes.map((quote) => ({
      ...quote,
      note: notes.find((note) => note.quote_id === quote.id) || null,
    }));
  };

  const renderChapterQuotes = () => {
    if (!showChapters) return renderQuotes(getQuotesWithNotes());

    const quoteByChapter = quotes.reduce((acc, quote) => {
      const chapter = chapters.find((c) => c.title === quote.chapter);
      if (chapter) {
        acc[chapter.id] = [...(acc[chapter.id] || []), { ...quote, note: notes.find((n) => n.quote_id === quote.id) || null }];
      }
      return acc;
    }, {} as Record<string, QuoteWithNote[]>);

    return chapters.map((chapter) => (
      quoteByChapter[chapter.id] ? (
        <div key={chapter.id} className={`flex flex-col ${QUOTES_GAP}`}>
          <div className="text-sm text-slate-400">{chapter.title}</div>
          {renderQuotes(quoteByChapter[chapter.id])}
        </div>
      ) : null
    ));
  };

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <BookHeader
          book={book}
          author={author}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          handleTitleSave={handleTitleSave}
          handleTitleCancel={handleTitleCancel}
          handleTitleClick={handleTitleClick}
          navigateToAuthor={navigateToAuthor}
          onDeleteBook={onDeleteBook}
        />

        <div className="flex justify-between items-center mb-3">
          {/* Header left */}
          <div className="flex items-center space-x-1">
            <Tooltip content="Add new quote">
              <button
                onClick={handleCreateQuote}
                className="px-1.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-700/90 transition-colors duration-200 flex items-center space-x-1"
              >
                <PlusIcon />
              </button>
            </Tooltip>
            {notes.length > 0 && (
              <Tooltip content="Toggle show notes">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="px-1.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-700/90 transition-colors duration-200 flex items-center space-x-1"
                >
                  <ChatBubble className={clsx("h-4 w-4", showNotes && "text-cyan-400")} />
                </button>
              </Tooltip>
            )}
            {chapters.length > 0 && (
              <Tooltip content="Toggle show chapters">
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className="px-1.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-700/90 transition-colors duration-200 flex items-center space-x-1"
                >
                  <DetailsIcon className={clsx("h-4 w-4", showChapters && "text-cyan-400")} />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Sort menu */}
          <SortMenu
            sortBy={sortBy}
            sortOrder={sortOrder}
            sortByFields={sortByFields}
            onSortChange={handleSortChange}
          />
        </div>

        <div className={`flex flex-col ${QUOTES_GAP} select-none`}>
          {/* Create new quote form, don't create quote until save is clicked */}
          {newQuote && (
            <EditableNoteBox
              item={newQuote}
              onSave={handleNewQuoteSaving}
              onCancel={() => setNewQuote(null)}
              placeholder="Type your quote here..."
            />
          )}

          <>{renderChapterQuotes()}</>
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
