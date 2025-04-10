import { useState, useEffect, useCallback, useRef, use } from "react";
import clsx from 'clsx';
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { platform } from '@tauri-apps/plugin-os';

import PrimarySidebar from "@components/PrimarySidebar";
import Header from "@components/layouts/Header";
import BookScreen from "@screens/BookScreen";
import AuthorScreen from "@screens/AuthorScreen";
import SearchScreen from "@screens/SearchScreen";
import FavouritesScreen from "@screens/FavouritesScreen";
import RandomQuoteBox from "@components/RandomQuoteBox";
import { useToast } from "@context/ToastContext";
import { useTagStore } from "@stores/tags";

import { useWindowState } from "@hooks/useWindowState";
import Logger from "@utils/logger";
import { errorToString } from "@utils/index";
import {
  NewBookData,
  Author,
  Book,
  BooksAuthors,
  Note,
  Quote,
  PageState,
  QuoteRedux,
  SearchResults,
  Chapter,
  Tag
} from "@customTypes/index.ts";
import { useQuoteStore, useAppStore } from "@stores/index";
import TagScreen from "@screens/TagScreen";
import TagsScreen from "@screens/TagsScreen";
import { useSearchStore } from "@stores/search";

const logger = Logger.getInstance();

function findAuthorById(authors: Author[], id: string) {
  return authors.filter(a => a.id === id)[0];
}

function App() {
  const currentPlatform = platform();
  const windowState = useWindowState();

  // App 
  const appStore = useAppStore();
  const searchStore = useSearchStore();

  const { addToast } = useToast();

  // Fields from db
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Quotes
  const quoteStore = useQuoteStore();

  // Current book
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookAuthor, setSelectedBookAuthor] = useState<Author | null>(null);

  const [bookNotes, setBookNotes] = useState<Note[]>([]);
  const [bookChapters, setBookChapters] = useState<Chapter[]>([]);

  // Current author
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState<Book[]>([]);

  // Navigation history
  const [history, setHistory] = useState<PageState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isNavigating = useRef(false);
  const initialLoadComplete = useRef(false);

  // Tags
  const tagStore = useTagStore();

  // Get current page state
  // TODO: move this management to the app store
  const getCurrentPageState = useCallback((): PageState | null => {
    if (appStore.currentScreen === 'favourites') {
      return {
        type: 'starred',
        data: null
      };
    } else if (appStore.currentScreen === 'tag') {
      return {
        type: 'tag',
        data: tagStore.selectedTag,
      };
    } else if (appStore.currentScreen === 'tags') {
      return {
        type: 'tags',
        data: null
      };
    } else if (searchStore.search && searchStore.results) {
      return {
        type: 'search',
        data: { term: searchStore.search, results: searchStore.results }
      };
    } else if (appStore.sidebarSelectedOption === 'books' && selectedBook) {
      return {
        type: 'book',
        data: selectedBook
      };
    } else if (appStore.sidebarSelectedOption === 'authors' && selectedAuthor) {
      return {
        type: 'author',
        data: selectedAuthor
      };
    }
    return null;
  }, [searchStore.search, searchStore.results, appStore.sidebarSelectedOption, selectedBook, selectedAuthor, appStore.currentScreen]);

  // Apply a page state from history
  const applyPageState = useCallback((pageState: PageState) => {
    if (!pageState) return;

    isNavigating.current = true;

    switch (pageState.type) {
      case 'starred':
        appStore.setCurrentScreen('favourites');
        searchStore.setSearch(null);
        break;
      case 'tag':
        appStore.setCurrentScreen('tag');
        tagStore.setSelectedTag(pageState.data as Tag);
        searchStore.setSearch(null);
        break;
      case 'tags':
        appStore.setCurrentScreen('tags');
        searchStore.setSearch(null);
        break;
      case 'book':
        appStore.setCurrentScreen(null);
        appStore.setSidebarSelectedOption("books");
        if (pageState.data && typeof pageState.data !== 'string') {
          setSelectedBook(pageState.data as Book);
          quoteStore.setSelectedBook(pageState.data as Book);
        }
        searchStore.setSearch(null);
        break;
      case 'author':
        appStore.setCurrentScreen(null);
        appStore.setSidebarSelectedOption("authors");
        if (pageState.data && typeof pageState.data !== 'string') {
          setSelectedAuthor(pageState.data as Author);
        }
        searchStore.setSearch(null);
        break;
      case 'search':
        appStore.setCurrentScreen(null);
        if (pageState.data && typeof pageState.data === 'object' && 'term' in pageState.data) {
          const searchData = pageState.data as { term: string, results: SearchResults };
          searchStore.setSearch(searchData.term);
          searchStore.setResults(searchData.results);
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
        case 'tag':
          return; // For tag pages, just check the type which we already did
        case 'tags':
          return; // For tags pages, just check the type which we already did
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
    const data: BooksAuthors = await invoke("get_books_with_authors");
    setBooks(data.books);
    setAuthors(data.authors);
    initialLoadComplete.current = true;
  }

  async function fetchBooksByAuthor() {
    if (!selectedAuthor) return;
    const books = await invoke("get_books_by_author", { authorId: selectedAuthor.id });
    setSelectedAuthorBooks(books as Book[]);
  }

  async function fetchBookNotes(bookId: string) {
    const notes = await invoke("get_book_notes", { bookId });
    setBookNotes(notes as Note[]);
  }

  async function fetchBookChapters() {
    if (!selectedBook) return;
    const chapters = await invoke("get_book_chapters", { bookId: selectedBook.id });
    setBookChapters(chapters as Chapter[]);
  }

  async function addAuthor(authorName: string, setSelected: boolean = true) {
    try {
      const newAuthor = await invoke("create_author", { name: authorName });

      if (setSelected) {
        await fetchBooksAndAuthors();
        appStore.setSidebarSelectedOption("authors");
        setSelectedAuthor(newAuthor as Author);
      }
      return newAuthor;
    } catch (error: unknown) {
      logger.error("Error creating author:", error);
      alert(`Error creating author: ${errorToString(error)}`);
      return null;
    }
  }

  async function addBook(title: string, authorId: string) {
    try {
      console.log("Adding book:", title, authorId);
      const newBook = await invoke("create_book", { title, authorId });
      await fetchBooksAndAuthors();
      appStore.setSidebarSelectedOption("books");
      setSelectedBook(newBook as Book);
      quoteStore.setSelectedBook(newBook as Book);
      return true;
    } catch (error) {
      console.error("Error creating book:", error);
      alert(`Error creating book: ${errorToString(error)}`);
      return false;
    }
  }

  async function addBookWithAuthor(title: string, authorName: string) {
    try {
      const newBook = await invoke("create_book_with_author", { title, authorName });
      await fetchBooksAndAuthors();
      appStore.setSidebarSelectedOption("books");
      setSelectedBook(newBook as Book);
      quoteStore.setSelectedBook(newBook as Book);
      return true;
    } catch (error) {
      logger.error("Error creating book with author:", error);
      alert(`Error creating book with author: ${errorToString(error)}`);
      return false;
    }
  }

  async function onAddButtonClick(type: string, data: NewBookData) {
    const { title, authorOption, authorId, authorName } = data;

    logger.debug("onAddButtonClick", type, data);
    if (type === "author" && authorName) {
      let newAuthor = await addAuthor(authorName);
      return !!newAuthor;
    }

    if (type === "book") {

      if (authorOption === 'existing' && authorId) {
        // Use existing author
        return await addBook(title, authorId);
      }

      if (authorOption === 'new' && authorName) {
        // Create new author first, then create book
        return await addBookWithAuthor(title, authorName);
      }
    }

    return false;
  }

  async function updateQuote(quote: Quote) {
    console.log("Updating quote:", quote);
    try {
      await invoke("update_quote", { quote: quote });
      quoteStore.fetchQuotes();
      quoteStore.fetchStarredQuotes();
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

  async function toggleFavouriteQuote(quote: QuoteRedux | Quote) {
    console.log("Toggling favourite quote:", quote.id);
    try {
      quoteStore.toggleFavouriteQuote(quote.id);
    } catch {
      console.error("Error updating quote");
    }
  }

  async function deleteQuote(quote: Quote) {
    try {
      await invoke("delete_quote", { quoteId: quote.id });
      quoteStore.fetchQuotes();
    } catch {
      console.error("Error removing quote");
    }
  }

  function onAuthorBookSelect(book: Book) {
    appStore.setSidebarSelectedOption("books");
    setSelectedBook(book);
    quoteStore.setSelectedBook(book);
  }

  function clearNavigation() {
    appStore.setCurrentScreen(null);
    setSelectedBook(null);
    quoteStore.setSelectedBook(null);
    setSelectedAuthor(null);
    searchStore.setSearch(null);
  }

  function onNavbarSelection(item: Book | Author) {
    clearNavigation();
    if (appStore.sidebarSelectedOption === 'books') {
      setSelectedBook(item as Book);
      quoteStore.setSelectedBook(item as Book);
    } else {
      setSelectedAuthor(item as Author);
    }
  }

  function onFavouritesButtonClick() {
    if (appStore.currentScreen === 'favourites') {
      appStore.setCurrentScreen(null);
    } else {
      appStore.setCurrentScreen('favourites');
    }
  }

  function navigateToBook(bookId: string) {
    const book = books.find(b => b.id === bookId);
    if (book) {
      appStore.setSidebarSelectedOption("books");
      setSelectedBook(book);
      quoteStore.setSelectedBook(book);
      searchStore.setSearch(null); // Exit search mode
    }
  }

  function navigateToAuthor(authorId: string) {
    const author = authors.find(a => a.id === authorId);
    if (author) {
      appStore.setSidebarSelectedOption("authors");
      setSelectedAuthor(author);
      searchStore.setSearch(null); // Exit search mode
    }
  }

  // Function to delete a book
  const deleteBook = async (bookId: string) => {
    try {
      await invoke('delete_book', { bookId });

      // Refresh all data to ensure both books and authors lists are updated
      await fetchBooksAndAuthors();

      // If we're on the book page that was deleted, navigate back to the books list
      if (selectedBook && selectedBook.id === bookId) {
        setSelectedBook(null);
        quoteStore.setSelectedBook(null);
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
            appStore.setSidebarSelectedOption("books");
            setSelectedBook(books[0]);
            quoteStore.setSelectedBook(books[0]);
          } else if (authors.length > 0) {
            appStore.setSidebarSelectedOption("authors");
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
      await invoke('delete_author', { authorId });

      // Refresh all data to ensure both authors and books lists are updated
      await fetchBooksAndAuthors();

      // If we're on the author page that was deleted, navigate back to the authors list
      if (selectedAuthor && selectedAuthor.id === authorId) {
        setSelectedAuthor(null);
      }

      // If we're on a book page whose author was deleted, navigate back to the books list
      if (selectedBook && selectedBook.author_id === authorId) {
        setSelectedBook(null);
        quoteStore.setSelectedBook(null);
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
            appStore.setSidebarSelectedOption("authors");
            setSelectedAuthor(authors[0]);
          } else if (books.length > 0) {
            appStore.setSidebarSelectedOption("books");
            setSelectedBook(books[0]);
            quoteStore.setSelectedBook(books[0]);
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
      quoteStore.setSelectedBook(book);
    } catch (error) {
      console.error("Error updating book:", error);
    }
  }

  function handleAppReload() {
    console.log("Reloading app");
    setSelectedBook(null);
    quoteStore.setSelectedBook(null);
    setSelectedAuthor(null);
    fetchBooksAndAuthors();
    quoteStore.fetchStarredQuotes();
  }

  // App startup loading
  useEffect(() => {
    fetchBooksAndAuthors();
    quoteStore.fetchStarredQuotes();
    tagStore.fetchTags();
  }, []);

  useEffect(() => {
    // Setup import listeners - has to return for cleanup
    const importListener = listen("importing", (event: { payload: { device: string } }) => {
      addToast(`Importing data from ${event.payload.device}...`);
    });

    const importSuccessListener = listen("import-success", (event: { payload: { message: string } }) => {
      addToast(event.payload.message, "success");
      fetchBooksAndAuthors();
      quoteStore.fetchStarredQuotes();
    });

    const importErrorListener = listen("import-error", (event: { payload: { message: string } }) => {
      addToast(event.payload.message, "error");
    });

    return () => {
      importListener.then((unlisten) => unlisten());
      importSuccessListener.then((unlisten) => unlisten());
      importErrorListener.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (selectedBook) {
      quoteStore.fetchQuotes();
      fetchBookNotes(selectedBook.id);
      fetchBookChapters();
    }
  }, [quoteStore.sortBy, quoteStore.sortOrder]);

  useEffect(() => {
    if (appStore.currentScreen === 'favourites') {
      quoteStore.fetchStarredQuotes();
    }
  }, [appStore.currentScreen]);

  // Fetch book quote, notes when book changes
  useEffect(() => {
    if (selectedBook) {
      quoteStore.fetchQuotes();
      fetchBookNotes(selectedBook.id);
      fetchBookChapters();

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

  let mainContent;
  if (appStore.currentScreen === 'favourites') {
    mainContent = (
      <FavouritesScreen
        navigateToBook={(bookId) => {
          clearNavigation();
          const book = books.find(b => b.id === bookId);
          if (book) {
            appStore.setCurrentScreen(null);
            appStore.setSidebarSelectedOption("books");
            setSelectedBook(book);
          }
        }}
      />
    );
  } else if (appStore.currentScreen === 'tags') {
    mainContent = (
      <TagsScreen />
    );
  } else if (appStore.currentScreen === 'tag') {
    mainContent = (
      <TagScreen
        navigateToBook={navigateToBook}
      />
    )
  } else if (searchStore.search && searchStore.results) {
    mainContent = (
      <SearchScreen
        books={books}
        authors={authors}
        updateQuote={updateQuote}
        starQuote={toggleFavouriteQuote}
        removeQuote={deleteQuote}
        navigateToBook={navigateToBook}
        navigateToAuthor={navigateToAuthor}
      />
    )
  } else if (appStore.sidebarSelectedOption === 'books' && selectedBook) {
    mainContent = (
      <BookScreen
        book={selectedBook}
        author={selectedBookAuthor as Author}
        chapters={bookChapters}
        notes={bookNotes}
        navigateToAuthor={navigateToAuthor}
        updateNote={updateNote}
        toggleFavouriteQuote={toggleFavouriteQuote}
        onDeleteBook={deleteBook}
        updateBook={updateBook}
      />
    )
  } else if (appStore.sidebarSelectedOption === 'authors' && selectedAuthor) {
    mainContent = (
      <AuthorScreen
        author={selectedAuthor}
        books={selectedAuthorBooks}
        onBookSelect={onAuthorBookSelect}
        onDeleteAuthor={deleteAuthor}
      />
    )
  } else {
    // Display a random quote when nothing is selected
    mainContent = (
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
          "border border-transparent"
        ]
      )}
    >
      <div className="flex flex-row w-full h-full overflow-hidden">
        {/* Sidebar - Full height */}
        <PrimarySidebar
          items={appStore.sidebarSelectedOption === 'books' ? books : authors}
          property={appStore.sidebarSelectedOption === 'books' ? "title" : "name"}
          onSelection={onNavbarSelection}
          selected={appStore.sidebarSelectedOption === 'books' ? selectedBook : selectedAuthor}
        />

        {/* Main content area with header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header only for the right part */}
          <Header
            showingStarred={appStore.currentScreen === 'favourites'}
            isBooksSelected={appStore.sidebarSelectedOption === 'books'}
            selectedAuthor={selectedAuthor}
            setShowingStarred={onFavouritesButtonClick}
            onAddButtonClick={onAddButtonClick}
            authors={authors}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            goBack={goBack}
            goForward={goForward}
            onReloadButtonClick={handleAppReload}
          />

          <div className="flex flex-row w-full h-full overflow-hidden">
            {/* Main content area */}
            <div
              className="flex-1 overflow-hidden backdrop-blur-sm"
              style={{ background: 'var(--main-background)' }}>
              <div className="flex-1 flex flex-col items-center w-full h-full">
                {mainContent}
              </div>

            </div>

            {/* Sidebar secondary */}
            {/* <SecondarySidebar
              items={appStore.currentView === 'books' ? books : authors}
              property={appStore.currentView === 'books' ? "title" : "name"}
              onSelection={onNavbarSelection}
              selected={appStore.currentView === 'books' ? selectedBook : selectedAuthor}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
