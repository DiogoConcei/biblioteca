import { create } from 'zustand';
import { SerieHistoryEntry } from '../../../electron/types/history.interfaces';

interface HistoryState {
  recentSeries: SerieHistoryEntry[];

  fetchHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  upsertRecent: (entry: SerieHistoryEntry) => void;
  setRecentHistory: (entries: SerieHistoryEntry[]) => void;
}

const RECENTS_LIMIT = 5;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  recentSeries: [],

  fetchHistory: async () => {
    if (get().recentSeries.length > 0) return;

    try {
      const response = await window.electronAPI.history.getRecents();

      if (!response.success || !response.data) return;

      set({ recentSeries: response.data });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  },

  refreshHistory: async () => {
    try {
      const response = await window.electronAPI.history.getRecents();

      if (response.success && response.data) {
        set({ recentSeries: response.data });
      }
    } catch (error) {
      console.error('Erro ao recarregar histórico:', error);
    }
  },

  upsertRecent: (entry) =>
    set((state) => ({
      recentSeries: [
        entry,
        ...state.recentSeries.filter((s) => s.serieId !== entry.serieId),
      ].slice(0, RECENTS_LIMIT),
    })),

  setRecentHistory: (entries: SerieHistoryEntry[]) =>
    set({ recentSeries: entries.slice(0, 5) }),
}));
