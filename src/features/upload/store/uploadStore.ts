import { create } from 'zustand';
import {
  SerieData,
  ChapterData,
  FailedItem,
  ProcessedUploadResult,
} from '@/features/upload/types/upload.interfaces';

interface UploadStore {
  pendingSeries: SerieData[];
  pendingChapters: ChapterData[];
  failedItems: FailedItem[];

  isModalOpen: boolean;

  populateQueue: (result: ProcessedUploadResult) => void;

  closeModal: () => void;

  consumeSeries: () => SerieData[];
  consumeChapters: () => ChapterData[];
  clearFailed: () => void;

  hasPendingItems: () => boolean;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  pendingSeries: [],
  pendingChapters: [],
  failedItems: [],
  isModalOpen: false,

  populateQueue: (result) => {
    set((state) => {
      const knownChapters = new Set(state.pendingChapters.map((c) => c.oldPath));
      const knownSeries = new Set(state.pendingSeries.map((s) => s.oldPath));
      return {
        pendingSeries: [
          ...state.pendingSeries,
          ...result.series.filter((s) => !knownSeries.has(s.oldPath)),
        ],
        pendingChapters: [
          ...state.pendingChapters,
          ...result.chapters.filter((c) => !knownChapters.has(c.oldPath)),
        ],
        failedItems: [...state.failedItems, ...result.failed],
      };
    });
    const hasBothNow = get().pendingSeries.length > 0 && get().pendingChapters.length > 0;

    if (hasBothNow) {
      set({ isModalOpen: true });
    }
  },

  closeModal: () => set({ isModalOpen: false }),

  consumeSeries: () => {
    const series = get().pendingSeries;
    set({ pendingSeries: [] });
    return series;
  },

  consumeChapters: () => {
    const chapters = get().pendingChapters;
    set({ pendingChapters: [] });
    return chapters;
  },

  clearFailed: () => set({ failedItems: [] }),

  hasPendingItems: () => {
    const state = get();
    return state.pendingSeries.length > 0 || state.pendingChapters.length > 0;
  },
}));
