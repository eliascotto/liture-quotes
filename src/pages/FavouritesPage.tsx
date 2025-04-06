import { useState, useEffect } from "react";
import QuoteBox from "@components/QuoteBox";
import DualSortMenu from "@components/DualSortMenu";
import { Quote, StarredQuote, StarredQuoteWithTags } from "@customTypes/index";
import { convertStarredQuoteToQuote } from "@customTypes/convert";
import { useQuoteStore } from "@stores/quotes";

type FavouritesPageProps = {
  navigateToBook: (bookId: string) => void,
  onStarClick: (quote: StarredQuote) => void,
  reloadFavourites: (sortBy: string, sortOrder: "ASC" | "DESC") => void
}

function FavouritesPage({
  navigateToBook,
  onStarClick,
  reloadFavourites,
}: FavouritesPageProps) {
  const quoteStore = useQuoteStore();

  const [selectedQuote, setSelectedQuote] = useState<StarredQuoteWithTags | null>(null);

  // Secondary sort
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
  const quotesByBook = quoteStore.starredQuotes.reduce((
    acc: Record<string, { title: string, author: string, quotes: StarredQuoteWithTags[] }>,
    quote: StarredQuoteWithTags) => {
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

  const updateQuote = (quote: StarredQuoteWithTags) => {
    quoteStore.updateQuote(quote);
  }

  const removeQuote = (quote: StarredQuoteWithTags) => {
    quoteStore.deleteQuote(quote);
  }

  useEffect(() => {
    reloadFavourites(quoteStore.sortByStarred, quoteStore.sortOrderStarred);
  }, [quoteStore.sortByStarred, quoteStore.sortOrderStarred]);

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="flex flex-row justify-between mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Starred Quotes
          </h1>
          <div className="flex gap-2">
            <DualSortMenu
              primarySort={{ field: quoteStore.sortByStarred, order: quoteStore.sortOrderStarred }}
              secondarySort={{ field: sortByBook, order: sortOrderBook }}
              sortByFields={sortByFields}
              sortLabels={sortLabels}
              onPrimarySortChange={(field, order) => {
                quoteStore.setSortByStarred(field);
                quoteStore.setSortOrderStarred(order as "ASC" | "DESC");
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
                {/* Book title and author */}
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

                {/* Quotes */}
                <div className="flex flex-col gap-4 pl-4 border-slate-700/30">
                  {book.quotes.map((quote) => (
                    <QuoteBox
                      key={quote.id}
                      quote={convertStarredQuoteToQuote(quote)}
                      tags={quote.tags}
                      selected={selectedQuote?.id === quote.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuote(quote);
                      }}
                      onEdit={(content) => updateQuote({ ...quote, content })}
                      onStarClick={() => onStarClick(quote)}
                      onRemove={() => removeQuote(quote)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full">
            <div className="text-slate-500 italic mb-2 text-sm">No favourite quotes yet</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FavouritesPage; 
