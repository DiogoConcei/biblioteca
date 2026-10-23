import { create } from 'zustand';
import { SerieHistoryEntry } from '../../../electron/types/history.interfaces';

interface HistoryState {
  recentSeries: SerieHistoryEntry[];

  fetchHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  recentSeries: [],

  fetchHistory: async () => {
    // Trava de cache
    if (get().recentSeries.length > 0) return;

    try {
      // 1. Mudança aqui: de getSummaries para getRecents
      const response = await window.electronAPI.history.getRecents();

      if (!response.success || !response.data) return;

      set({ recentSeries: response.data });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  },

  refreshHistory: async () => {
    try {
      // 2. Mudança aqui também
      const response = await window.electronAPI.history.getRecents();

      if (response.success && response.data) {
        set({ recentSeries: response.data });
      }
    } catch (error) {
      console.error('Erro ao recarregar histórico:', error);
    }
  },
}));
