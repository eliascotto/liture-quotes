import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import Logger from '@utils/logger';

const logger = Logger.getInstance();

const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

interface SecondarySidebarStore {
  // Properties
  isOpen: boolean;
  width: number;
  lastWidth: number;
  isResizing: boolean;
  isScrolled: boolean;
  isEmpty: boolean;
  fullyExpanded: boolean;
  // Constants
  DEFAULT_WIDTH: number;
  MIN_WIDTH: number;
  MAX_WIDTH: number;
  // Setters
  setIsOpen: (isOpen: boolean) => void;
  setWidth: (width: number) => void;
  setLastWidth: (lastWidth: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  setIsScrolled: (isScrolled: boolean) => void;
  setIsEmpty: (isEmpty: boolean) => void;
  setFullyExpanded: (fullyExpanded: boolean) => void;
}

export const useSecondarySidebarStore = create<SecondarySidebarStore>((set) => ({
  isOpen: true,
  width: DEFAULT_WIDTH,
  lastWidth: DEFAULT_WIDTH,
  isResizing: false,
  isScrolled: false,
  isEmpty: false,
  fullyExpanded: true,

  DEFAULT_WIDTH: DEFAULT_WIDTH,
  MIN_WIDTH: MIN_WIDTH,
  MAX_WIDTH: MAX_WIDTH,

  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setWidth: (width: number) => set({ width }),
  setLastWidth: (lastWidth: number) => set({ lastWidth }),
  setIsResizing: (isResizing: boolean) => set({ isResizing }),
  setIsScrolled: (isScrolled: boolean) => set({ isScrolled }),
  setIsEmpty: (isEmpty: boolean) => set({ isEmpty }),
  setFullyExpanded: (fullyExpanded: boolean) => set({ fullyExpanded }),
})); 
