import { create } from 'zustand';
import {
  Collection,
  CreateCollectionDTO,
} from '../types/collections.interfaces';
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
  addToCollection: (
    dataPath: string,
    collectionName: string,
  ) => Promise<boolean>;
  createCollection: (collection: CreateCollectionDTO) => Promise<boolean>;
  updateCollection: (
    name: string,
    payload: Partial<Pick<Collection, 'description' | 'coverImage' | 'name'>>,
  ) => Promise<boolean>;
  deleteCollection: (name: string) => Promise<boolean>;
  removeSerie: (
    collectionName: string,
    serieId: number,
    keepEmpty?: boolean,
  ) => Promise<boolean>;
  reorderSeries: (
    collectionName: string,
    orderedSeriesIds: number[],
  ) => Promise<boolean>;
  updateSerieBackground: (
    collectionName: string,
    serieId: number,
    path: string | null,
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
        allCollections.find(
          (collect) => collect.name.trim().toLocaleLowerCase() === 'favoritos',
        ) ?? null,
    }),

  setRecents: (allCollections) =>
    set({
      recents:
        allCollections.find((collect) => collect.name === 'Recentes') ?? null,
    }),

  fetchCollections: async () => {
    try {
      const response = await window.electronAPI.collections.getCollections();

      if (response.success && response.data) {
        const allCollections: Collection[] = response.data;
        set({ collections: allCollections });
        set({
          favorites:
            allCollections.find((collect) => collect.name === 'Favoritos') ??
            null,
          recents:
            allCollections.find((collect) => collect.name === 'Recentes') ??
            null,
        });
      }
    } catch (error) {
      console.error('fetchCollections error', error);
    }
  },

  updateFav: async (serie, isFav) => {
    try {
      const response = await window.electronAPI.series.favoriteSerie(
        serie.dataPath,
      );

      if (!response.success || !response.data) return false;

      const favoriteSerie = response.data;

      set((state) => {
        if (!state.favorites) return state;

        const currentSeries = state.favorites.series ?? [];

        let updatedSeries: typeof currentSeries;

        if (isFav) {
          const alreadyExists = currentSeries.some(
            (s) => s.id === favoriteSerie.id,
          );

          updatedSeries = alreadyExists
            ? currentSeries
            : [...currentSeries, favoriteSerie];
        } else {
          updatedSeries = currentSeries.filter((s) => s.id !== serie.id);
        }

        return {
          favorites: {
            ...state.favorites,
            series: updatedSeries,
          },
        };
      });

      return true;
    } catch (error) {
      console.error('updateFav error', error);
      return false;
    }
  },

  createCollection: async (collection) => {
    try {
      const response =
        await window.electronAPI.collections.createCollection(collection);

      if (!response.success) return false;

      await get().fetchCollections();
      return true;
    } catch (err) {
      console.error('createCollection error', err);
      return false;
    }
  },

  updateCollection: async (name, payload) => {
    try {
      const response = await window.electronAPI.collections.updateCollection(
        name,
        payload,
      );

      if (!response.success) return false;
      await get().fetchCollections();
      return true;
    } catch (err) {
      console.error('updateCollection error', err);
      return false;
    }
  },

  deleteCollection: async (name) => {
    try {
      const cleanedName = name.trim().toLocaleLowerCase();

      if (cleanedName === 'favoritos' || cleanedName === 'recentes')
        return false;

      const response =
        await window.electronAPI.collections.deleteCollection(name);
      if (!response.success) return false;
      await get().fetchCollections();
      return true;
    } catch (err) {
      console.error('deleteCollection error', err);
      return false;
    }
  },

  removeSerie: async (collectionName, serieId, keepEmpty = false) => {
    try {
      const response = await window.electronAPI.collections.removeSerie(
        collectionName,
        serieId,
        keepEmpty,
      );

      if (!response.success) return false;
      await get().fetchCollections();
      return true;
    } catch (err) {
      console.error('removeSerie error', err);
      return false;
    }
  },

  reorderSeries: async (collectionName, orderedSeriesIds) => {
    try {
      const response = await window.electronAPI.collections.reorderSeries(
        collectionName,
        orderedSeriesIds,
      );

      if (!response.success) return false;
      await get().fetchCollections();
      return true;
    } catch (err) {
      console.error('reorderSeries error', err);
      return false;
    }
  },

  updateSerieBackground: async (collectionName, serieId, path) => {
    try {
      const response =
        await window.electronAPI.collections.updateSerieBackground(
          collectionName,
          serieId,
          path,
        );

      if (!response.success) return false;

      set((state) => ({
        collections: state.collections.map((collection) =>
          collection.name !== collectionName
            ? collection
            : {
                ...collection,
                series: collection.series.map((serie) =>
                  serie.id === serieId
                    ? { ...serie, backgroundImage: path }
                    : serie,
                ),
              },
        ),
      }));

      return true;
    } catch (err) {
      console.error('updateSerieBackground error', err);
      return false;
    }
  },

  addToCollection: async (dataPath, collectionName) => {
    try {
      const response = await window.electronAPI.series.serieToCollection(
        dataPath,
        collectionName,
      );

      if (!response.success) return false;
      await get().fetchCollections();
      return true;
    } catch (error) {
      console.error('addToCollection error', error);
      return false;
    }
  },
}));
