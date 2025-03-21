import { useState, useEffect, useCallback } from "react";
import { invoke } from '@tauri-apps/api/core';
import NoteBox from "@components/NoteBox";
import ItemMenu from '@components/ItemMenu';
import SortMenu from '@components/SortMenu';
import PlusIcon from '@icons/Plus';

function EditQuoteForm(props) {
  return (
    <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
      <textarea
        className="w-full h-32 p-3 bg-slate-900/50 rounded border border-slate-700/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-200"
        placeholder="Write your quote here..."
        value={props.newQuoteContent}
        onChange={(e) => props.setNewQuoteContent(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end space-x-2 mt-2">
        <button
          onClick={props.handleCancelQuote}
          className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={props.handleSaveQuote}
          className="px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors duration-200"
        >
          Save Quote
        </button>
      </div>
    </div>
  );
}

function BookPage({ book, author, starred, navigateToAuthor, toggleFavouriteQuote, updateQuote, onDeleteBook, ...props }) {
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [sortBy, setSortBy] = useState("date_modified");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [quotes, setQuotes] = useState([]);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [newQuoteContent, setNewQuoteContent] = useState("");

  useEffect(() => {
    loadQuotes();
  }, [book.id, sortBy, sortOrder]);

  const loadQuotes = async () => {
    try {
      const result = await invoke('get_all_quotes', {
        bookId: book.id,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      setQuotes(result);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleRemoveQuote = async (quote) => {
    try {
      await invoke('delete_quote', {
        quoteId: quote.id
      });
      setSelectedQuote(null);
      await loadQuotes(); // Refresh quotes after removing
    } catch (error) {
      console.error('Error removing quote:', error);
    }
  };

  const handleCreateQuote = () => {
    setIsCreatingQuote(true);
    setNewQuoteContent("");
  };

  const handleSaveQuote = async () => {
    if (!newQuoteContent.trim()) return;

    try {
      await invoke('create_quote', {
        bookId: book.id,
        content: newQuoteContent
      });
      setIsCreatingQuote(false);
      setNewQuoteContent("");
      await loadQuotes(); // Refresh quotes after creating
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  const handleCancelQuote = () => {
    setIsCreatingQuote(false);
    setNewQuoteContent("");
  };

  const bookHeader = (
    <div className="px-2 mb-4 pb-4 border-b border-slate-700/30">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {book.title}
        </h1>
        <ItemMenu
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
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        {bookHeader}

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleCreateQuote}
            title="Add new highlight"
            className="px-1.5 py-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-700/20 transition-colors duration-200 flex items-center space-x-1"
          >
            <PlusIcon />
          </button>
          <SortMenu
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {isCreatingQuote && (
          <EditQuoteForm
            newQuoteContent={newQuoteContent}
            setNewQuoteContent={setNewQuoteContent}
            handleCancelQuote={handleCancelQuote}
            handleSaveQuote={handleSaveQuote}
          />
        )}

        <div className="space-y-4">
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
              onEdit={(content) => updateQuote(quote, content)}
              onRemove={() => handleRemoveQuote(quote)}
              starred={starred}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookPage;
