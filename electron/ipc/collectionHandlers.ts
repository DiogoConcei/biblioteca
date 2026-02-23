import { IpcMain } from 'electron';

import CollectionsManager from '../services/CollectionManager';
// import MetadataManager from '../services/MetadataManager';
import ImageManager from '../services/ImageManager';
import {
  Collection,
  CreateCollectionDTO,
} from '../../src/types/collections.interfaces';

export type MetadataType = 'manga' | 'comic';

export default function collectionHandlers(ipcMain: IpcMain) {
  const collectionsOperations = new CollectionsManager();
  // const metadataManager = new MetadataManager();
  const imageManager = new ImageManager();

  ipcMain.handle('collection:get-all', async () => {
    try {
      const collections = await collectionsOperations.getCollections();

      if (!collections) {
        throw new Error('Falha em recuperar as colecoes');
      }

      const codedCollections = await Promise.all(
        collections.map(async (collection) => {
          const updatedSeries = [];

          for (const serie of collection.series) {
            const encodedCover = await imageManager.encodeImage(
              serie.coverImage,
            );

            if (serie.backgroundImage) {
              serie.backgroundImage = await imageManager.encodeImage(
                serie.backgroundImage,
              );
            }

            updatedSeries.push({
              ...serie,
              coverImage: encodedCover,
            });
          }

          const encodedCollectionCover = await imageManager.encodeImage(
            collection.coverImage,
          );

          return {
            ...collection,
            coverImage: encodedCollectionCover,
            series: updatedSeries,
          };
        }),
      );

      return { success: true, data: codedCollections };
    } catch (e) {
      console.error(`Falha em recuperar todas as colecoes: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'collection:quickly-create',
    async (_event, collectionName: string) => {
      try {
        const result =
          await collectionsOperations.quicklyCreate(collectionName);
        return { success: result };
      } catch (e) {
        console.error(`Falha ao criar coleção: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'collection:create',
    async (_event, collection: CreateCollectionDTO) => {
      try {
        const result = await collectionsOperations.createCollection(collection);
        return { success: result };
      } catch (e) {
        console.error(`Falha ao criar coleção: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'collection:update-serie-background',
    async (
      _event,
      collectionName: string,
      serieId: number,
      backgroundImage: string | null,
    ) => {
      try {
        let normalizedImage: string | null =
          await imageManager.uploadBackground(backgroundImage);

        const result = await collectionsOperations.updateSerieBackground(
          collectionName,
          serieId,
          normalizedImage,
        );

        return { success: result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'collection:delete',
    async (_event, collectionName: string) => {
      try {
        const result =
          await collectionsOperations.removeCollection(collectionName);
        return { success: result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'collection:update',
    async (
      _event,
      collectionName: string,
      payload: Partial<Pick<Collection, 'description' | 'coverImage' | 'name'>>,
    ) => {
      try {
        const result = await collectionsOperations.updateCollectionInfo(
          collectionName,
          payload,
        );

        return { success: result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'collection:remove-serie',
    async (
      _event,
      collectionName: string,
      serieId: number,
      keepEmpty = false,
    ) => {
      return collectionsOperations.removeInCollection(
        collectionName,
        serieId,
        keepEmpty,
      );
    },
  );

  ipcMain.handle(
    'collection:reorder-series',
    async (_event, collectionName: string, orderedSeriesIds: number[]) => {
      try {
        const result = await collectionsOperations.reorderCollectionSeries(
          collectionName,
          orderedSeriesIds,
        );

        return { success: result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  );

  //  scrapper => Desativado
  // ipcMain.handle(
  //   'metadata:fetch',
  //   async (
  //     _event,
  //     title: string,
  //     type: MetadataType,
  //     year?: number,
  //     author?: string,
  //   ) => {
  //     try {
  //       if (!title?.trim()) {
  //         return { success: false, error: 'Título é obrigatório.' };
  //       }

  //       if (type !== 'manga' && type !== 'comic') {
  //         return {
  //           success: false,
  //           error: 'Tipo inválido. Use manga ou comic.',
  //         };
  //       }

  //       const metadata = await metadataManager.fetchMetadata({
  //         title,
  //         type,
  //         year,
  //         author,
  //       });

  //       if (!metadata) {
  //         return {
  //           success: false,
  //           error: 'Nenhum metadado confiável encontrado.',
  //         };
  //       }

  //       return { success: true, data: metadata };
  //     } catch (e) {
  //       return { success: false, error: String(e) };
  //     }
  //   },
  // );

  ipcMain.handle('collection:get-all-fav', async () => {
    try {
      const favCollection = await collectionsOperations.getFavorites();

      if (!favCollection) {
        throw new Error(`Falha na requisição das séries favoritas!`);
      }

      return favCollection;
    } catch (error) {
      console.error(`erro em recuperar series favoritas: ${error}`);
      throw error;
    }
  });
}
