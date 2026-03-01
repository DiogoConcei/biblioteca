import { create } from 'zustand';

import {
  Collection,
  CreateCollectionDTO,
  SerieInCollection,
} from '../types/collections.interfaces';
import { Literatures } from '../../electron/types/electron-auxiliar.interfaces';

interface AddToCollectionInput {
  id: number;
  name: string;
  coverImage: string;
  dataPath: string;
  totalChapters: number;
}

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
    serieData?: AddToCollectionInput,
  ) => Promise<boolean>;
  createCollection: (collection: CreateCollectionDTO) => Promise<boolean>;
  updateCollection: (
    name: string,
    payload: Partial<Pick<Collection, 'description' | 'coverImage' | 'name'>>,
  ) => Promise<boolean>;
  deleteCollection: (name: string) => Promise<boolean>;
  removeSerie: (collectionName: string, serieId: number) => Promise<boolean>;
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

/* ============================
   Utilities relacionados a imagens / paths
   ============================ */

const isDataUrl = (value: string) => value.startsWith('data:');
const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);
const isFileUrl = (value: string) => value.startsWith('file://');
const isAbsolutePath = (value: string) =>
  /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('/');

const normalizeLocalPath = (value: string) => {
  // Remove prefix file:/// ou file:// e decode
  if (!isFileUrl(value)) return value;
  return decodeURI(value.replace('file:///', '').replace('file://', ''));
};

/**
 * Converte um path local (file://...) para dataURL para que o frontend
 * possa exibir a imagem imediatamente. Se já for data: ou http(s) devolve como está.
 * Retorna string|null (null significa "sem imagem").
 */
const ensureDisplayableImage = async (image: string | null | undefined) => {
  if (!image) return null;
  if (isDataUrl(image) || isRemoteUrl(image)) return image;
  if (!isFileUrl(image) && !isAbsolutePath(image)) return image;

  const normalizedPath = normalizeLocalPath(image);

  try {
    const dataUrl =
      await window.electronAPI.webUtilities.readFileAsDataUrl(normalizedPath);

    return dataUrl || image;
  } catch (err) {
    return image;
  }
};

/**
 * Normaliza coverImage / backgroundImage de todas as séries em todas as collections.
 * Útil quando buscamos collections do backend — transformamos paths locais em dataURLs.
 */
const normalizeCollectionsImages = async (collections: Collection[]) => {
  const normalizedCollections = await Promise.all(
    collections.map(async (collection) => {
      const collectionCoverImage =
        (await ensureDisplayableImage(collection.coverImage)) ?? '';

      const normalizedSeries = await Promise.all(
        collection.series.map(async (serie) => {
          const coverImage =
            (await ensureDisplayableImage(serie.coverImage)) ?? '';
          const backgroundImage = await ensureDisplayableImage(
            serie.backgroundImage,
          );
          return {
            ...serie,
            coverImage,
            backgroundImage,
          };
        }),
      );

      return {
        ...collection,
        coverImage: collectionCoverImage,
        series: normalizedSeries,
      };
    }),
  );

  return normalizedCollections;
};

/* ============================
   Funções auxiliares de estado
   ============================ */

const getSpecialCollections = (collections: Collection[]) => ({
  favorites:
    collections.find((collect) => collect.name === 'Favoritos') ?? null,
  recents: collections.find((collect) => collect.name === 'Recentes') ?? null,
});

/**
 * Gera um objeto SerieInCollection otimista (quando adicionamos uma série localmente
 * antes de confirmar com o backend).
 */
const makeOptimisticSerie = (
  collection: Collection,
  input: AddToCollectionInput,
): SerieInCollection => {
  const now = new Date().toISOString();
  const highestPosition = Math.max(
    0,
    ...collection.series.map((serie) => serie.position || 0),
  );

  return {
    id: input.id,
    name: input.name,
    description: '',
    coverImage: input.coverImage,
    archivesPath: input.dataPath,
    totalChapters: input.totalChapters,
    status: '',
    recommendedBy: '',
    originalOwner: '',
    rating: 0,
    addAt: now,
    position: highestPosition + 1,
  };
};

/* ============================
   STORE (Zustand) - versão explícita
   ============================ */

export const useCollectionStore = create<CollectionState>((set, get) => {
  /**
   * Helper pequeno para sempre atualizar favorites/recents junto com collections.
   * Mantém tudo coerente (evita repetir a lógica em cada função).
   */
  const setCollectionsState = (collections: Collection[]) => {
    const specials = getSpecialCollections(collections);
    set({
      collections,
      favorites: specials.favorites,
      recents: specials.recents,
    });
  };

  return {
    collections: [],
    favorites: null,
    recents: null,

    /* ================
       Setters simples
       ================ */

    setCollections: (allCollections) => {
      // Recebe um array novo e atualiza favorites/recents automaticamente.
      setCollectionsState(allCollections);
    },

    setFav: (allCollections) => {
      const favorites =
        allCollections.find(
          (collect) => collect.name.trim().toLocaleLowerCase() === 'favoritos',
        ) ?? null;
      set({ favorites });
    },

    setRecents: (allCollections) => {
      const recents =
        allCollections.find((collect) => collect.name === 'Recentes') ?? null;
      set({ recents });
    },

    /* ================
       fetchCollections
       ================ */

    fetchCollections: async () => {
      // 1) Chama backend
      try {
        const response = await window.electronAPI.collections.getCollections();

        // 2) Se sucesso, normaliza imagens e seta estado
        if (response.success && response.data) {
          const normalizedCollections = await normalizeCollectionsImages(
            response.data,
          );
          setCollectionsState(normalizedCollections);
        }
      } catch (error) {
        // Logamos, mas não alteramos estado local
        console.error('fetchCollections error', error);
      }
    },

    /* ================
       updateFav
       ================ */

    updateFav: async (serie, isFav) => {
      // 1) Pedimos ao backend para alternar favorito (ele nos devolve a série favorita atualizada).
      try {
        const response = await window.electronAPI.series.favoriteSerie(
          serie.dataPath,
        );

        if (!response.success || !response.data) {
          return false;
        }

        const favoriteSerie = response.data;

        // 2) Atualiza apenas a collection 'Favoritos' no estado (imutável)
        set((state) => {
          // Se não existe a collection "Favoritos" no estado, não fazemos nada.
          if (!state.favorites) return state;

          const currentSeries = state.favorites.series ?? [];

          const updatedSeries = isFav
            ? currentSeries.some((s) => s.id === favoriteSerie.id)
              ? currentSeries
              : [...currentSeries, favoriteSerie]
            : currentSeries.filter((s) => s.id !== serie.id);

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

    /* ================
       createCollection
       ================ */

    createCollection: async (collection) => {
      const previousCollections = get().collections;
      let coverImage = null;

      if (collection.coverImage) {
        coverImage = collection.coverImage;
      } else {
        if (collection.seriesCoverId) {
          for (const existingCollection of previousCollections) {
            for (const serie of existingCollection.series) {
              if (serie.id === collection.seriesCoverId) {
                coverImage = serie.coverImage;
                break;
              }
            }

            if (coverImage) {
              break;
            }
          }
        }

        if (!coverImage && collection.series.length > 0) {
          coverImage = collection.series[0].coverImage;
        }
      }

      const finalCoverImage = (await ensureDisplayableImage(coverImage)) || '';

      const now = new Date().toISOString();

      const optimisticCollection: Collection = {
        ...collection,
        id: 'optimistic-' + Date.now(),
        coverImage: finalCoverImage,
        createdAt: now,
        updatedAt: now,
      };

      const updatedCollections = [...previousCollections, optimisticCollection];
      setCollectionsState(updatedCollections);

      try {
        const response =
          await window.electronAPI.collections.createCollection(collection);

        if (!response.success) {
          setCollectionsState(previousCollections);
          return false;
        }

        return true;
      } catch (error) {
        setCollectionsState(previousCollections);
        return false;
      }
    },

    /* ================
       updateCollection
       ================ */

    updateCollection: async (name, payload) => {
      const previous = get().collections;

      // Calcula novo estado (aplica updatedAt)
      const next = previous.map((collection) =>
        collection.name !== name
          ? collection
          : {
              ...collection,
              ...payload,
              updatedAt: new Date().toISOString(),
            },
      );

      setCollectionsState(next);

      try {
        const response = await window.electronAPI.collections.updateCollection(
          name,
          payload,
        );

        if (!response.success) {
          setCollectionsState(previous);
          return false;
        }

        return true;
      } catch (error) {
        setCollectionsState(previous);
        return false;
      }
    },

    /* ================
       deleteCollection
       ================ */

    deleteCollection: async (name) => {
      const cleanedName = name.trim().toLocaleLowerCase();
      if (cleanedName === 'favoritos' || cleanedName === 'recentes') {
        // Não permitimos deletar essas especiais
        return false;
      }

      const previous = get().collections;
      const next = previous.filter((collection) => collection.name !== name);

      setCollectionsState(next);

      try {
        const response =
          await window.electronAPI.collections.deleteCollection(name);

        if (!response.success) {
          setCollectionsState(previous);
          return false;
        }

        return true;
      } catch (error) {
        setCollectionsState(previous);
        return false;
      }
    },

    removeSerie: async (collectionName, serieId) => {
      const previous = get().collections;

      const next = previous.map((collection) => {
        if (collection.name !== collectionName) return collection;

        const filtered = collection.series.filter((s) => s.id !== serieId);

        return {
          ...collection,
          series: filtered,
          updatedAt: new Date().toISOString(),
        };
      });

      setCollectionsState(next);

      try {
        const response = await window.electronAPI.collections.removeSerie(
          collectionName,
          serieId,
        );

        if (!response) {
          setCollectionsState(previous);
          return false;
        }

        return true;
      } catch (error) {
        setCollectionsState(previous);
        return false;
      }
    },

    /* ================
       reorderSeries
       ================ */

    reorderSeries: async (collectionName, orderedSeriesIds) => {
      const previous = get().collections;

      const next = previous.map((collection) => {
        if (collection.name !== collectionName) return collection;

        // Monta novo array respeitando a ordem passada
        const reordered: SerieInCollection[] = [];
        orderedSeriesIds.forEach((id, index) => {
          const found = collection.series.find((s) => s.id === id);
          if (!found) return;
          reordered.push({ ...found, position: index + 1 });
        });

        return {
          ...collection,
          series: reordered,
          updatedAt: new Date().toISOString(),
        };
      });

      setCollectionsState(next);

      try {
        const response = await window.electronAPI.collections.reorderSeries(
          collectionName,
          orderedSeriesIds,
        );

        if (!response.success) {
          setCollectionsState(previous);
          return false;
        }

        return true;
      } catch (error) {
        setCollectionsState(previous);
        return false;
      }
    },

    /* ================
       updateSerieBackground
       ================
       Observação: a interface aceitou (collectionName, serieId, path).
       Internamente nós tentamos transformar `path` em um preview (dataURL) para mostrar
       imediatamente na UI quando for um arquivo local.
    */

    updateSerieBackground: async (collectionName, serieId, path) => {
      const previous = get().collections;

      // tentamos gerar um preview imediatamente (se path for local => dataURL)
      let previewImage: string | null = null;

      try {
        previewImage = await ensureDisplayableImage(path ?? null);
      } catch {
        previewImage = path ?? null;
      }

      const next = previous.map((collection) => {
        if (collection.name !== collectionName) return collection;

        const updatedSeries = collection.series.map((serie) =>
          serie.id === serieId
            ? {
                ...serie,
                backgroundImage: previewImage,
              }
            : serie,
        );

        return {
          ...collection,
          series: updatedSeries,
          updatedAt: new Date().toISOString(),
        };
      });

      setCollectionsState(next);

      try {
        const response =
          await window.electronAPI.collections.updateSerieBackground(
            collectionName,
            serieId,
            path,
          );

        if (!response.success) {
          // rollback
          setCollectionsState(previous);
          return false;
        }

        // Se backend aceitar, mantemos o estado (backend poderia devolver valor real — aqui assumimos sucesso)
        return true;
      } catch (error) {
        setCollectionsState(previous);
        return false;
      }
    },

    /* ================
       addToCollection
       ================ */

    addToCollection: async (dataPath, collectionName, serieData) => {
      // Se o chamador não forneceu `serieData`, tentamos encontrar nos collections já carregados.
      const cachedSerie = get()
        .collections.flatMap((collection) => collection.series)
        .find((serie) => serie.archivesPath === dataPath);

      const sourceSerie: AddToCollectionInput | null = serieData
        ? serieData
        : cachedSerie
          ? {
              id: cachedSerie.id,
              name: cachedSerie.name,
              coverImage: cachedSerie.coverImage,
              dataPath: cachedSerie.archivesPath,
              totalChapters: cachedSerie.totalChapters,
            }
          : null;

      if (!sourceSerie) {
        // Não temos informações suficientes para adicionar
        return false;
      }

      const previous = get().collections;

      // Construímos próximo estado adicionando uma série "otimista"
      const next = previous.map((collection) => {
        if (collection.name !== collectionName) return collection;

        const exists = collection.series.some((s) => s.id === sourceSerie.id);
        if (exists) return collection;

        const optimisticSerie = makeOptimisticSerie(collection, sourceSerie);

        return {
          ...collection,
          series: [...collection.series, optimisticSerie],
          updatedAt: new Date().toISOString(),
        };
      });

      // Atualiza UI agora
      setCollectionsState(next);

      // Chama backend que adiciona série à collection
      try {
        const response = await window.electronAPI.series.serieToCollection(
          dataPath,
          collectionName,
        );

        if (!response.success) {
          // rollback
          setCollectionsState(previous);
          return false;
        }

        // sucesso
        return true;
      } catch (error) {
        setCollectionsState(previous);
        return false;
      }
    },
  };
});
