import { create } from 'zustand';

import { Collection } from '../types/collections.interfaces';

interface CollectionState {
  collections: Collection[] | null;
  favorites: Collection | null;
  recents: Collection | null;

  setCollections: (allCollections: Collection[] | null) => void;
  setFav: (collections: Collection[]) => void;
  setRecents: (collections: Collection[]) => void;
  fetchCollections: () => Promise<Collection[]>;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: null,
  favorites: null,
  recents: null,

  setCollections: (allCollections: Collection[] | null) =>
    set({ collections: allCollections }),

  setFav: (allCollections: Collection[]) =>
    set({
      favorites: allCollections.find((collect) => collect.name === 'Favoritas'),
    }),

  setRecents: (allCollections: Collection[]) =>
    set({
      recents: allCollections.find((collect) => collect.name === 'Recentes'),
    }),

  fetchCollections: async () => {
    try {
      const responseCol = await window.electronAPI.collections.getCollections();

      if (responseCol.success && responseCol.data) {
        useCollectionStore.getState().setFav(responseCol.data);
        useCollectionStore.getState().setRecents(responseCol.data);
        return responseCol.data;
      } else {
        return [];
      }
    } catch (e) {
      throw new Error('Falhou');
    }
  },
}));
