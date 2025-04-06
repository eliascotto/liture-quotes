import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Book, Quote, QuoteWithTags, StarredQuoteWithTags } from '@customTypes/index';
import Logger from '@utils/logger';

interface QuoteStore {
  // Properties
  quotes: QuoteWithTags[];
  starredQuotes: StarredQuoteWithTags[];
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  sortByStarred: string;
  sortOrderStarred: "ASC" | "DESC";
  selectedBook: Book | null;
  // Setters
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: "ASC" | "DESC") => void;
  setSortByStarred: (sortBy: string) => void;
  setSortOrderStarred: (sortOrder: "ASC" | "DESC") => void;
  setSelectedBook: (book: Book | null) => void;
  // Actions
  fetchQuotes: () => Promise<void>;
  fetchStarredQuotes: () => Promise<void>;
  addQuote: (content: string) => Promise<void>;
  updateQuote: (quote: Quote | QuoteWithTags | StarredQuoteWithTags) => Promise<void>;
  deleteQuote: (quote: Quote | QuoteWithTags | StarredQuoteWithTags) => Promise<void>;
}

const logger = Logger.getInstance();

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  quotes: [],
  starredQuotes: [],
  sortBy: 'date_modified',
  sortOrder: 'DESC',
  sortByStarred: 'date_modified',
  sortOrderStarred: 'DESC',
  selectedBook: null,

  setSortBy: (sortBy: string) => {
    set({ sortBy });
  },

  setSortOrder: (sortOrder: "ASC" | "DESC") => {
    set({ sortOrder });
  },

  setSortByStarred: (sortBy: string) => {
    set({ sortByStarred: sortBy });
  },

  setSortOrderStarred: (sortOrder: "ASC" | "DESC") => {
    set({ sortOrderStarred: sortOrder });
  },

  setSelectedBook: (book: Book | null) => {
    set({ selectedBook: book });

    if (book) {
      get().fetchQuotes();
    }
  },

  fetchQuotes: async () => {
    const quotes = await invoke('get_book_quotes', {
      bookId: get().selectedBook?.id, 
      sortBy: get().sortBy, 
      sortOrder: get().sortOrder
    });
    set({ quotes: quotes as QuoteWithTags[] });
  },

  fetchStarredQuotes: async () => {
    const starredQuotes = await invoke('get_starred_quotes', {
      sortBy: get().sortByStarred,
      sortOrder: get().sortOrderStarred
    });
    set({ starredQuotes: starredQuotes as StarredQuoteWithTags[] });
  },

  addQuote: async (content: string) => {
    if (!get().selectedBook) return;
    try {
      await invoke('create_quote', { bookId: get().selectedBook?.id, content });
      get().fetchQuotes();
    } catch (error) {
      logger.error("Error adding quote:", error);
    }
  },

  updateQuote: async (quote: Quote | QuoteWithTags | StarredQuoteWithTags) => {
    try {
      await invoke('update_quote', { quote });
      get().fetchQuotes();  
    } catch (error) {
      logger.error("Error updating quote:", error);
    }
  },

  deleteQuote: async (quote: Quote | QuoteWithTags | StarredQuoteWithTags) => {
    try {
      await invoke('delete_quote', { quoteId: quote.id });
      get().fetchQuotes();
    } catch (error) {
      logger.error("Error deleting quote:", error);
    }
  },
}));
