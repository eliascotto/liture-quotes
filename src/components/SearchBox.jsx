import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import SearchIcon from "./icons/Search"
import XMarkIcon from "./icons/XMark"
import clsx from "clsx"

function SearchBox(props) {
  const [search, setSearch] = useState("")
  const [searchTimeout, setSearchTimeout] = useState(null)

  // Handle search changes with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (search === "") {
      props.onExit();
      return;
    }

    // Debounce search to avoid too many requests
    const timeout = setTimeout(async () => {
      try {
        // Search notes
        const quotesResults = await invoke("search_quotes", { search });
        
        // Search books by title
        const booksResults = await invoke("search_books_by_title", { search });
        
        // Search authors by name
        const authorsResults = await invoke("search_authors_by_name", { search });
        
        // Combine all results
        props.onSearch(search, {
          quotes: quotesResults,
          books: booksResults,
          authors: authorsResults
        });
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);

    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [search]);

  return (
    <form
      className="flex flex-row items-center relative"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <div className="absolute left-3 text-slate-400">
        <SearchIcon />
      </div>
      <input
        className={clsx(
          "bg-slate-800/70 border border-slate-700/50 text-slate-200 py-1.5 rounded-md",
          "pl-10 pr-8 text-sm w-64 focus:outline-none",
          "focus:ring-1 focus:ring-cyan-400/70 focus:border-cyan-400/70",
          "transition-all duration-200 placeholder:text-slate-500 select-none"
        )}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder="Search..."
      />
      {search && (
        <button
          type="button"
          className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-700/50 cursor-pointer transition-colors duration-200"
          onClick={() => setSearch("")}
          aria-label="Clear search"
        >
          <XMarkIcon />
        </button>
      )}
      <button type="submit" className="hidden"></button>
    </form>
  )
}

export default SearchBox
