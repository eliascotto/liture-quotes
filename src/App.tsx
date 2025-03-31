import { useState, useEffect, useCallback, useRef } from "react";
import clsx from 'clsx';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { platform } from '@tauri-apps/plugin-os';

import Navbar from "@components/layouts/Navbar.tsx";
import Header from "@components/layouts/Header.tsx";
import BookPage from "@pages/BookPage.tsx";
import AuthorPage from "@pages/AuthorPage.tsx";
import SearchPage from "@pages/SearchPage.tsx";
import FavouritesPage from "@pages/FavouritesPage.tsx";
import RandomQuoteBox from "@components/RandomQuoteBox.tsx";
import { useToast } from "@context/ToastContext.tsx";

import { useWindowState } from "@hooks/useWindowState.js";
import Logger from "@utils/logger";
import { errorToString } from "@utils/index";
import { NewBookData, Author, Book, BooksAuthors, Note, Quote, PageState, StarredQuote, SearchResults } from "@customTypes/index.ts";

const logger = Logger.getInstance();

function findAuthorById(authors: Author[], id: string) {
  return authors.filter(a => a.id === id)[0];
}

function App() {
  const currentPlatform = platform();
  const windowState = useWindowState();

  const { addToast } = useToast();

  // Fields from db
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [starredQuotes, setStarredQuotes] = useState<Quote[]>([]);

  // Navbar selection
  const [selectedOption, setSelectedOption] = useState("Books");
  const isBooksSelected = selectedOption === "Books";

  // Search
  const [search, setSearch] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    quotes: [],
    books: [],
    authors: []
  });

  // Current book
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookAuthor, setSelectedBookAuthor] = useState<Author | null>(null);

  // Current author
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState<Book[]>([]);

  // Current quote
  const [newlyCreatedQuoteId, setNewlyCreatedQuoteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("date_modified");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Current book's notes
  const [bookNotes, setBookNotes] = useState<Note[]>([]);

  // Navigation history
  const [history, setHistory] = useState<PageState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isNavigating = useRef(false);
  const initialLoadComplete = useRef(false);

  // Favourites page
  const [showingFavourites, setShowingFavourites] = useState(false);
  const [sortByFavouriteItems, setSortByFavouriteItems] = useState<string>("date_modified");
  const [sortOrderFavouriteItems, setSortOrderFavouriteItems] = useState<"ASC" | "DESC">("DESC");

  // Get current page state
  const getCurrentPageState = useCallback((): PageState | null => {
    if (showingFavourites) {
      return {
        type: 'starred',
        data: null
      };
    } else if (search) {
      return {
        type: 'search',
        data: { term: search, results: searchResults }
      };
    } else if (isBooksSelected && selectedBook) {
      return {
        type: 'book',
        data: selectedBook
      };
    } else if (!isBooksSelected && selectedAuthor) {
      return {
        type: 'author',
        data: selectedAuthor
      };
    }
    return null;
  }, [search, searchResults, isBooksSelected, selectedBook, selectedAuthor, showingFavourites]);

  // Apply a page state from history
  const applyPageState = useCallback((pageState: PageState) => {
    if (!pageState) return;

    isNavigating.current = true;

    switch (pageState.type) {
      case 'starred':
        setShowingFavourites(true);
        setSearch(null);
        break;
      case 'book':
        setShowingFavourites(false);
        setSelectedOption("Books");
        if (pageState.data && typeof pageState.data !== 'string') {
          setSelectedBook(pageState.data as Book);
        }
        setSearch(null);
        break;
      case 'author':
        setShowingFavourites(false);
        setSelectedOption("Authors");
        if (pageState.data && typeof pageState.data !== 'string') {
          setSelectedAuthor(pageState.data as Author);
        }
        setSearch(null);
        break;
      case 'search':
        setShowingFavourites(false);
        if (pageState.data && typeof pageState.data === 'object' && 'term' in pageState.data) {
          const searchData = pageState.data as { term: string, results: SearchResults };
          setSearch(searchData.term);
          setSearchResults(searchData.results);
        }
        break;
    }

    // Reset navigation flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isNavigating.current = false;
    }, 50);
  }, []);

  // Add current state to history when it changes
  const addToHistory = useCallback((pageState: PageState) => {
    if (!pageState || isNavigating.current || !initialLoadComplete.current) {
      return;
    }

    // Check if the new state is different from the current one in history
    const currentState = history[currentHistoryIndex];
    if (currentState && currentState.type === pageState.type) {
      // Type guard for each case
      switch (currentState.type) {
        case 'book':
          if (currentState.data && pageState.data &&
              typeof currentState.data !== 'string' && typeof pageState.data !== 'string' &&
              'id' in currentState.data && 'id' in pageState.data &&
              currentState.data.id === (pageState.data as Book).id) {
            return;
          }
          break;
        case 'author':
          if (currentState.data && pageState.data &&
              typeof currentState.data !== 'string' && typeof pageState.data !== 'string' &&
              'id' in currentState.data && 'id' in pageState.data &&
              currentState.data.id === (pageState.data as Author).id) {
            return;
          }
          break;
        case 'search':
          if (currentState.data && pageState.data &&
              typeof currentState.data === 'object' && typeof pageState.data === 'object' &&
              'term' in currentState.data && 'term' in pageState.data &&
              currentState.data.term === (pageState.data as { term: string }).term) {
            return;
          }
          break;
        case 'starred':
          return; // For starred pages, just check the type which we already did
      }
    }

    // Update both history and currentHistoryIndex atomically
    const newHistory = currentHistoryIndex >= 0
      ? history.slice(0, currentHistoryIndex + 1)
      : history;

    const updatedHistory = [...newHistory, pageState];
    setHistory(updatedHistory);
    setCurrentHistoryIndex(updatedHistory.length - 1);
  }, [history, currentHistoryIndex]);

  // Navigation functions
  const canGoBack = currentHistoryIndex > 0;
  const canGoForward = history.length > 0 && currentHistoryIndex < history.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) return;

    const newIndex = currentHistoryIndex - 1;
    const prevState = history[newIndex];

    // Apply the previous state
    applyPageState(prevState);
    setCurrentHistoryIndex(newIndex);
  }, [canGoBack, currentHistoryIndex, history, applyPageState]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;

    const newIndex = currentHistoryIndex + 1;
    const nextState = history[newIndex];

    // Apply the next state
    applyPageState(nextState);
    setCurrentHistoryIndex(newIndex);
  }, [canGoForward, currentHistoryIndex, history, applyPageState]);

  async function fetchBooksAndAuthors() {
    const data: BooksAuthors = await invoke("fetch_books_authors");
    setBooks(data.books);
    setAuthors(data.authors);
    initialLoadComplete.current = true;
  }

  async function fetchQuotes() {
    if (!selectedBook) return;
    const data = await invoke("fetch_all_quotes", {
      bookId: selectedBook.id,
      sortBy,
      sortOrder
    });
    setQuotes(data as Quote[]);
  }

  async function fetchBooksByAuthor() {
    if (!selectedAuthor) return;
    const books = await invoke("fetch_books_by_author", { authorId: selectedAuthor.id });
    setSelectedAuthorBooks(books as Book[]);
  }

  async function fetchStarredQuotes(sortBy?: string, sortOrder?: string) {
    try {
      const notes = await invoke("get_starred_quotes", {
        sortBy: sortBy || sortByFavouriteItems,
        sortOrder: sortOrder || sortOrderFavouriteItems
      });
      setStarredQuotes(notes as Quote[]);
    } catch (error) {
      console.error("Error fetching starred quotes:", error);
    }
  }

  async function fetchBookNotes(bookId: string) {
    const notes = await invoke("fetch_book_notes", { bookId });
    setBookNotes(notes as Note[]);
  }

  async function addAuthor(authorName: string) {
    try {
      const newAuthor = await invoke("create_author", { name: authorName });
      await fetchBooksAndAuthors();
      setSelectedOption("Authors");
      setSelectedAuthor(newAuthor as Author);
      return true;
    } catch (error: unknown) {
      console.error("Error creating author:", error);
      alert(`Error creating author: ${errorToString(error)}`);
      return false;
    }
  }

  async function addBook(title: string, authorId: string) {
    try {
      console.log("Adding book:", title, authorId);
      const newBook = await invoke("create_book", { title, authorId });
      await fetchBooksAndAuthors();
      setSelectedOption("Books");
      setSelectedBook(newBook as Book);
      return true;
    } catch (error) {
      console.error("Error creating book:", error);
      alert(`Error creating book: ${errorToString(error)}`);
      return false;
    }
  }

  async function onAddButtonClick(type: string, data: NewBookData) {
    const { title, authorOption, authorId, newAuthorName } = data;

    if (type === "author" && newAuthorName) {
      return await addAuthor(newAuthorName);
    }

    if (type === "book") {

      if (authorOption === 'existing' && authorId) {
        // Use existing author
        return await addBook(title, authorId);
      }

      // Create new author first, then create book
      try {
        const newAuthor: Author = await invoke("create_author", { name: newAuthorName });
        return await addBook(title, newAuthor.id);
      } catch (error) {
        console.error("Error creating author for book:", error);
        return false;
      }
    }

    return false;
  }

  async function updateQuote(quote: Quote) {
    console.log("Updating quote:", quote);
    try {
      await invoke("update_quote", { quote: quote });
      await fetchQuotes();
      await fetchStarredQuotes();
    } catch {
      console.error("Error updating quote");
    }
  }

  async function updateNote(noteId: string, content: string) {
    console.log("Updating note:", noteId, content);
    try {
      await invoke("update_note", { noteId, content });
      if (selectedBook) {
        await fetchBookNotes(selectedBook.id);
      }
    } catch {
      console.error("Error updating note");
    }
  }

  async function toggleFavouriteQuote(quote: StarredQuote | Quote) {
    console.log("Toggling favourite quote:", quote.id);
    try {
      await invoke("toggle_quote_starred", { quoteId: quote.id });
      await fetchQuotes();
      await fetchStarredQuotes();
    } catch {
      console.error("Error updating quote");
    }
  }

  async function deleteQuote(quote: Quote) {
    try {
      await invoke("delete_quote", { quoteId: quote.id });
      await fetchQuotes();
    } catch {
      console.error("Error removing quote");
    }
  }

  async function createNewQuote(bookId: string, content = "New quote") {
    try {
      let newQuote: Quote = await invoke("create_quote", {
        bookId,
        content,
      });
      setNewlyCreatedQuoteId(newQuote.id);
      await fetchQuotes();
    } catch (error) {
      console.error("Error adding quote:", error);
      alert(`Error adding quote: ${errorToString(error)}`);
    }
  }

  function onAuthorBookSelect(book: Book) {
    setSelectedOption("Books");
    setSelectedBook(book);
  }

  function onSearchExit() {
    setSearch(null);
    setSearchResults({
      quotes: [],
      books: [],
      authors: []
    });
  }

  function clearNavigation() {
    setShowingFavourites(false);
    setNewlyCreatedQuoteId(null);
  }

  function onNavbarSelection(item: Book | Author) {
    clearNavigation();
    if (isBooksSelected) {
      setSelectedBook(item as Book);
    } else {
      setSelectedAuthor(item as Author);
    }
  }

  function onFavouritesButtonClick() {
    setShowingFavourites(!showingFavourites);
    setNewlyCreatedQuoteId(null);
  }

  function navigateToBook(bookId: string) {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setSelectedOption("Books");
      setSelectedBook(book);
      setSearch(null); // Exit search mode
    }
  }

  function navigateToAuthor(authorId: string) {
    const author = authors.find(a => a.id === authorId);
    if (author) {
      setSelectedOption("Authors");
      setSelectedAuthor(author);
      setSearch(null); // Exit search mode
    }
  }

  // Function to delete a book
  const deleteBook = async (bookId: string) => {
    try {
      await invoke('set_book_deleted', { bookId });

      // Refresh all data to ensure both books and authors lists are updated
      await fetchBooksAndAuthors();

      // If we're on the book page that was deleted, navigate back to the books list
      if (selectedBook && selectedBook.id === bookId) {
        setSelectedBook(null);
      }

      // Clean up history by removing entries for the deleted book
      setHistory(prevHistory => {
        return prevHistory.filter(entry => {
          // Keep entries that aren't related to the deleted book
          if (entry.type === 'book' && entry.data && typeof entry.data !== 'string' && 'id' in entry.data) {
            return entry.data.id !== bookId; // Remove book entries
          }
          return true;
        });
      });

      // If we removed the current history entry, reset the index
      if (history[currentHistoryIndex] &&
          history[currentHistoryIndex].type === 'book' &&
          history[currentHistoryIndex].data &&
          typeof history[currentHistoryIndex].data !== 'string' &&
          'id' in history[currentHistoryIndex].data &&
          history[currentHistoryIndex].data.id === bookId) {
        // Navigate to the first valid entry in history or reset if none
        const newHistory = history.filter(entry => {
          if (entry.type === 'book' && entry.data && typeof entry.data !== 'string' && 'id' in entry.data) {
            return entry.data.id !== bookId;
          }
          return true;
        });

        if (newHistory.length > 0) {
          // Navigate to the first author or book in the list
          if (books.length > 0) {
            setSelectedOption("Books");
            setSelectedBook(books[0]);
          } else if (authors.length > 0) {
            setSelectedOption("Authors");
            setSelectedAuthor(authors[0]);
          }
          setCurrentHistoryIndex(0);
        } else {
          setCurrentHistoryIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  // Function to delete an author
  const deleteAuthor = async (authorId: string) => {
    try {
      await invoke('set_author_deleted', { authorId });

      // Refresh all data to ensure both authors and books lists are updated
      await fetchBooksAndAuthors();

      // If we're on the author page that was deleted, navigate back to the authors list
      if (selectedAuthor && selectedAuthor.id === authorId) {
        setSelectedAuthor(null);
      }

      // If we're on a book page whose author was deleted, navigate back to the books list
      if (selectedBook && selectedBook.author_id === authorId) {
        setSelectedBook(null);
      }

      // Clean up history by removing entries for the deleted author and its books
      setHistory(prevHistory => {
        return prevHistory.filter(entry => {
          // Keep entries that aren't related to the deleted author or its books
          if (entry.type === 'author' && entry.data && typeof entry.data !== 'string' && 'id' in entry.data) {
            return entry.data.id !== authorId; // Remove author entries
          }
          if (entry.type === 'book' && entry.data && typeof entry.data !== 'string' && 'author_id' in entry.data) {
            return entry.data.author_id !== authorId; // Remove book entries for this author
          }
          return true;
        });
      });

      // If we removed the current history entry, reset the index
      if (history[currentHistoryIndex] &&
          ((history[currentHistoryIndex].type === 'author' &&
            history[currentHistoryIndex].data &&
            typeof history[currentHistoryIndex].data !== 'string' &&
            'id' in history[currentHistoryIndex].data &&
            history[currentHistoryIndex].data.id === authorId) ||
           (history[currentHistoryIndex].type === 'book' &&
            history[currentHistoryIndex].data &&
            typeof history[currentHistoryIndex].data !== 'string' &&
            'author_id' in history[currentHistoryIndex].data &&
            history[currentHistoryIndex].data.author_id === authorId))) {
        // Navigate to the first valid entry in history or reset if none
        const newHistory = history.filter(entry => {
          if (entry.type === 'author' && entry.data && typeof entry.data !== 'string' && 'id' in entry.data) {
            return entry.data.id !== authorId;
          }
          if (entry.type === 'book' && entry.data && typeof entry.data !== 'string' && 'author_id' in entry.data) {
            return entry.data.author_id !== authorId;
          }
          return true;
        });

        if (newHistory.length > 0) {
          // Navigate to the first author or book in the list
          if (authors.length > 0) {
            setSelectedOption("Authors");
            setSelectedAuthor(authors[0]);
          } else if (books.length > 0) {
            setSelectedOption("Books");
            setSelectedBook(books[0]);
          }
          setCurrentHistoryIndex(0);
        } else {
          setCurrentHistoryIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error deleting author:', error);
    }
  };

  async function updateBook(book: Book) {
    try {
      await invoke("update_book", { book });
      await fetchBooksAndAuthors();
      setSelectedBook(book);
    } catch (error) {
      console.error("Error updating book:", error);
    }
  }

  function handleAppReload() {
    console.log("Reloading app");
    setSelectedBook(null);
    setSelectedAuthor(null);
    fetchBooksAndAuthors();
    fetchStarredQuotes();
  }

  // App startup loading
  useEffect(() => {
    fetchBooksAndAuthors();
    fetchStarredQuotes();
  }, []);

  useEffect(() => {
    // Setup import listeners - has to return for cleanup
    const importListener = listen("importing", (event: { payload: { device: string } }) => {
      addToast(`Importing data from ${event.payload.device}...`);
    });

    const importSuccessListener = listen("import-success", (event: { payload: { message: string } }) => {
      addToast(event.payload.message, "success");
      fetchBooksAndAuthors();
      fetchStarredQuotes();
    });

    const importErrorListener = listen("import-error", (event: { payload: { error: string } }) => {
      addToast(event.payload.error, "error");
    });

    return () => {
      importListener.then((unlisten) => unlisten());
      importSuccessListener.then((unlisten) => unlisten());
      importErrorListener.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (showingFavourites) {
      fetchStarredQuotes();
    }
  }, [showingFavourites]);

  // Fetch book quote, notes when book changes
  useEffect(() => {
    if (selectedBook) {
      fetchQuotes();
      fetchBookNotes(selectedBook.id);
      if (selectedBook.author_id) {
        setSelectedBookAuthor(findAuthorById(authors, selectedBook.author_id));
      }
    }
  }, [selectedBook, authors]);

  // Fetch author books when author changes
  useEffect(() => {
    if (selectedAuthor) {
      fetchBooksByAuthor();
    }
  }, [selectedAuthor]);

  // Track page state changes for history
  useEffect(() => {
    const currentPageState = getCurrentPageState();
    if (currentPageState) {
      addToHistory(currentPageState);
    }
  }, [getCurrentPageState, addToHistory]);

  let currentPage;
  if (showingFavourites) {
    currentPage = (
      <FavouritesPage
        quotes={starredQuotes}
        sortByItems={sortByFavouriteItems}
        setSortByItems={setSortByFavouriteItems}
        sortOrderItems={sortOrderFavouriteItems}
        setSortOrderItems={setSortOrderFavouriteItems}
        updateQuote={updateQuote}
        onStarClick={toggleFavouriteQuote}
        reloadFavourites={fetchStarredQuotes}
        removeQuote={deleteQuote}
        navigateToBook={(bookId) => {
          clearNavigation();
          const book = books.find(b => b.id === bookId);
          if (book) {
            setShowingFavourites(false);
            setSelectedOption("Books");
            setSelectedBook(book);
          }
        }}
      />
    );
  } else if (search) {
    currentPage = (
      <SearchPage
        search={search}
        books={books}
        authors={authors}
        searchResults={searchResults}
        updateQuote={updateQuote}
        starQuote={toggleFavouriteQuote}
        removeQuote={deleteQuote}
        navigateToBook={navigateToBook}
        navigateToAuthor={navigateToAuthor}
      />
    )
  } else if (isBooksSelected && selectedBook) {
    currentPage = (
      <BookPage
        book={selectedBook}
        author={selectedBookAuthor}
        quotes={quotes}
        notes={bookNotes}
        navigateToAuthor={navigateToAuthor}
        createNewQuote={createNewQuote}
        updateQuote={updateQuote}
        deleteQuote={deleteQuote}
        updateNote={updateNote}
        toggleFavouriteQuote={toggleFavouriteQuote}
        onDeleteBook={deleteBook}
        updateBook={updateBook}
        sortBy={sortBy}
        sortOrder={sortOrder}
        setSortBy={setSortBy}
        setSortOrder={setSortOrder}
      />
    )
  } else if (!isBooksSelected && selectedAuthor) {
    currentPage = (
      <AuthorPage
        author={selectedAuthor}
        books={selectedAuthorBooks}
        onBookSelect={onAuthorBookSelect}
        onDeleteAuthor={deleteAuthor}
      />
    )
  } else {
    // Display a random quote when nothing is selected
    currentPage = (
      <RandomQuoteBox
        navigateToBook={navigateToBook}
        navigateToAuthor={navigateToAuthor}
      />
    );
  }

  return (
    <div
      className={clsx(
        "bg-transparent flex flex-col m-0 items-center justify-center",
        "max-h-screen h-screen font-sans text-slate-100 rounded-lg overflow-hidden",
        currentPlatform === "macos" && [
          "has-blur-effects",
          !windowState.isFullScreen &&
          "frame rounded-[10px] border border-transparent"
        ]
      )}
    >
      <div className="flex flex-row w-full h-full overflow-hidden">
        {/* Sidebar - Full height */}
        <Navbar
          items={isBooksSelected ? books : authors}
          itemType={isBooksSelected ? "book" : "author"}
          property={isBooksSelected ? "title" : "name"}
          onSelection={onNavbarSelection}
          selected={isBooksSelected ? selectedBook : selectedAuthor}
          onCategoryChange={(category) => setSelectedOption(category)}
        />

        {/* Main content area with header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header only for the right part */}
          <Header
            showingStarred={showingFavourites}
            isBooksSelected={isBooksSelected}
            selectedAuthor={selectedAuthor}
            setShowingStarred={onFavouritesButtonClick}
            onAddButtonClick={onAddButtonClick}
            authors={authors}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            goBack={goBack}
            goForward={goForward}
            onSearchExit={onSearchExit}
            setSearch={setSearch}
            setSearchResults={setSearchResults}
            onReloadButtonClick={handleAppReload}
          />

          {/* Content area */}
          <div className="flex-1 overflow-hidden bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-sm">
            {currentPage}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
