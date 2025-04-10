import { useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import SearchIcon from "./icons/Search"
import XMarkIcon from "./icons/XMark"
import clsx from "clsx"
import { useSearchStore } from "@stores/search"


function SearchBox() {
  const searchStore = useSearchStore();
  
  const [isFocused, setIsFocused] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleClear = () => {
    searchStore.setSearch(null);
    searchStore.setResults(null);
  }

  // Handle search changes with debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (searchStore.search === "") {
      searchStore.setSearch(null);
      searchStore.setResults(null);
      return;
    }

    if (searchStore.search && searchStore.search.length < 3) {
      return;
    }

    // Debounce search to avoid too many requests
    const timeout = setTimeout(async () => {
      await searchStore.searchBy();
    }, 600); // 1 second debounce

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchStore.search]);

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
          "bg-search border border-search-border text-search-foreground py-1.5 rounded-md",
          "pl-10 pr-8 text-sm w-64 focus:outline-none",
          "focus:ring-1 focus:ring-brand-primary/70 focus:border-brand-primary/70",
          "transition-all duration-200 placeholder:text-sidebar-item-empty select-none",
          isFocused && "w-72"
        )}
        value={searchStore.search || ""}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => searchStore.setSearch(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        placeholder="Search..."
        autoComplete="off"
      />
      {searchStore.search && (
        <button
          type="button"
          className="absolute right-2.5 text-sidebar-foreground hover:text-sidebar-item-hover p-1 rounded-full hover:bg-sidebar-icon-hover-background cursor-pointer transition-colors duration-200"
          onClick={handleClear}
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
