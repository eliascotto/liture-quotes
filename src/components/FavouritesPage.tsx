import { useState, useEffect } from "react";
import NoteBox from "@components/NoteBox";
import DualSortMenu from "@components/DualSortMenu";
import { Quote, StarredQuote } from "src/types/index";
import { convertStarredQuoteToQuote } from "../types/convert";

function FavouritesPage(
  { quotes, navigateToBook, updateQuote, onStarClick, removeQuote, reloadFavourites }:
    {
      quotes: StarredQuote[],
      navigateToBook: (bookId: string) => void,
      updateQuote: (quote: Quote) => void,
      onStarClick: (quote: StarredQuote) => void,
      removeQuote: () => void,
      reloadFavourites: (sortBy: string, sortOrder: "ASC" | "DESC") => void
    }
) {
  const [selectedQuote, setSelectedQuote] = useState<StarredQuote | null>(null);
  const [sortByItems, setSortByItems] = useState<string>("date_modified");
  const [sortOrderItems, setSortOrderItems] = useState<"ASC" | "DESC">("DESC");
  const [sortByBook, setSortByBook] = useState<string>("book");
  const [sortOrderBook, setSortOrderBook] = useState<"ASC" | "DESC">("DESC");
  const sortLabels = {
    primary: "Items Sort",
    secondary: "Books Sort"
  };
  const sortByFields = {
    primary: ["date_modified", "date_created"],
    secondary: ["book", "author"]
  };

  // Group quotes by book
  const quotesByBook = quotes.reduce((
    acc: Record<string, { title: string, author: string, quotes: StarredQuote[] }>,
    quote: StarredQuote) => {
    if (!!quote.book_id) {
      if (!acc[quote.book_id]) {
        acc[quote.book_id] = {
          title: quote.book_title ?? "",
          author: quote.author_name ?? "",
          quotes: []
        };
      }
      acc[quote.book_id].quotes.push(quote);
    }
    return acc;
  }, {});

  // Convert to array and sort books based on configured sort states
  const sortedBooks = Object.values(quotesByBook).sort((a, b) => {
    const aValue = sortByBook === "book" ? a.title : a.author;
    const bValue = sortByBook === "book" ? b.title : b.author;
    
    if (sortOrderBook === "ASC") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  useEffect(() => {
    reloadFavourites(sortByItems, sortOrderItems);
  }, [sortByItems, sortOrderItems]);

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="flex flex-row justify-between mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Starred Quotes
          </h1>
          <div className="flex gap-2">
            <DualSortMenu
              primarySort={{ field: sortByItems, order: sortOrderItems }}
              secondarySort={{ field: sortByBook, order: sortOrderBook }}
              sortByFields={sortByFields}
              sortLabels={sortLabels}
              onPrimarySortChange={(field, order) => {
                setSortByItems(field);
                setSortOrderItems(order as "ASC" | "DESC");
              }}
              onSecondarySortChange={(field, order) => {
                setSortByBook(field);
                setSortOrderBook(order as "ASC" | "DESC");
              }}
            />
          </div>
        </div>

        {Object.entries(quotesByBook).length > 0 ? (
          <div className="flex flex-col space-y-8">
            {sortedBooks.map((book) => (
              <div key={book.title} className="flex flex-col gap-4">
                <div className="flex items-baseline gap-3">
                  <button
                    onClick={() => navigateToBook(book.title)}
                    className="text-lg font-medium text-slate-200 hover:text-cyan-400 transition-colors duration-200 truncate max-w-[500px]"
                    title={book.title}
                  >
                    {book.title}
                  </button>
                  <span className="text-sm text-slate-500">by {book.author}</span>
                </div>
                <div className="flex flex-col gap-4 pl-4 border-l border-slate-700/30">
                  {book.quotes.map((quote) => (
                    <NoteBox
                      key={quote.id}
                      quote={convertStarredQuoteToQuote(quote)}
                      selected={selectedQuote?.id === quote.id}
                      editable={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuote(quote);
                      }}
                      onEdit={(content) => updateQuote(convertStarredQuoteToQuote({ ...quote, content }))}
                      onStarClick={() => onStarClick(quote)}
                      onRemove={removeQuote}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-slate-500 text-lg mb-2">No starred quotes yet</div>
            <div className="text-slate-400 text-sm">Star your favorite quotes to see them here</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavouritesPage; 
