import { create } from 'zustand';

import { Collection, SerieInCollection } from '../types/collections.interfaces';
import { StoreSerie } from './useSerieStore';

interface CollectionState {
  collections: Collection[];
  fetchCollections: () => Promise<void>;
  updateFav: (
    serie: { id: number; dataPath: string },
    isFav: boolean,
  ) => Promise<boolean>;
  updateSerieInCollection: (serie: StoreSerie) => void;
  setCollection: (collection: Collection) => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],

  fetchCollections: async () => {
    if (get().collections.length > 0) return; // pode manter — só carga inicial
    const response = await window.electronAPI.collections.getCollections();
    if (!response.success || !response.data) return;
    set({ collections: response.data });
  },

  updateFav: async (serie, isFav) => {
    const response = await window.electronAPI.series.favoriteSerie(serie.dataPath);
    if (!response.success || !response.data) return false;
    const favoriteSerie = response.data;

    set((state) => ({
      collections: state.collections.map((col) => {
        if (col.name.trim().toLowerCase() !== 'favoritos') return col;
        const current = col.series ?? [];
        const series = isFav
          ? current.some((s) => s.id === favoriteSerie.id)
            ? current
            : [...current, favoriteSerie]
          : current.filter((s) => s.id !== serie.id);
        return { ...col, series };
      }),
    }));

    return true;
  },

  updateSerieInCollection: (serie) => {
    set((state) => ({
      collections: state.collections.map((col) =>
        col.series.some((s) => s.id === serie.id)
          ? {
              ...col,
              series: col.series.map((s) => (s.id === serie.id ? { ...s, ...serie } : s)),
            }
          : col,
      ),
    }));
  },

  setCollection: (updated: Collection) =>
    set((state) => ({
      collections: state.collections.some((c) => c.name === updated.name)
        ? state.collections.map((c) => (c.name === updated.name ? updated : c))
        : [...state.collections, updated],
    })),
}));
