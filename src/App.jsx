import { useState, useEffect, useCallback, useRef } from "react";
import clsx from 'clsx';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { platform } from '@tauri-apps/plugin-os';

import Navbar from "@components/layouts/Navbar.tsx";
import Header from "@components/layouts/Header.tsx";
import BookPage from "@components/pages/BookPage.tsx";
import AuthorPage from "@components/pages/AuthorPage.tsx";
import SearchPage from "@components/pages/SearchPage.tsx";
import FavouritesPage from "@components/pages/FavouritesPage.tsx";
import RandomQuote from "@components/RandomQuote";
import { useToast } from "./context/ToastContext.tsx";

import { useWindowState } from "./hooks/useWindowState";

function findAuthorById(authors, id) {
  return authors.filter(a => a.id === id)[0];
}

function App() {
  const currentPlatform = platform();
  const windowState = useWindowState();

  const { addToast } = useToast();

  // Current ENV
  const [isDebugEnv, setIsDebugEnv] = useState(false);

  // Fields from db
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [starredQuotes, setStarredQuotes] = useState([]);

  // Navbar selection
  const [selectedOption, setSelectedOption] = useState("Books");
  const isBooksSelected = selectedOption === "Books";

  // Search
  const [search, setSearch] = useState(null);
  const [searchResults, setSearchResults] = useState({
    quotes: [],
    books: [],
    authors: []
  });

  // Current book
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedBookAuthor, setSelectedBookAuthor] = useState(null);

  // Current author
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState([]);

  // Current quote
  const [newlyCreatedQuoteId, setNewlyCreatedQuoteId] = useState(null);
  const [sortBy, setSortBy] = useState("date_modified");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Current book's notes
  const [bookNotes, setBookNotes] = useState([]);

  // Navigation history
  const [history, setHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isNavigating = useRef(false);
  const initialLoadComplete = useRef(false);

  // Showing starred notes
  const [showingFavourites, setShowingFavourites] = useState(false);

  // Get current page state
  const getCurrentPageState = useCallback(() => {
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
  const applyPageState = useCallback((pageState) => {
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
        setSelectedBook(pageState.data);
        setSearch(null);
        break;
      case 'author':
        setShowingFavourites(false);
        setSelectedOption("Authors");
        setSelectedAuthor(pageState.data);
        setSearch(null);
        break;
      case 'search':
        setShowingFavourites(false);
        setSearch(pageState.data.term);
        setSearchResults(pageState.data.results);
        break;
      default:
        break;
    }

    // Reset navigation flag after a short delay to allow state updates to complete
    setTimeout(() => {
      isNavigating.current = false;
    }, 50);
  }, []);

  // Add current state to history when it changes
  const addToHistory = useCallback((pageState) => {
    if (!pageState || isNavigating.current || !initialLoadComplete.current) {
      return;
    }

    // Check if the new state is different from the current one in history
    const currentState = history[currentHistoryIndex];
    if (currentState &&
      currentState.type === pageState.type &&
      ((currentState.type === 'book' && currentState.data.id === pageState.data.id) ||
        (currentState.type === 'author' && currentState.data.id === pageState.data.id) ||
        (currentState.type === 'search' && currentState.data.term === pageState.data.term) ||
        (currentState.type === 'starred' && currentState.type === pageState.type))) {
      return; // Don't add duplicate entries
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
    const data = await invoke("fetch_books_authors");
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
    setQuotes(data);
  }

  async function fetchBooksByAuthor() {
    if (!selectedAuthor) return;
    const books = await invoke("fetch_books_by_author", { authorId: selectedAuthor.id });
    setSelectedAuthorBooks(books);
  }

  async function fetchStarredQuotes(sortBy, sortOrder) {
    try {
      const notes = await invoke("get_starred_quotes", { sortBy, sortOrder });
      setStarredQuotes(notes);
    } catch (error) {
      console.error("Error fetching starred quotes:", error);
    }
  }

  async function fetchBookNotes(bookId) {
    const notes = await invoke("fetch_book_notes", { bookId });
    setBookNotes(notes);
  }

  async function addAuthor(authorName) {
    try {
      const newAuthor = await invoke("create_author", { name: authorName });
      await fetchBooksAndAuthors();
      setSelectedOption("Authors");
      setSelectedAuthor(newAuthor);
      return true;
    } catch (error) {
      console.error("Error creating author:", error);
      alert(`Error creating author: ${error.message || 'Unknown error'}`);
      return false;
    }
  }

  async function addBook(title, authorId) {
    try {
      const newBook = await invoke("new_book", { title, authorId });
      await fetchBooksAndAuthors();
      setSelectedOption("Books");
      setSelectedBook(newBook);
      return true;
    } catch (error) {
      console.error("Error creating book:", error);
      alert(`Error creating book: ${error.message || 'Unknown error'}`);
      return false;
    }
  }

  async function onAddButtonClick(type, data) {
    if (type === "author") {
      return await addAuthor(data.name);
    }

    if (type === "book") {
      const { title, authorOption, authorId, newAuthorName } = data;

      if (authorOption === 'existing') {
        // Use existing author
        return await addBook(title, parseInt(authorId));
      }

      // Create new author first, then create book
      try {
        const newAuthor = await invoke("create_author", { name: newAuthorName });
        return await addBook(title, newAuthor.id);
      } catch (error) {
        console.error("Error creating author for book:", error);
        return false;
      }
    }

    return false;
  }

  async function updateQuote(quote) {
    console.log("Updating quote:", quote);
    try {
      await invoke("update_quote", { quote: quote });
      await fetchQuotes();
    } catch {
      console.error("Error updating quote");
    }
  }

  async function updateNote(noteId, content) {
    console.log("Updating note:", noteId, content);
    try {
      await invoke("update_note", { noteId, content });
      await fetchBookNotes(selectedBook.id);
    } catch {
      console.error("Error updating note");
    }
  }

  async function toggleFavouriteQuote(quote) {
    console.log("Toggling favourite quote:", quote.id);
    try {
      await invoke("toggle_quote_starred", { quoteId: quote.id });
      await fetchQuotes();
      await fetchStarredQuotes();
    } catch {
      console.error("Error updating quote");
    }
  }

  async function deleteQuote(quote) {
    try {
      await invoke("delete_quote", { quoteId: quote.id });
      await fetchQuotes();
    } catch {
      console.error("Error removing quote");
    }
  }

  async function createNewQuote(bookId, content = "New quote") {
    try {
      let newQuote = await invoke("create_quote", {
        bookId,
        content,
      });
      setNewlyCreatedQuoteId(newQuote.id);
      await fetchQuotes();
    } catch (error) {
      console.error("Error adding quote:", error);
      alert(`Error adding quote: ${error.message || 'Unknown error'}`);
    }
  }

  async function getEnv(name) {
    const env = await invoke("get_env", { name });
    return env;
  }

  function onAuthorBookSelect(book) {
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

  function onNavbarSelection(item) {
    clearNavigation();
    if (isBooksSelected) {
      setSelectedBook(item);
    } else {
      setSelectedAuthor(item);
    }
  }

  function onFavouritesButtonClick() {
    setShowingFavourites(!showingFavourites);
    setNewlyCreatedQuoteId(null);
  }

  function navigateToBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setSelectedOption("Books");
      setSelectedBook(book);
      setSearch(null); // Exit search mode
    }
  }

  function navigateToAuthor(authorId) {
    const author = authors.find(a => a.id === authorId);
    if (author) {
      setSelectedOption("Authors");
      setSelectedAuthor(author);
      setSearch(null); // Exit search mode
    }
  }

  // Function to delete a book
  const deleteBook = async (bookId) => {
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
          if (entry.type === 'book' && entry.data.id === bookId) {
            return false; // Remove book entries
          }
          return true;
        });
      });

      // If we removed the current history entry, reset the index
      if (history[currentHistoryIndex] &&
        history[currentHistoryIndex].type === 'book' &&
        history[currentHistoryIndex].data.id === bookId) {
        // Navigate to the first valid entry in history or reset if none
        const newHistory = history.filter(entry => {
          if (entry.type === 'book' && entry.data.id === bookId) return false;
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
  const deleteAuthor = async (authorId) => {
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
          if (entry.type === 'author' && entry.data.id === authorId) {
            return false; // Remove author entries
          }
          if (entry.type === 'book' && entry.data.author_id === authorId) {
            return false; // Remove book entries for this author
          }
          return true;
        });
      });

      // If we removed the current history entry, reset the index
      if (history[currentHistoryIndex] &&
        ((history[currentHistoryIndex].type === 'author' && history[currentHistoryIndex].data.id === authorId) ||
          (history[currentHistoryIndex].type === 'book' && history[currentHistoryIndex].data.author_id === authorId))) {
        // Navigate to the first valid entry in history or reset if none
        const newHistory = history.filter(entry => {
          if (entry.type === 'author' && entry.data.id === authorId) return false;
          if (entry.type === 'book' && entry.data.author_id === authorId) return false;
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

  async function updateBook(book) {
    try {
      await invoke("update_book", { book });
      await fetchBooksAndAuthors();
      setSelectedBook(book);
    } catch (error) {
      console.error("Error updating book:", error);
    }
  }

  // Setup backend event listeners and return cleanup function
  const setupBackendListeners = () => {
    const importListener = listen("importing", (event) => {
      addToast(`Importing data from ${event.payload.device}...`);
    });

    const importSuccessListener = listen("import-success", (event) => {
      addToast(event.payload.message, "success");
      fetchBooksAndAuthors();
      fetchStarredQuotes();
    });

    const importErrorListener = listen("import-error", (event) => {
      addToast(event.payload.error, "error");
    });

    return () => {
      importListener.then((unlisten) => unlisten());
      importSuccessListener.then((unlisten) => unlisten());
      importErrorListener.then((unlisten) => unlisten());
    };
  };

  // App startup loading
  useEffect(async () => {
    fetchBooksAndAuthors();
    fetchStarredQuotes();

    // Debug mode configured via ENV variable
    const isDebug = await getEnv("TAURI_ENV_DEBUG");
    setIsDebugEnv(isDebug === "true");

    // Setup import listeners - has to return for cleanup
    return setupBackendListeners();
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [sortBy, sortOrder]);

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
      setSelectedBookAuthor(findAuthorById(authors, selectedBook.author_id));
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
        navigateToAuthor={(authorId) => {
          clearNavigation();
          const author = authors.find(a => a.id === authorId);
          if (author) {
            setShowingFavourites(false);
            setSelectedOption("Authors");
            setSelectedAuthor(author);
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
        newlyCreatedQuoteId={newlyCreatedQuoteId}
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
    currentPage = <RandomQuote />;
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
            setShowingStarred={onFavouritesButtonClick}
            selectedOption={selectedOption}
            onAddButtonClick={onAddButtonClick}
            authors={authors}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            goBack={goBack}
            goForward={goForward}
            onSearchExit={onSearchExit}
            setSearch={setSearch}
            setSearchResults={setSearchResults}
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
