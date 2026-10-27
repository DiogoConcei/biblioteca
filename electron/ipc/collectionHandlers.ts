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
      const rawCollections = await collectionsManager.getCollections();

      if (!rawCollections) throw new Error('Falha em recuperar as coleções');

      const collections = rawCollections.map((coll) => {
        const updatedSeries = coll.series.map((serie) => ({
          ...serie,
          coverImage: imageManager.getMediaUrl(serie.coverImage),
          backgroundImage: serie.backgroundImage
            ? imageManager.getMediaUrl(serie.backgroundImage)
            : serie.backgroundImage,
        }));

        return {
          ...coll,
          coverImage: imageManager.getMediaUrl(coll.coverImage),
          series: updatedSeries,
        };
      });

      return { success: true, data: collections };
    } catch (e) {
      console.error(`Falha em recuperar todas as colecoes: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'collection:update-collection-cover',
    async (_event, collectionName: string, cover: string): Promise<APIResponse<void>> => {
      try {
        const decodedCover = await imageManager.decodeMediaUrl(cover);
        await collectionsManager.updateCover(collectionName, decodedCover);
        return { success: true };
      } catch (e) {
        console.error(`Falha em atualizar capa da coleção: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );
}

// ipcMain.handle('collection:quickly-create', async (_event, collectionName: string) => {
//   try {
//     const result = await collectionsManager.quicklyCreate(collectionName);
//     return { success: result };
//   } catch (e) {
//     console.error(`Falha ao criar coleção: ${e}`);
//     return { success: false, error: String(e) };
//   }
// });

// ipcMain.handle('collection:create', async (_event, collection: CreateCollectionDTO) => {
//   try {
//     const result = await collectionsManager.createCollection(collection);
//     return { success: result };
//   } catch (e) {
//     console.error(`Falha ao criar coleção: ${e}`);
//     return { success: false, error: String(e) };
//   }
// });

// ipcMain.handle(
//   'collection:update-serie-background',
//   async (
//     _event,
//     collectionName: string,
//     serieId: number,
//     backgroundImage: string | null,
//   ) => {
//     try {
//       const normalizedImage: string | null =
//         await imageManager.uploadBackground(backgroundImage);

//       const result = await collectionsManager.updateSerieBackground(
//         collectionName,
//         serieId,
//         normalizedImage,
//       );

//       return { success: result };
//     } catch (e) {
//       return { success: false, error: String(e) };
//     }
//   },
// );

// ipcMain.handle('collection:delete', async (_event, collectionName: string) => {
//   try {
//     const result = await collectionsManager.removeCollection(collectionName);
//     return { success: result };
//   } catch (e) {
//     return { success: false, error: String(e) };
//   }
// });

// ipcMain.handle(
//   'collection:update',
//   async (
//     _event,
//     collectionName: string,
//     payload: Partial<Pick<Collection, 'description' | 'coverImage' | 'name'>>,
//   ) => {
//     try {
//       const result = await collectionsManager.updateCollectionInfo(
//         collectionName,
//         payload,
//       );

//       return { success: result };
//     } catch (e) {
//       return { success: false, error: String(e) };
//     }
//   },
// );

// ipcMain.handle(
//   'collection:remove-serie',
//   async (_event, collectionName: string, serieId: number) => {
//     return collectionsManager.removeInCollection(collectionName, serieId);
//   },
// );

// ipcMain.handle(
//   'collection:reorder-series',
//   async (_event, collectionName: string, orderedSeriesIds: number[]) => {
//     try {
//       const result = await collectionsManager.reorderCollectionSeries(
//         collectionName,
//         orderedSeriesIds,
//       );

//       return { success: result };
//     } catch (e) {
//       return { success: false, error: String(e) };
//     }
//   },
// );

// ipcMain.handle('collection:get-all-fav', async () => {
//   try {
//     const favCollection = await collectionsManager.getFavorites();

//     if (!favCollection) {
//       throw new Error(`Falha na requisição das séries favoritas!`);
//     }

//     return favCollection;
//   } catch (error) {
//     console.error(`erro em recuperar series favoritas: ${error}`);
//     throw error;
//   }
// });
