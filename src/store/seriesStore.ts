import { create } from "zustand";

import { Literatures, Response } from "../types/series.interfaces";

interface SeriesState {
  serie: Literatures | null;
  error: string | null;
  loading: boolean;

  setSerie: (newSerie: Literatures | null) => void;
  fetchSerie: (
    serieName: string,
    literatureForm: string
  ) => Promise<Literatures | null>;
  setError: (error: string | null) => void;

  resetStates: () => void;
}

export const useSerieStore = create<SeriesState>((set) => ({
  serie: null,
  error: null,
  loading: true,

  setError: (error: string | null) => set({ error, loading: false }),
  resetStates: () => set({ serie: null, error: null, loading: false }),

  setSerie: (newSerie: Literatures | null) => set({ serie: newSerie }),

  fetchSerie: async (serieName: string, literatureForm: string) => {
    try {
      let response: Response<Literatures | null>;

      switch (literatureForm) {
        case "Manga":
          response = await window.electronAPI.series.getManga(serieName);
          break;
        case "Quadrinho":
          response = await window.electronAPI.series.getComic(serieName);
          break;
        default:
          response = {
            success: false,
            data: null,
            error: "Tipo de literatura desconhecido",
          };
          break;
      }

      if (!response) {
        set({
          loading: false,
          error: "Erro inesperado ao buscar série",
        });
        return null;
      }

      if (response.success && response.data) {
        set({
          loading: false,
        });
        return response.data as Literatures;
      } else {
        set({
          loading: false,
          error: response.error ?? "Erro inesperado ao buscar série",
        });
        return null;
      }
    } catch (e) {
      set({
        loading: false,
        error: "Falha ao recuperar série. Tente novamente.",
      });

      return null;
    }
  },
}));
