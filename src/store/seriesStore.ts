import { create } from 'zustand';
import { viewData } from '../types/series.interfaces.ts';

interface SeriesState {
  series: viewData[]; // Estado
  fetchSeries: () => Promise<void>; // ação assíncrona
  setSeries: (newList: viewData[]) => void; // ação sincrona para setar
}

export const useSeriesStore = create<SeriesState>(set => ({
  series: [],
  setSeries: newList => {
    set({ series: newList });
  },

  fetchSeries: async () => {
    try {
      const response = await window.electronAPI.series.getSeries();

      if (response.success) {
        set({ series: response.data });
      } else {
        console.error('Falha ao obter séries: ', response.error);
      }
    } catch (err) {
      console.error('Erro inesperado ao chamar getSeries: ', err);
    }
  },
}));
