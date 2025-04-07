import { useState, useEffect, useRef } from "react";
import QuoteBox from "@components/QuoteBox";
import DualSortMenu from "@components/DualSortMenu";
import { Quote, QuoteRedux, QuoteWithTagsRedux } from "@customTypes/index";
import { convertStarredQuoteToQuote } from "@customTypes/convert";
import { useQuoteStore } from "@stores/quotes";
import { cleanText } from "@utils/index";
import Tooltip from "@components/Tooltip";

type ReducedQuote = {
  id: string;
  title: string;
  author: string;
  quotes: QuoteWithTagsRedux[];
}

type FavouritesScreenProps = {
  navigateToBook: (bookId: string) => void,
}

function FavouritesScreen({
  navigateToBook,
}: FavouritesScreenProps) {
  const quoteStore = useQuoteStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const quotesContainerRef = useRef<HTMLDivElement>(null);

  const [selectedQuote, setSelectedQuote] = useState<QuoteWithTagsRedux | null>(null);

  const [quotesByBook, setQuotesByBook] = useState<Record<string, ReducedQuote>>({});
  const [sortedQuotes, setSortedQuotes] = useState<ReducedQuote[]>([]);

  // Secondary sort [books]
  const [sortBySecondary, setSortBySecondary] = useState<"book" | "author">("book");
  const [sortOrderSecondary, setSortOrderSecondary] = useState<"ASC" | "DESC">("DESC");
  const sortLabels = {
    primary: "Items Sort",
    secondary: "Books Sort"
  };
  const sortByFields = {
    primary: ["date_modified", "date_created"],
    secondary: ["book", "author"]
  };

  const updateQuote = (quote: QuoteWithTagsRedux) => {
    quoteStore.updateQuote(quote);
  }

  const removeQuote = (quote: QuoteWithTagsRedux) => {
    quoteStore.deleteQuote(quote);
  }

  const handleStarClick = (quote: QuoteWithTagsRedux) => {
    quoteStore.toggleFavouriteQuote(quote.id);
  }

  // ----------------- Effects

  // Sort quotes by sort-by and sort-order
  useEffect(() => {
    setSortedQuotes(Object.values(quotesByBook).sort((a, b) => {
      const aValue = sortBySecondary === "book" ? a.title : a.author;
      const bValue = sortBySecondary === "book" ? b.title : b.author;

      return sortOrderSecondary === "ASC" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }));
  }, [quotesByBook, sortBySecondary, sortOrderSecondary]);

  // Group quotes by book
  useEffect(() => {
    setQuotesByBook(quoteStore.starredQuotes.reduce((
      acc: Record<string, ReducedQuote>,
      quote: QuoteWithTagsRedux
    ) => {
      if (!!quote.book_id) {
        if (!acc[quote.book_id]) {
          acc[quote.book_id] = {
            id: quote.book_id,
            title: quote.book_title ?? "",
            author: quote.author_name ?? "",
            quotes: []
          };
        }
        acc[quote.book_id].quotes.push(quote);
      }
      return acc;
    }, {}));
  }, [quoteStore.starredQuotes]);

  // Reload on sort change
  useEffect(() => {
    quoteStore.fetchStarredQuotes();
  }, [quoteStore.sortByStarred, quoteStore.sortOrderStarred]);

  // Handle click outside for selected quote
  useEffect(() => {
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

  //----------------- Render

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div ref={scrollContainerRef} className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="flex flex-row justify-between mb-6 pb-4 border-b border-slate-700/30">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Starred Quotes
          </h1>
          <div className="flex gap-2">
            <DualSortMenu
              primarySort={{ field: quoteStore.sortByStarred, order: quoteStore.sortOrderStarred }}
              secondarySort={{ field: sortBySecondary, order: sortOrderSecondary }}
              sortByFields={sortByFields}
              sortLabels={sortLabels}
              onPrimarySortChange={(field, order) => {
                quoteStore.setSortByStarred(field);
                quoteStore.setSortOrderStarred(order as "ASC" | "DESC");
              }}
              onSecondarySortChange={(field, order) => {
                setSortBySecondary(field as "book" | "author");
                setSortOrderSecondary(order as "ASC" | "DESC");
              }}
            />
          </div>
        </div>

        {Object.entries(quotesByBook).length > 0 ? (
          <div className="flex flex-col space-y-8">
            {sortedQuotes.map((book) => (
              <div key={book.title} className="flex flex-col gap-4">
                {/* Book title and author */}
                <div className="flex items-baseline gap-3">
                  <Tooltip content={book.title} usePortal>
                    <button
                      onClick={() => navigateToBook(book.id)}
                      className="text-lg font-medium text-slate-200 hover:text-cyan-400 transition-colors duration-200 truncate max-w-[90%] cursor-pointer truncate text-ellipsis"
                    >
                      {cleanText(book.title)}
                    </button>
                  </Tooltip>
                  <span className="text-sm text-slate-500">by {cleanText(book.author)}</span>
                </div>

                {/* Quotes */}
                <div ref={quotesContainerRef} className="flex flex-col gap-4 pl-4 border-slate-700/30">
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
                      onStarClick={() => handleStarClick(quote)}
                      onRemove={() => removeQuote(quote)}
                      scrollContainerRef={scrollContainerRef}
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

export default FavouritesScreen; 
