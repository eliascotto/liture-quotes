export interface Quote {
  id: string;
  content: string | null;
  book_id: string | null;
  book_title: string | null;
  author_id: string | null;
  author_name: string | null;
  starred: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  imported_at: string | null;
  chapter: string | null;
  chapter_progress: number | null;
  original_id: string | null;
}

export interface Book {
  id: string;
  author_id: string | null;
  title: string;
  publication_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  original_id: string | null;
}

export interface Author {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  original_id: string | null;
}

export interface StarredQuote {
  id: string;
  content: string | null;
  book_id: string | null;
  book_title: string | null;
  author_id: string | null;
  author_name: string | null;
  starred: number | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  book_id: string | null;
  author_id: string | null;
  quote_id: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface NoteFilter {
  searchTerm?: string;
  tags?: string[];
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface QuoteFts {
  id: string;
  content: string | null;
  chapter: string | null;
  chapter_progress: number | null;
  starred: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  imported_at: string | null;
  original_id: string | null;
  book_id: string | null;
  author_id: string | null;
  book_title: string | null;
  author_name: string | null;
}

export interface SortOption {
  field: 'title' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export type ViewMode = 'grid' | 'list';

// export interface AppState {
//   quotes: Quote[];
//   tags: Tag[];
//   currentUser: User | null;
//   filters: NoteFilter;
//   sortOption: SortOption;
//   viewMode: ViewMode;
//   isLoading: boolean;
//   error: string | null;
// }

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  autoSave: boolean;
  defaultViewMode: ViewMode;
} 
