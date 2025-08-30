import { create } from 'zustand';

import { Literatures, Response, viewData } from '../types/auxiliar.interfaces';
import { TieIn } from 'electron/types/comic.interfaces';

interface SeriesState {
  series: viewData[] | null;
  serie: Literatures | null;
  error: string | null;
  loading: boolean;

  setSerie: (newSerie: Literatures | null) => void;
  setSeries: (allSeries: viewData[] | null) => void;
  fetchSeries: () => void;
  fetchSerie: (
    serieName: string,
    literatureForm: string,
  ) => Promise<Literatures | TieIn | null>;
  setError: (error: string | null) => void;
  setLoading: (value: boolean) => void;

  resetStates: () => void;
}

export const useSerieStore = create<SeriesState>((set) => ({
  series: null,
  serie: null,
  error: null,
  loading: true,

  setLoading: (value: boolean) => ({ loading: value }),

  setError: (error: string | null) => set({ error, loading: false }),
  resetStates: () => set({ serie: null, error: null, loading: false }),

  setSeries: (allSeries: viewData[] | null) => set({ series: allSeries }),
  setSerie: (newSerie: Literatures | null) => set({ serie: newSerie }),

  fetchSeries: async () => {
    try {
      const response: Response<viewData[]> =
        await window.electronAPI.series.getSeries();

      if (!response) {
        set({
          loading: false,
          error: 'Erro inesperado ao buscar série',
        });
        return null;
      }

      if (response.success && response.data) {
        set({ loading: false, series: response.data });
      } else {
        set({
          loading: false,
          error: response.error ?? 'Erro inesperado ao buscar série',
        });
        return null;
      }
    } catch (e) {
      console.log(`Erro em exibir todas as séries: ${e}`);
    }
  },

  fetchSerie: async (serieName: string, literatureForm: string) => {
    try {
      let response: Response<Literatures | TieIn | null>;

      switch (literatureForm) {
        case 'Manga':
          response = await window.electronAPI.series.getManga(serieName);
          break;
        case 'Quadrinho':
          response = await window.electronAPI.series.getComic(serieName);
          break;
        case 'childSeries':
          response = await window.electronAPI.series.getTieIn(serieName);
          break;
        default:
          response = {
            success: false,
            data: null,
            error: 'Tipo de literatura desconhecido',
          };
          break;
      }

      if (!response) {
        set({
          loading: false,
          error: 'Erro inesperado ao buscar série',
        });
        return null;
      }

      if (response.success && response.data) {
        set({ loading: false });

        if (literatureForm === 'childSeries') {
          return response.data as TieIn;
        } else {
          return response.data as Literatures;
        }
      } else {
        set({
          loading: false,
          error: response.error ?? 'Erro inesperado ao buscar série',
        });
        return null;
      }
    } catch (e) {
      set({
        loading: false,
        error: 'Falha ao recuperar série. Tente novamente.',
      });
      return null;
    }
  },
}));
