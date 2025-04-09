import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import SearchIcon from "./icons/Search"
import XMarkIcon from "./icons/XMark"
import clsx from "clsx"

type SearchBoxProps = {
  onSearch: (search: string, results: any) => void,
  onExit: () => void
}

function SearchBox({ onSearch, onExit }: SearchBoxProps) {
  const [search, setSearch] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  // Handle search changes with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (search === "") {
      onExit();
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
        onSearch(search, {
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
      onSubmit={(e) => { e.preventDefault() }}
    >
      <div className="absolute left-3 text-sidebar-foreground">
        <SearchIcon />
      </div>
      <input
        className={clsx(
          "bg-sidebar border border-sidebar-border text-sidebar-foreground py-1.5 rounded-md",
          "pl-10 pr-8 text-sm w-64 focus:outline-none",
          "focus:ring-1 focus:ring-brand-primary/70 focus:border-brand-primary/70",
          "transition-all duration-200 placeholder:text-sidebar-item-empty select-none",
          isFocused && "w-72"
        )}
        value={search}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => setSearch(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        placeholder="Search..."
      />
      {search && (
        <button
          type="button"
          className="absolute right-2.5 text-sidebar-foreground hover:text-sidebar-item-hover p-1 rounded-full hover:bg-sidebar-icon-hover-background cursor-pointer transition-colors duration-200"
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
