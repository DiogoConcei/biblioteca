import { IpcMain } from 'electron';

import CollectionsManager from '../services/content/CollectionManager';
import ImageManager from '../services/processing/ImageManager';
import {
  Collection,
  CreateCollectionDTO,
} from '../../src/shared/types/collections.interfaces';
import { MetadataType } from '../types/metadata.interfaces';
import { APIResponse } from '../types/electron-auxiliar.interfaces';

export default function collectionHandlers(ipcMain: IpcMain) {
  const collectionsManager = new CollectionsManager();
  const imageManager = new ImageManager();

  ipcMain.handle('collection:get-all', async (): Promise<APIResponse<Collection[]>> => {
    try {
      const collections = await collectionsManager.getCollections();

      if (!collections) {
        throw new Error('Falha em recuperar as colecoes');
      }

      const codedCollections = await Promise.all(
        collections.map(async (collection) => {
          const updatedSeries = [];

          for (const serie of collection.series) {
            const encodedCover = await imageManager.encodeImage(serie.coverImage);

            if (serie.backgroundImage) {
              serie.backgroundImage = await imageManager.encodeImage(
                serie.backgroundImage,
              );
            }

            updatedSeries.push({
              ...serie,
              coverImage: encodedCover,
              backgroundImage: serie.backgroundImage,
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

  ipcMain.handle('collection:quickly-create', async (_event, collectionName: string) => {
    try {
      const result = await collectionsManager.quicklyCreate(collectionName);
      return { success: result };
    } catch (e) {
      console.error(`Falha ao criar coleção: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('collection:create', async (_event, collection: CreateCollectionDTO) => {
    try {
      const result = await collectionsManager.createCollection(collection);
      return { success: result };
    } catch (e) {
      console.error(`Falha ao criar coleção: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'collection:update-serie-background',
    async (
      _event,
      collectionName: string,
      serieId: number,
      backgroundImage: string | null,
    ) => {
      try {
        const normalizedImage: string | null =
          await imageManager.uploadBackground(backgroundImage);

        const result = await collectionsManager.updateSerieBackground(
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

  ipcMain.handle('collection:delete', async (_event, collectionName: string) => {
    try {
      const result = await collectionsManager.removeCollection(collectionName);
      return { success: result };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'collection:update',
    async (
      _event,
      collectionName: string,
      payload: Partial<Pick<Collection, 'description' | 'coverImage' | 'name'>>,
    ) => {
      try {
        const result = await collectionsManager.updateCollectionInfo(
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
    async (_event, collectionName: string, serieId: number) => {
      return collectionsManager.removeInCollection(collectionName, serieId);
    },
  );

  ipcMain.handle(
    'collection:reorder-series',
    async (_event, collectionName: string, orderedSeriesIds: number[]) => {
      try {
        const result = await collectionsManager.reorderCollectionSeries(
          collectionName,
          orderedSeriesIds,
        );

        return { success: result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle('collection:get-all-fav', async () => {
    try {
      const favCollection = await collectionsManager.getFavorites();

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
