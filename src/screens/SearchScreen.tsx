import { useState, useRef, useEffect } from "react";
import QuoteBox from "@components/QuoteBox";
import { Book, Author, Quote, QuoteFts, QuoteWithTagsRedux } from "@customTypes/index.ts";
import Footer from "@components/Footer";
import { useSearchStore } from "@stores/search";
import { useQuoteStore } from "@stores/quotes";
import clsx from "clsx";
import BookIcon from "@icons/BookIcon";
import SearchIcon from "@icons/Search";
import UserIcon from "@icons/User";
import DetailsIcon from "@icons/Details";
import DocumentIcon from "@components/icons/Document";

type SearchScreenProps = {
  books: Book[],
  authors: Author[],
  navigateToBook: (bookId: string) => void,
  navigateToAuthor: (authorId: string) => void,
  updateQuote: (note: Quote) => void,
  starQuote: (quote: Quote) => void,
  removeQuote: (quote: Quote) => void
}

function SearchScreen(props: SearchScreenProps) {
  const searchStore = useSearchStore();
  const quoteStore = useQuoteStore();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const quotesContainerRef = useRef<HTMLDivElement>(null);

  const [selectedQuote, setSelectedQuote] = useState<QuoteFts | null>(null);

  // Find book and author for a note
  const getBookAndAuthor = (quote: QuoteFts | Quote) => {
    const book = props.books.find(b => b.id === quote.book_id);
    const author = book ? props.authors.find(a => a.id === book.author_id) : null;
    return { book, author };
  };

  const searchQuotes = searchStore.results?.quotes || [];
  const searchBooks = searchStore.results?.books || [];
  const searchAuthors = searchStore.results?.authors || [];

  const hasResults = searchQuotes.length > 0 || searchBooks.length > 0 || searchAuthors.length > 0;
  const totalResults = searchQuotes.length + searchBooks.length + searchAuthors.length;

  const updateQuote = async (quote: QuoteWithTagsRedux) => {
    await quoteStore.updateQuote(quote);
    await searchStore.searchBy();
  }

  const removeQuote = async (quote: QuoteWithTagsRedux) => {
    await quoteStore.deleteQuote(quote);
    await searchStore.searchBy();
  }

  const handleStarClick = async (quote: QuoteWithTagsRedux) => {
    await quoteStore.toggleFavouriteQuote(quote.id);
    await searchStore.searchBy();
  }

  // Handle click outside for selected quote
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quotesContainerRef.current && !(quotesContainerRef.current as HTMLElement).contains(event.target as Node)) {
        setSelectedQuote(null);
        }
      }
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="mb-6 pb-4 border-b border-generic-border flex items-center">
          <SearchIcon className="h-5 w-5 mr-2 text-brand-primary" strokeWidth={2} />
          <h3 className="text-muted font-medium">
            Search Results for:
            <span className="text-brand-primary ml-2 font-semibold">{searchStore.search}</span>
          </h3>
        </div>

        {/* Books section */}
        {searchBooks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted mb-3 flex items-center">
              <BookIcon className="h-4 w-4 mr-2 text-brand-primary" />
              Books ({searchBooks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchBooks.map(book => {
                const author = props.authors.find(a => a.id === book.author_id);
                return (
                  <div
                    key={`book-result-${book.id}`}
                    className={clsx(
                      "bg-box-background rounded-md p-3 border border-box-border hover:border-box-border-hover",
                      "hover:bg-box-background-hover cursor-pointer transition-all duration-200"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      props.navigateToBook(book.id);
                    }}
                  >
                    <div className="font-medium text-muted">{book.title}</div>
                    {author && (
                      <div className="text-xs text-foreground mt-1">
                        by{" "}
                        <span
                          className="hover:text-brand-primary transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.navigateToAuthor(author.id);
                          }}
                        >
                          {author.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Authors section */}
        {searchAuthors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-brand-primary" strokeWidth={2} />
              Authors ({searchAuthors.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchAuthors.map(author => (
                <div
                  key={`author-result-${author.id}`}
                  className="bg-box-background rounded-md p-3 border border-box-border 
                            hover:border-box-border-hover hover:bg-box-background-hover 
                            cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.navigateToAuthor(author.id);
                  }}
                >
                  <div className="font-medium text-muted">{author.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes section */}
        {searchQuotes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted mb-3 flex items-center">
              <DocumentIcon className="h-4 w-4 mr-2 text-brand-primary" strokeWidth={2} />
              Quotes ({searchQuotes.length})
            </h4>
            <div className="flex flex-col space-y-4 pb-4">
              {searchQuotes.map((quote) => {
                const { book, author } = getBookAndAuthor(quote);
                return (
                  <div 
                    key={`search-result-${quote.id}`} 
                    className="space-y-1"
                    ref={quotesContainerRef}
                  >
                    {quote.book_title && quote.author_name && (
                      <div className="flex items-center text-xs text-foreground mb-1 ml-1">
                        <span
                          className="cursor-pointer hover:text-brand-primary transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (quote.book_id) {
                              props.navigateToBook(quote.book_id);
                            }
                          }}
                        >
                          {quote.book_title}
                        </span>
                        <span className="mx-1">by</span>
                        <span
                          className="cursor-pointer hover:text-brand-primary transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (quote.author_id) {
                              props.navigateToAuthor(quote.author_id);
                            }
                          }}
                        >
                          {quote.author_name}
                        </span>
                      </div>
                    )}
                    <QuoteBox
                      quote={quote}
                      tags={quote.tags}
                      selected={!!selectedQuote && quote.id === selectedQuote?.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuote(quote as QuoteFts);
                      }}
                      onStarClick={() => handleStarClick(quote)}
                      onEdit={(content) => updateQuote({ ...quote, content })}
                      onRemove={() => removeQuote(quote)}
                      onTagUpdate={() => searchStore.searchBy()}
                      scrollContainerRef={scrollContainerRef}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasResults && searchStore.search?.length && searchStore.search.length > 2 && (
          <div className="text-center py-10">
            <div className="text-muted-foreground text-lg mb-2">No results found</div>
            <div className="text-foreground text-sm">Try a different search term</div>
          </div>
        )}
        {!hasResults && searchStore.search?.length && searchStore.search.length < 3 && (
          <div className="text-center py-10">
            <div className="text-muted-foreground text-lg mb-2">Search term too short</div>
            <div className="text-foreground text-sm">Please enter at least 3 characters</div>
          </div>
        )}
      </div>

      <Footer
        leftContent={`Search: ${searchStore.search}`}
        dataType="Results"
        dataCount={totalResults}
      />
    </>
  );
}

export default SearchScreen;
