import { create } from 'zustand';

import { Literatures, Response } from '../types/auxiliar.interfaces';
import { TieIn } from 'electron/types/comic.interfaces';

interface SeriesState {
  serie: Literatures | null;
  error: string | null;
  loading: boolean;

  setSerie: (newSerie: Literatures | null) => void;
  fetchSerie: (
    serieName: string,
    literatureForm: string,
  ) => Promise<Literatures | TieIn | null>;
  setError: (error: string | null) => void;
  setLoading: (value: boolean) => void;

  resetStates: () => void;
}

export const useSerieStore = create<SeriesState>((set) => ({
  serie: null,
  error: null,
  loading: true,
  setLoading: (value: boolean) => ({ loading: value }),

  setError: (error: string | null) => set({ error, loading: false }),
  resetStates: () => set({ serie: null, error: null, loading: false }),

  setSerie: (newSerie: Literatures | null) => set({ serie: newSerie }),

  fetchSerie: async (serieName: string, literatureForm: string) => {
    try {
      console.log('[fetchSerie] Iniciando busca...');
      console.log('[fetchSerie] Nome da série:', serieName);
      console.log('[fetchSerie] Tipo de literatura:', literatureForm);

      let response: Response<Literatures | TieIn | null>;

      switch (literatureForm) {
        case 'Manga':
          console.log('[fetchSerie] Chamando getManga...');
          response = await window.electronAPI.series.getManga(serieName);
          break;
        case 'Quadrinho':
          console.log('[fetchSerie] Chamando getComic...');
          response = await window.electronAPI.series.getComic(serieName);
          break;
        case 'childSeries':
          console.log('[fetchSerie] Chamando getTieIn...');
          response = await window.electronAPI.series.getTieIn(serieName);
          break;
        default:
          console.warn('[fetchSerie] Tipo de literatura desconhecido');
          response = {
            success: false,
            data: null,
            error: 'Tipo de literatura desconhecido',
          };
          break;
      }

      console.log('[fetchSerie] Resposta recebida:', response);

      if (!response) {
        console.error('[fetchSerie] Resposta nula/indefinida');
        set({
          loading: false,
          error: 'Erro inesperado ao buscar série',
        });
        return null;
      }

      if (response.success && response.data) {
        console.log('[fetchSerie] Busca bem-sucedida');
        set({ loading: false });

        if (literatureForm === 'childSeries') {
          console.log('[fetchSerie] Retornando TieIn');
          return response.data as TieIn;
        } else {
          console.log('[fetchSerie] Retornando Literatures');
          return response.data as Literatures;
        }
      } else {
        console.warn('[fetchSerie] Falha na busca:', response.error);
        set({
          loading: false,
          error: response.error ?? 'Erro inesperado ao buscar série',
        });
        return null;
      }
    } catch (e) {
      console.error('[fetchSerie] Erro no processo:', e);
      set({
        loading: false,
        error: 'Falha ao recuperar série. Tente novamente.',
      });
      return null;
    }
  },
}));
