import { IpcMain } from 'electron';

import CollectionsManager from '../services/CollectionManager';

export default function collectionHandlers(ipcMain: IpcMain) {
  const collectionsOperations = new CollectionsManager();

  ipcMain.handle('collection:get-all', async () => {
    try {
      const collections = await collectionsOperations.getCollections();

      if (!collections) {
        throw new Error('Falha em recuperar as colecoes');
      }

      return { success: true, data: collections };
    } catch (e) {
      console.error(`Falha em recuperar todas as colecoes: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'collection:create',
    async (_event, collectionName: string) => {
      try {
        await collectionsOperations.quicklyCreate(collectionName);
      } catch (e) {
        throw e;
      }
    },
  );

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
