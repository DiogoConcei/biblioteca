import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { viewData } from '../../electron/types/electron-auxiliar.interfaces';
import { useUIStore } from './useUIStore';

interface AllSeriesState {
  series: viewData[];
  lastUpdated: string | null;
  
  // Actions
  setSeries: (series: viewData[]) => void;
  fetchAllSeries: () => Promise<void>;
}

export const useAllSeriesStore = create<AllSeriesState>()(
  persist(
    (set) => ({
      series: [],
      lastUpdated: null,

      setSeries: (series) => set({ series, lastUpdated: new Date().toISOString() }),

      fetchAllSeries: async () => {
        const { controlFetching } = useUIStore.getState();
        
        try {
          // Se já temos séries, não mostramos o loading global (silencioso)
          // Mas se for a primeira vez, mostramos.
          const hasSeries = useAllSeriesStore.getState().series.length > 0;
          if (!hasSeries) controlFetching(true, null);

          const response = await window.electronAPI.series.getSeries();

          if (response.success && response.data) {
            set({ series: response.data, lastUpdated: new Date().toISOString() });
          }
        } catch (e) {
          console.error('Erro ao buscar todas as séries:', e);
        } finally {
          controlFetching(false, null);
        }
      },
    }),
    {
      name: 'all-series-cache',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
