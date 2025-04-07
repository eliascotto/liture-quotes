import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Book, Quote, QuoteWithTags, QuoteWithTagsRedux } from '@customTypes/index';
import Logger from '@utils/logger';

interface QuoteStore {
  // Properties
  quotes: QuoteWithTags[];
  quotesByTag: QuoteWithTagsRedux[];
  starredQuotes: QuoteWithTagsRedux[];
  selectedQuote: QuoteWithTags | Quote | null;
  selectedBook: Book | null;

  sortBy: string;
  sortOrder: "ASC" | "DESC";
  sortByStarred: string;
  sortOrderStarred: "ASC" | "DESC";
  sortByTag: string;
  sortOrderTag: "ASC" | "DESC";

  // Setters
  setSelectedQuote: (quote: QuoteWithTags | null) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: "ASC" | "DESC") => void;
  setSortByStarred: (sortBy: string) => void;
  setSortOrderStarred: (sortOrder: "ASC" | "DESC") => void;
  setSortByTag: (sortBy: string) => void;
  setSortOrderTag: (sortOrder: "ASC" | "DESC") => void;
  setSelectedBook: (book: Book | null) => void;

  // Actions
  fetchQuotes: () => Promise<void>;
  fetchStarredQuotes: () => Promise<void>;
  fetchQuotesByTag: (tagId: string) => Promise<void>;
  addQuote: (content: string) => Promise<void>;
  updateQuote: (quote: Quote | QuoteWithTags | QuoteWithTagsRedux) => Promise<void>;
  deleteQuote: (quote: Quote | QuoteWithTags | QuoteWithTagsRedux) => Promise<void>;
}

const logger = Logger.getInstance();

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  quotes: [],
  quotesByTag: [],
  starredQuotes: [],
  selectedQuote: null,
  sortBy: 'date_modified',
  sortOrder: 'DESC',
  sortByStarred: 'date_modified',
  sortOrderStarred: 'DESC',
  sortByTag: 'date_modified',
  sortOrderTag: 'DESC',
  selectedBook: null,

  setSelectedQuote: (quote: QuoteWithTags | null) => {
    set({ selectedQuote: quote });
  },

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

  setSortByTag: (sortBy: string) => {
    set({ sortByTag: sortBy });
  },

  setSortOrderTag: (sortOrder: "ASC" | "DESC") => {
    set({ sortOrderTag: sortOrder });
  },

  setSelectedBook: (book: Book | null) => {
    set({ selectedBook: book });

    if (book) {
      get().fetchQuotes();
    }
  },

  fetchQuotes: async () => {
    if (!get().selectedBook) return;
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
    set({ starredQuotes: starredQuotes as QuoteWithTagsRedux[] });
  },

  fetchQuotesByTag: async (tagId: string) => {
    const quotes = await invoke('get_quotes_by_tag', { 
      tagId, 
      sortBy: get().sortByTag,
      sortOrder: get().sortOrderTag 
    });
    set({ quotesByTag: quotes as QuoteWithTagsRedux[] });
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

  updateQuote: async (quote: Quote | QuoteWithTags | QuoteWithTagsRedux) => {
    try {
      await invoke('update_quote', { quote });
      get().fetchQuotes();
    } catch (error) {
      logger.error("Error updating quote:", error);
    }
  },

  deleteQuote: async (quote: Quote | QuoteWithTags | QuoteWithTagsRedux) => {
    try {
      await invoke('delete_quote', { quoteId: quote.id });
      get().fetchQuotes();
    } catch (error) {
      logger.error("Error deleting quote:", error);
    }
  },
}));
