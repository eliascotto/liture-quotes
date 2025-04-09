import { useState, useRef, MouseEvent as MouseEventHandler, useCallback, useEffect } from "react";
import clsx from "clsx";
import QuoteBox from "@components/QuoteBox";
import SortMenu from '@components/SortMenu.tsx';
import Tooltip from "@components/Tooltip.tsx";
import EditableNoteBox from "@components/EditableQuoteBox";
import ChatBubble from "@components/icons/ChatBubble";
import BookHeader from "@components/BookHeader";
import PlusIcon from '@icons/Plus';
import DetailsIcon from '@icons/Details';
import { Book, Quote, Author, Note, Chapter, QuoteWithTags } from "@customTypes/index";
import { useQuoteStore } from "@stores/quotes";
import Footer from "@components/Footer";

const QUOTES_GAP = "gap-y-1";

type QuoteWithNote = QuoteWithTags & { note: Note | null };

interface BookScreenProps {
  book: Book;
  author: Author;
  notes: Note[];
  chapters: Chapter[];
  navigateToAuthor: (authorId: string) => void;
  toggleFavouriteQuote: (quote: Quote) => void;
  onDeleteBook: (bookId: string) => void;
  updateBook: (book: Book) => void;
  updateNote: (noteId: string, content: string) => void;
}

function BookScreen({
  book, author, notes, chapters,
  navigateToAuthor,
  toggleFavouriteQuote,
  onDeleteBook, updateBook, updateNote,
}: BookScreenProps) {
  const quoteStore = useQuoteStore();
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const quotesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newQuote, setNewQuote] = useState<Quote | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [showChapters, setShowChapters] = useState(false);

  const sortByFields = ["date_modified", "date_created", "chapter_progress"];

  const handleSortChange = (field: string, order: "ASC" | "DESC") => {
    quoteStore.setSortBy(field);
    quoteStore.setSortOrder(order);
  };

  const handleRemoveQuote = async (quote: Quote) => {
    quoteStore.setSelectedQuote(null);
    quoteStore.deleteQuote(quote);
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
      chapter_id: null,
      deleted_at: null,
      imported_at: null,
      original_id: null,
    });
  };

  const handleNewQuoteSaving = (content: string) => {
    setNewQuote(null);
    quoteStore.addQuote(content);
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

  const handleTitleCancel = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  // ----------------- Effects

  useEffect(() => {
    // Handle click outside
    function handleClickOutside(event: MouseEvent) {
      if (quotesContainerRef.current && !(quotesContainerRef.current as HTMLElement).contains(event.target as Node)) {
        quoteStore.setSelectedQuote(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //------------------ Render

  const renderQuotes = (quotes: QuoteWithNote[]) => {
    return quotes.map((quote) => (
      <QuoteBox
        key={quote.id}
        quote={quote}
        tags={quote.tags}
        note={showNotes ? quote.note : null}
        selected={!!quoteStore.selectedQuote && !!quoteStore.selectedQuote.id && quoteStore.selectedQuote.id === quote.id}
        onClick={(e) => {
          e.stopPropagation();
          quoteStore.setSelectedQuote(quote);
        }}
        onStarClick={() => toggleFavouriteQuote(quote)}
        onEdit={(content) => quoteStore.updateQuote({ ...quote, content })}
        onRemove={() => handleRemoveQuote(quote)}
        onNoteEdit={updateNote}
        scrollContainerRef={pageContainerRef}
      />
    ))
  }

  const getQuotesWithNotes = (): QuoteWithNote[] => {
    return quoteStore.quotes.map((quote) => ({
      ...quote,
      note: notes.find((note) => note.quote_id === quote.id) || null,
    } as QuoteWithNote));
  };

  const renderChapterQuotes = () => {
    if (!showChapters) return renderQuotes(getQuotesWithNotes());

    const quoteByChapter = quoteStore.quotes.reduce((acc, quote) => {
      const chapter = chapters.find((c) => c.id === quote.chapter_id);
      if (chapter) {
        acc[chapter.id] = [
          ...(acc[chapter.id] || []),
          ({
            ...quote,
            note: notes.find((n) => n.quote_id === quote.id) || null
          } as QuoteWithNote)
        ];
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
    <>
      <div
        ref={pageContainerRef}
        className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full px-10 lg:px-14 xl:px-20 py-6 min-h-0"
      >
        <div
          
          className="flex flex-col h-full w-full xl:max-w-5xl 2xl:max-w-6xl mx-auto">
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
          <div className="flex justify-between items-center mb-2">
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
              sortBy={quoteStore.sortBy}
              sortOrder={quoteStore.sortOrder}
              sortByFields={sortByFields}
              onSortChange={handleSortChange}
            />
          </div>

          <div ref={quotesContainerRef} className={`flex flex-col ${QUOTES_GAP} select-none`}>
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
      </div>
      
      <Footer
        leftContent={book.title}
        dataType="Quotes"
        dataCount={quoteStore.quotes.length}
      />
    </>
  );
}

export default BookScreen;
