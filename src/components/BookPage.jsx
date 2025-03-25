import { useState, useEffect, useCallback } from "react";
import NoteBox from "@components/NoteBox.tsx";
import ItemMenu from '@components/ItemMenu';
import SortMenu from '@components/SortMenu.tsx';
import Tooltip from "@components/Tooltip.tsx";
import PlusIcon from '@icons/Plus';

function BookPage({
  book, quotes, author, starred,
  sortBy, sortOrder, setSortBy, setSortOrder,
  navigateToAuthor,
  createNewQuote, toggleFavouriteQuote, updateQuote, deleteQuote,
  newlyCreatedQuoteId,
  onDeleteBook, ...props
}) {
  const [selectedQuote, setSelectedQuote] = useState(null);
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
    createNewQuote(book.id);
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
          <Tooltip content="Add new quote">
            <button
              onClick={handleCreateQuote}
              className="px-1.5 py-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-700/20 transition-colors duration-200 flex items-center space-x-1"
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
          {quotes.map((quote) => (
            <NoteBox
              key={quote.id}
              quote={quote}
              selected={selectedQuote && selectedQuote.id === quote.id}
              editable={newlyCreatedQuoteId === quote.id}
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
