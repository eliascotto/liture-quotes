export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isArchived: boolean;
  isPinned: boolean;
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

export interface SortOption {
  field: 'title' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export type ViewMode = 'grid' | 'list';

export interface AppState {
  notes: Note[];
  tags: Tag[];
  currentUser: User | null;
  filters: NoteFilter;
  sortOption: SortOption;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: number;
  autoSave: boolean;
  defaultViewMode: ViewMode;
} 
