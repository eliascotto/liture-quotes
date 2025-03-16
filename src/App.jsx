import { useState, useEffect, useCallback, useRef } from "react";
import clsx from 'clsx';
import { invoke } from "@tauri-apps/api/core";
import { platform } from '@tauri-apps/plugin-os';

import Navbar from "./components/Navbar";
import BookPage from "./components/BookPage";
import SearchBox from "./components/SearchBox";
import AuthorPage from "./components/AuthorPage";
import SearchPage from "./components/SearchPage";
import AddButton from "./components/AddButton";
import NavigationControls from "./components/NavigationControls";
import RandomQuote from "./components/RandomQuote";
import StarredButton from "./components/StarredButton";
import FavoritesPage from "./components/FavoritesPage";

import { useWindowState } from "./hooks/useWindowState";

function findAuthorById(authors, id) {
  return authors.filter(a => a.id === id)[0];
}

function App() {
  const currentPlatform = platform();
  const windowState = useWindowState();

  // Fields from db
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [notes, setNotes] = useState([]);
  const [starredNotes, setStarredNotes] = useState([]);

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

  // Showing starred notes
  const [showingStarred, setShowingStarred] = useState(false);

  // Get current page state
  const getCurrentPageState = useCallback(() => {
    if (showingStarred) {
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
  }, [search, searchResults, isBooksSelected, selectedBook, selectedAuthor, showingStarred]);

  // Apply a page state from history
  const applyPageState = useCallback((pageState) => {
    if (!pageState) return;

    isNavigating.current = true;

    switch (pageState.type) {
      case 'starred':
        setShowingStarred(true);
        setSearch(null);
        break;
      case 'book':
        setShowingStarred(false);
        setSelectedOption("Books");
        setSelectedBook(pageState.data);
        setSearch(null);
        break;
      case 'author':
        setShowingStarred(false);
        setSelectedOption("Authors");
        setSelectedAuthor(pageState.data);
        setSearch(null);
        break;
      case 'search':
        setShowingStarred(false);
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

  async function fetchStarredNotes() {
    try {
      const notes = await invoke("fetch_starred_notes");
      setStarredNotes(notes);
    } catch (error) {
      console.error("Error fetching starred notes:", error);
    }
  }

  async function addAuthor(authorName) {
    try {
      const newAuthor = await invoke("new_author", { name: authorName });
      await fetchAll();
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
      await fetchAll();
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
    } else if (type === "book") {
      const { title, authorOption, authorId, newAuthorName } = data;
      
      if (authorOption === 'existing') {
        // Use existing author
        return await addBook(title, parseInt(authorId));
      } else {
        // Create new author first, then create book
        try {
          const newAuthor = await invoke("new_author", { name: newAuthorName });
          return await addBook(title, newAuthor.id);
        } catch (error) {
          console.error("Error creating author for book:", error);
          alert(`Error creating author for book: ${error.message || 'Unknown error'}`);
          return false;
        }
      }
    }
    return false;
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
      await invoke("star_note", { noteId: note.id });
      await fetchBookNotes();
      await fetchStarredNotes(); // Refresh starred notes
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

  async function addNote(bookId) {
    try {
      await invoke("new_note", { 
        bookId: bookId, 
        content: "New note" 
      });
      await fetchBookNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      alert(`Error adding note: ${error.message || 'Unknown error'}`);
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

  // Function to delete a book
  const deleteBook = async (bookId) => {
    try {
      await invoke('set_book_deleted', { bookId });
      
      // Refresh all data to ensure both books and authors lists are updated
      await fetchAll();
      
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
      await fetchAll();
      
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

  // Initial data load
  useEffect(() => {
    fetchAll();
    fetchStarredNotes();
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
  if (showingStarred) {
    currentPage = (
      <FavoritesPage
        notes={starredNotes}
        updateNote={updateNote}
        starNote={starNote}
        removeNote={removeNote}
        navigateToBook={(bookId) => {
          const book = books.find(b => b.id === bookId);
          if (book) {
            setShowingStarred(false);
            setSelectedOption("Books");
            setSelectedBook(book);
          }
        }}
        navigateToAuthor={(authorId) => {
          const author = authors.find(a => a.id === authorId);
          if (author) {
            setShowingStarred(false);
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
  } else if (isBooksSelected && selectedBook) {
    currentPage = (
      <BookPage
        book={selectedBook}
        author={selectedBookAuthor}
        notes={notes}
        updateNote={updateNote}
        starNote={starNote}
        removeNote={removeNote}
        navigateToAuthor={navigateToAuthor}
        addNote={addNote}
        onDeleteBook={deleteBook}
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
            className="z-20 border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-sm min-h-12 
            flex flex-row py-2.5 px-4 w-full items-center justify-between gap-4 shadow-md"
            data-tauri-drag-region
          >
            <div className="flex flex-row items-center gap-4">
              <NavigationControls 
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={goForward}
              />
              <StarredButton
                onClick={() => setShowingStarred(!showingStarred)}
                isActive={showingStarred}
              />
              <AddButton
                selectedOption={selectedOption}
                onClick={(type, data) => onAddButtonClick(type, data)}
                authors={authors}
                selectedAuthor={!isBooksSelected ? selectedAuthor : null}
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
