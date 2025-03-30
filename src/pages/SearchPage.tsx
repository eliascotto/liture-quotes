import { useState } from "react";
import QuoteBox from "@components/QuoteBox";
import { Book, Author, Quote, QuoteFts } from "../../types/index";

type SearchPageProps = {
  books: Book[],
  authors: Author[],
  search: string,
  searchResults: {
    quotes: QuoteFts[],
    books: Book[],
    authors: Author[]
  },
  navigateToBook: (bookId: string) => void,
  navigateToAuthor: (authorId: string) => void,
  updateQuote: (note: Quote) => void,
  starQuote: (noteId: string) => void,
  removeQuote: (noteId: string) => void
}

function SearchPage(props: SearchPageProps) {
  const [selectedQuote, setSelectedQuote] = useState<QuoteFts | null>(null);

  // Find book and author for a note
  const getBookAndAuthor = (quote: QuoteFts) => {
    const book = props.books.find(b => b.id === quote.book_id);
    const author = book ? props.authors.find(a => a.id === book.author_id) : null;
    return { book, author };
  };

  const { quotes: searchQuotes = [], books: searchBooks = [], authors: searchAuthors = [] } = props.searchResults;
  const hasResults = searchQuotes.length > 0 || searchBooks.length > 0 || searchAuthors.length > 0;
  const totalResults = searchQuotes.length + searchBooks.length + searchAuthors.length;

  return (
    <div className="flex-1 flex flex-col items-center w-full h-full" onClick={() => setSelectedQuote(null)}>
      <div className="flex-1 flex flex-col overflow-y-auto overscroll-none w-full max-w-6xl px-10 lg:px-14 xl:px-20 py-6 min-h-0">
        <div className="mb-6 pb-4 border-b border-slate-700/30 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-slate-300 font-medium">
            Search Results for:
            <span className="text-cyan-400 ml-2 font-semibold">{props.search}</span>
          </h3>
        </div>

        {/* Books section */}
        {searchBooks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Books ({searchBooks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchBooks.map(book => {
                const author = props.authors.find(a => a.id === book.author_id);
                return (
                  <div
                    key={`book-result-${book.id}`}
                    className="bg-slate-800/40 rounded-md p-3 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/60 cursor-pointer transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.navigateToBook(book.id);
                    }}
                  >
                    <div className="font-medium text-slate-300">{book.title}</div>
                    {author && (
                      <div className="text-xs text-slate-400 mt-1">
                        by{" "}
                        <span
                          className="hover:text-cyan-300"
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
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Authors ({searchAuthors.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchAuthors.map(author => (
                <div
                  key={`author-result-${author.id}`}
                  className="bg-slate-800/40 rounded-md p-3 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-slate-800/60 cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.navigateToAuthor(author.id);
                  }}
                >
                  <div className="font-medium text-slate-300">{author.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes section */}
        {searchQuotes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Quotes ({searchQuotes.length})
            </h4>
            <div className="flex flex-col space-y-4 pb-4">
              {searchQuotes.map((quote) => {
                const { book, author } = getBookAndAuthor(quote);
                return (
                  <div key={`search-result-${quote.id}`} className="space-y-1">
                    {quote.book_title && quote.author_name && (
                      <div className="flex items-center text-xs text-slate-400 mb-1 ml-1">
                        <span
                          className="cursor-pointer hover:text-cyan-400 transition-colors duration-200"
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
                          className="cursor-pointer hover:text-cyan-400 transition-colors duration-200"
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
                      selected={!!selectedQuote && quote.id === selectedQuote?.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuote(quote);
                      }}
                      onStarClick={() => props.starQuote(quote.id)}
                      onEdit={(content) => props.updateQuote({ ...quote, content })}
                      onRemove={() => props.removeQuote(quote.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasResults && (
          <div className="text-center py-10">
            <div className="text-slate-500 text-lg mb-2">No results found</div>
            <div className="text-slate-400 text-sm">Try a different search term</div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-row w-full h-8 items-center justify-between px-6 shadow-md bg-slate-900/80 border-t border-slate-700/30 backdrop-blur-sm z-10">
        <div className="text-xs text-slate-400">
          Search: {props.search}
        </div>
        <div className="text-xs text-slate-400">
          Results: <span className="text-cyan-400 font-medium">{totalResults}</span>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
