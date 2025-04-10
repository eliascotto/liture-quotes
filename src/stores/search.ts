import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Book, Author, QuoteFts, SearchResults } from '@customTypes/index';
import Logger from '@utils/logger';

const logger = Logger.getInstance();

interface SearchStore {
  // Properties
  results: SearchResults | null;
  search: string | null;

  // Setters
  setResults: (results: SearchResults | null) => void;
  setSearch: (search: string | null) => void;

  // Actions
  searchBy: () => Promise<void>;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  results: null,
  search: null,

  setResults: (results: SearchResults | null) => set({ results }),
  setSearch: (search: string | null) => set({ search }),

  searchBy: async () => {
    try {
      const search = get().search;

      if (!search) {
        return;
      }

      // Search notes
      const quotesResults: QuoteFts[] = await invoke("search_quotes", { search });

      // Search books by title
      const booksResults: Book[] = await invoke("search_books_by_title", { search });

      // Search authors by name
      const authorsResults: Author[] = await invoke("search_authors_by_name", { search });

      // Combine all results
      set({
        results: {
          quotes: quotesResults,
          books: booksResults,
          authors: authorsResults
        }
      });
    } catch (error) {
      logger.error("Search error:", error);
    }
  }
}));
