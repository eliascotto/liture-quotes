import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducer, useCallback, useRef } from 'react';
import { Book, Author } from '@customTypes/index.ts';

type PageState = {
  type: 'book' | 'author' | 'search' | 'starred';
  data: Book | Author | { term: string, results: any } | null;
};

type HistoryState = {
  history: PageState[];
  currentHistoryIndex: number;
};

type HistoryAction = 
  | { type: 'ADD_STATE'; payload: PageState }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'ADD_STATE': {
      // Check if the new state is different from the current one in history
      const currentState = state.history[state.currentHistoryIndex];
      if (currentState && currentState.type === action.payload.type) {
        switch (currentState.type) {
          case 'book':
            if (currentState.data && action.payload.data &&
              typeof currentState.data !== 'string' && typeof action.payload.data !== 'string' &&
              'id' in currentState.data && 'id' in action.payload.data &&
              currentState.data.id === (action.payload.data as Book).id) {
              return state;
            }
            break;
          case 'author':
            if (currentState.data && action.payload.data &&
              typeof currentState.data !== 'string' && typeof action.payload.data !== 'string' &&
              'id' in currentState.data && 'id' in action.payload.data &&
              currentState.data.id === (action.payload.data as Author).id) {
              return state;
            }
            break;
          case 'search':
            if (currentState.data && action.payload.data &&
              typeof currentState.data === 'object' && typeof action.payload.data === 'object' &&
              'term' in currentState.data && 'term' in action.payload.data &&
              currentState.data.term === (action.payload.data as { term: string }).term) {
              return state;
            }
            break;
          case 'starred':
            return state;
        }
      }

      // Truncate history at the current index and add the new state
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(action.payload);

      return {
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1
      };
    }
    case 'GO_BACK':
      if (state.currentHistoryIndex > 0) {
        return {
          ...state,
          currentHistoryIndex: state.currentHistoryIndex - 1
        };
      }
      return state;
    case 'GO_FORWARD':
      if (state.currentHistoryIndex < state.history.length - 1) {
        return {
          ...state,
          currentHistoryIndex: state.currentHistoryIndex + 1
        };
      }
      return state;
    default:
      return state;
  }
}

// Mock data
const mockBook: Book = {
  id: '1',
  title: 'Test Book',
  author_id: '1',
  publication_year: '2024',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  original_id: null
};

const mockAuthor: Author = {
  id: '1',
  name: 'Test Author',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  original_id: null
};

const mockSearchResults = {
  quotes: [],
  books: [],
  authors: []
};

function useHistory() {
  const [{ history, currentHistoryIndex }, dispatch] = useReducer(historyReducer, {
    history: [],
    currentHistoryIndex: -1
  });

  const isNavigating = useRef(false);
  const initialLoadComplete = useRef(false);

  const canGoBack = currentHistoryIndex > 0;
  const canGoForward = currentHistoryIndex < history.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    dispatch({ type: 'GO_BACK' });
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    dispatch({ type: 'GO_FORWARD' });
  }, [canGoForward]);

  const addToHistory = useCallback((pageState: PageState) => {
    if (!pageState || isNavigating.current || !initialLoadComplete.current) {
      return;
    }
    dispatch({ type: 'ADD_STATE', payload: pageState });
  }, []);

  return {
    history,
    currentHistoryIndex,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    addToHistory,
    isNavigating,
    initialLoadComplete
  };
}

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty history', () => {
    const { result } = renderHook(() => useHistory());
    
    expect(result.current.history).toEqual([]);
    expect(result.current.currentHistoryIndex).toBe(-1);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });

  it('adds book page to history', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
    });
    
    expect(result.current.history).toHaveLength(1);
    expect(result.current.currentHistoryIndex).toBe(0);
    expect(result.current.history[0]).toEqual({
      type: 'book',
      data: mockBook
    });
  });

  it('adds author page to history', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.addToHistory({
        type: 'author',
        data: mockAuthor
      });
    });
    
    expect(result.current.history).toHaveLength(1);
    expect(result.current.currentHistoryIndex).toBe(0);
    expect(result.current.history[0]).toEqual({
      type: 'author',
      data: mockAuthor
    });
  });

  it('adds search page to history', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.addToHistory({
        type: 'search',
        data: { term: 'test', results: mockSearchResults }
      });
    });
    
    expect(result.current.history).toHaveLength(1);
    expect(result.current.currentHistoryIndex).toBe(0);
  });

  it('does not add duplicate consecutive states', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
    });
    
    expect(result.current.history).toHaveLength(1);
  });

  it('allows navigation back and forward', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
      result.current.addToHistory({
        type: 'author',
        data: mockAuthor
      });
    });
    
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
    
    act(() => {
      result.current.goBack();
    });
    
    expect(result.current.currentHistoryIndex).toBe(0);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(true);
    
    act(() => {
      result.current.goForward();
    });
    
    expect(result.current.currentHistoryIndex).toBe(1);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it('truncates forward history when adding new state after going back', () => {
    const { result } = renderHook(() => useHistory());
    
    // Add first state
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
    });

    // Add second state
    act(() => {
      result.current.addToHistory({
        type: 'author',
        data: mockAuthor
      });
    });

    // Go back
    act(() => {
      result.current.goBack();
    });

    // Add new state after going back
    act(() => {
      result.current.addToHistory({
        type: 'search',
        data: { term: 'test', results: mockSearchResults }
      });
    });
    
    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[1].type).toBe('search');
    expect(result.current.canGoForward).toBe(false);
  });

  it('does not add to history when isNavigating is true', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.initialLoadComplete.current = true;
      result.current.isNavigating.current = true;
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
    });
    
    expect(result.current.history).toHaveLength(0);
  });

  it('does not add to history before initial load is complete', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory({
        type: 'book',
        data: mockBook
      });
    });
    
    expect(result.current.history).toHaveLength(0);
  });
}); 
