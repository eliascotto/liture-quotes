import { create } from 'zustand';

interface AppStore {
  // Properties
  isLoading: boolean;
  // TODO: remove null from this
  currentScreen: string | null; // What is currently being displayed in the main content area
  sidebarSelectedOption: string; // The view selected from the sidebar
  // Setters
  setIsLoading: (isLoading: boolean) => void;
  setCurrentScreen: (currentScreen: string | null) => void;
  setSidebarSelectedOption: (sidebarSelectedOption: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isLoading: false,
  sidebarSelectedOption: 'books',
  currentScreen: 'quotes',

  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setCurrentScreen: (currentScreen: string | null) => set({ currentScreen }),
  setSidebarSelectedOption: (sidebarSelectedOption: string) => set({ sidebarSelectedOption }),
}));
