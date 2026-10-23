import { create } from 'zustand';

import { Collection } from '../types/collections.interfaces';

interface CollectionState {
  collections: Collection[];
  favorites: Collection | null;
  recents: Collection | null;

  setFav: (collections: Collection[]) => void;
  setRecents: (collections: Collection[]) => void;

  fetchCollections: () => Promise<void>;
  updateFav: (
    serie: { id: number; dataPath: string },
    isFav: boolean,
  ) => Promise<boolean>;
}

const findCollection = (collections: Collection[], name: string) =>
  collections.find((c) => c.name.trim().toLowerCase() === name) ?? null;

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  favorites: null,
  recents: null,

  setFav: (allCollections) => {
    set({ favorites: findCollection(allCollections, 'favoritos') });
  },

  setRecents: (allCollections) => {
    set({ recents: findCollection(allCollections, 'recentes') });
  },

  fetchCollections: async () => {
    try {
      if (get().collections.length > 0) return;

      const response = await window.electronAPI.collections.getCollections();
      if (!response.success || !response.data) return;

      const collections: Collection[] = response.data;

      set({
        collections,
        favorites: findCollection(collections, 'favoritos'),
        recents: findCollection(collections, 'recentes'),
      });
    } catch (error) {
      console.error('fetchCollections error', error);
    }
  },

  updateFav: async (serie, isFav) => {
    try {
      const response = await window.electronAPI.series.favoriteSerie(serie.dataPath);

      if (!response.success || !response.data) return false;

      const favoriteSerie = response.data;

      set((state) => {
        if (!state.favorites) return state;

        const current = state.favorites.series ?? [];
        const series = isFav
          ? current.some((s) => s.id === favoriteSerie.id)
            ? current
            : [...current, favoriteSerie]
          : current.filter((s) => s.id !== serie.id);

        return { favorites: { ...state.favorites, series } };
      });

      return true;
    } catch (error) {
      console.error('updateFav error', error);
      return false;
    }
  },
}));
