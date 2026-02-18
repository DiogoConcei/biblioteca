import { create } from 'zustand';
import { Collection } from '../types/collections.interfaces';
import { Literatures } from '../../electron/types/electron-auxiliar.interfaces';

interface CollectionState {
  collections: Collection[] | [];
  favorites: Collection | null;
  recents: Collection | null;

  setCollections: (allCollections: Collection[] | []) => void;
  setFav: (collections: Collection[]) => void;
  setRecents: (collections: Collection[]) => void;

  fetchCollections: () => Promise<void>;
  updateFav: (serie: Literatures, isFav: boolean) => Promise<boolean>;

  createCollection: (
    collection: Omit<Collection, 'createdAt' | 'updatedAt'>,
  ) => Promise<boolean>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  favorites: null,
  recents: null,

  setCollections: (allCollections) => set({ collections: allCollections }),

  setFav: (allCollections) =>
    set({
      favorites:
        allCollections.find((collect) => collect.name === 'Favoritas') ?? null,
    }),

  setRecents: (allCollections) =>
    set({
      recents:
        allCollections.find((collect) => collect.name === 'Recentes') ?? null,
    }),

  fetchCollections: async () => {
    const response = await window.electronAPI.collections.getCollections();

    if (response.success && response.data) {
      set({
        collections: response.data,
        favorites: response.data.find((c) => c.name === 'Favoritos') ?? null,
        recents: response.data.find((c) => c.name === 'Recentes') ?? null,
      });
    }
  },

  updateFav: async (serie, isFav) => {
    try {
      const response = await window.electronAPI.series.favoriteSerie(
        serie.dataPath,
      );

      if (!response.success) return false;

      set((state) => {
        if (!state.favorites) return state;

        const updatedSeries = isFav
          ? [...state.favorites.series, response.data]
          : state.favorites.series.filter((s) => s.id !== serie.id);

        return {
          favorites: {
            ...state.favorites,
            series: updatedSeries,
          },
        };
      });

      return true;
    } catch {
      return false;
    }
  },

  createCollection: async (collection) => {
    const response =
      await window.electronAPI.collections.createCollection(collection);

    if (!response.success) return false;

    await get().fetchCollections();
    return true;
  },
}));
