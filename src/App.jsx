import { useState, useEffect, useCallback, useRef } from "react";
import clsx from 'clsx';
import { invoke } from "@tauri-apps/api/core";
import { platform } from '@tauri-apps/plugin-os';

import Navbar from "./components/Navbar";
import BookPage from "./components/BookPage";
import SearchBox from "./components/SearchBox";
import CategoryMenu from "./components/CategoryMenu";
import AuthorPage from "./components/AuthorPage";
import SearchPage from "./components/SearchPage";
import AddButton from "./components/AddButton";
import WindowFrame from "./components/WindowFrame";
import NavigationControls from "./components/NavigationControls";

import { useWindowState } from "./hooks/useWindowState";

function findAuthorById(authors, id) {
  return authors.filter(a => a.id === id)[0];
}

function findBooksByAuthorId(books, authorId) {
  return books.filter(a => a.author_id === authorId);
}

function App() {
  const currentPlatform = platform();
  const windowState = useWindowState();

  // Fields from db
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [notes, setNotes] = useState([]);

  // Navbar selection
  const [selectedOption, setSelectedOption] = useState("Books");
  const isBooksSelected = selectedOption === "Books";

  // Search
  const [search, setSearch] = useState(null);
  const [searchResults, setSearchResults] = useState({
    notes: [],
    books: [],
    authors: []
  });

  // Current book
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedBookAuthor, setSelectedBookAuthor] = useState(null);

  // Current author
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState([]);

  // Navigation history
  const [history, setHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isNavigating = useRef(false);
  const initialLoadComplete = useRef(false);

  // Get current page state
  const getCurrentPageState = useCallback(() => {
    if (search) {
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
  }, [search, searchResults, isBooksSelected, selectedBook, selectedAuthor]);

  // Apply a page state from history
  const applyPageState = useCallback((pageState) => {
    if (!pageState) return;

    isNavigating.current = true;

    switch (pageState.type) {
      case 'book':
        setSelectedOption("Books");
        setSelectedBook(pageState.data);
        setSearch(null);
        break;
      case 'author':
        setSelectedOption("Authors");
        setSelectedAuthor(pageState.data);
        setSearch(null);
        break;
      case 'search':
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
         (currentState.type === 'search' && currentState.data.term === pageState.data.term))) {
      return; // Don't add duplicate entries
    }

    setHistory(prevHistory => {
      // Remove any forward history if we're navigating from a point in history
      const newHistory = currentHistoryIndex >= 0 
        ? prevHistory.slice(0, currentHistoryIndex + 1) 
        : prevHistory;
      
      const updatedHistory = [...newHistory, pageState];
      
      // Update the current index to point to the new entry
      setTimeout(() => {
        setCurrentHistoryIndex(updatedHistory.length - 1);
      }, 0);
      
      return updatedHistory;
    });
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

  async function fetchAll() {
    const data = await invoke("fetch_all");
    setBooks(data.books);
    setAuthors(data.authors);
    initialLoadComplete.current = true;
  }

  async function fetchBookNotes() {
    if (!selectedBook) return;
    const data = await invoke("fetch_book_notes", { bookId: selectedBook.id });
    setNotes(data);
  }

  async function fetchBooksByAuthor() {
    if (!selectedAuthor) return;
    const books = await invoke("fetch_books_by_author", { authorId: selectedAuthor.id });
    setSelectedAuthorBooks(books);
  }

  async function addAuthor(authorName) {
    try {
      const newAuthor = await invoke("new_author", { name: authorName });
      await fetchAll();
      setSelectedAuthor(newAuthor);
    } catch {
      alert("Error creating author!");
    }
  }

  function onAddButtonClick() {
    if (selectedOption === "Authors") {
      const authorName = prompt("Insert new author name")
      if (authorName) {
        addAuthor(authorName);
      }
    }
  }

  async function updateNote(note) {
    try {
      await invoke("update_note", { note: note });
      await fetchBookNotes();
    } catch {
      console.error("Error updating note");
    }
  }

  async function starNote(note) {
    try {
      // Star or unstar a note
      await invoke("star_note", { noteId: note.id });
      await fetchBookNotes();
    } catch {
      console.error("Error updating note");
    }
  }

  async function removeNote(note) {
    try {
      await invoke("hide_note", { noteId: note.id });
      await fetchBookNotes();
    } catch {
      console.error("Error removing note");
    }
  }

  function onAuthorBookSelect(book) {
    setSelectedOption("Books");
    setSelectedBook(book);
  }

  function onSearchExit() {
    setSearch(null);
    setSearchResults({
      notes: [],
      books: [],
      authors: []
    });
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

  // Initial data load
  useEffect(() => {
    fetchAll();
  }, []);

  // Fetch book notes when book changes
  useEffect(() => {
    if (selectedBook) {
      fetchBookNotes();
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

  // Debug logging for history
  useEffect(() => {
    console.log('History:', history);
    console.log('Current index:', currentHistoryIndex);
  }, [history, currentHistoryIndex]);

  let currentPage;
  if (search) {
    currentPage = (
      <SearchPage
        search={search}
        searchResults={searchResults}
        updateNote={updateNote}
        starNote={starNote}
        removeNote={removeNote}
        navigateToBook={navigateToBook}
        navigateToAuthor={navigateToAuthor}
        books={books}
        authors={authors}
      />
    )
  } else if (isBooksSelected && notes.length > 0) {
    currentPage = (
      <BookPage
        book={selectedBook}
        author={selectedBookAuthor}
        notes={notes}
        updateNote={updateNote}
        starNote={starNote}
        removeNote={removeNote}
        navigateToAuthor={navigateToAuthor}
      />
    )
  } else if (!isBooksSelected && selectedAuthor) {
    currentPage = (
      <AuthorPage
        author={selectedAuthor}
        books={selectedAuthorBooks}
        onBookSelect={onAuthorBookSelect}
      />
    )
  }

  return (
    <div
      className={clsx(
        // App level styles
        "dark:bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col m-0 items-center justify-center",
        "max-h-screen h-screen font-sans text-slate-100 rounded-lg overflow-hidden",
        currentPlatform === "macos" && [
          "has-blur-effects",
          !windowState.isFullScreen &&
          "frame rounded-[10px] border border-transparent"
        ]
      )}
    >
      {/* <WindowFrame /> */}
      <div className="flex flex-row w-full h-full overflow-hidden">
        {/* Sidebar - Full height */}
        <Navbar
          list={isBooksSelected ? books : authors}
          property={isBooksSelected ? "title" : "name"}
          onSelection={isBooksSelected ?
            (book) => setSelectedBook(book) :
            (author) => setSelectedAuthor(author)}
          selected={isBooksSelected ? selectedBook : selectedAuthor}
          onCategoryChange={(category) => setSelectedOption(category)} 
        />
        
        {/* Main content area with header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header only for the right part */}
          <header 
            className="z-20 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm min-h-10 
            flex flex-row py-2 px-4 w-full items-center justify-between gap-4 shadow-md"
            data-tauri-drag-region  
          >
            <div className="flex flex-row items-center gap-4">
              <NavigationControls 
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={goForward}
              />
              <AddButton
                selectedOption={selectedOption}
                onClick={onAddButtonClick}
              />
            </div>
            <SearchBox 
              onSearch={(searchTerm, results) => {
                setSearch(searchTerm);
                setSearchResults(results);
              }} 
              onExit={onSearchExit} 
            />
          </header>
          
          {/* Content area */}
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm">
            {currentPage}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
