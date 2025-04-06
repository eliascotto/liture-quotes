import { Tag } from '@customTypes/index';
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import Logger from '@utils/logger';

const logger = Logger.getInstance();

const TAG_COLORS = [
  "#F44336", // Red
  "#FF9800", // Orange
  "#FFEB3B", // Yellow
  "#4CAF50", // Green
  "#009688", // Teal
  "#2196F3", // Blue
  "#3F51B5", // Indigo
  "#9C27B0", // Purple
  "#E91E63", // Pink
  "#795548", // Brown
  "#9E9E9E", // Gray
  "#212121", // Black (Accent)
]

interface TagStore {
  tags: Tag[];
  tagColors: string[];
  fetchTags: () => Promise<void>;
  addTag: (tagName: string) => Promise<Tag>;
  addTagToQuote: (quoteId: string, tagId: string) => Promise<void>;
  deleteTagFromQuote: (quoteId: string, tagId: string) => Promise<void>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  tagColors: TAG_COLORS,

  fetchTags: async () => {
    const tags = await invoke("get_tags");
    set({ tags: tags as Tag[] });
  },

  addTag: async (tagName: string) => {
    let newTag: Tag = await invoke("create_tag", {
      name: tagName,
      color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
    });

    get().fetchTags();

    return newTag;
  },

  addTagToQuote: async (quoteId: string, tagId: string) => {
    try {
      await invoke("add_quote_tag", {
        quoteId,
        tagId
      });
    } catch (error) {
      logger.error("Error adding tag to quote:", error);
    }
  },

  deleteTagFromQuote: async (quoteId: string, tagId: string) => {
    try {
      await invoke("delete_quote_tag", {
        quoteId,
        tagId
      });
    } catch (error) {
      logger.error("Error deleting tag from quote:", error);
    }
  }
}));
