import { IpcMain } from 'electron';

import CollectionsManager from '../services/CollectionsManager';

export default function collectionHandlers(ipcMain: IpcMain) {
  const collectionsOperations = new CollectionsManager();

  ipcMain.handle('collection:get-all', async () => {
    try {
      const collections = await collectionsOperations.getCollections();
      return collections;
    } catch (e) {
      console.error(`Falha em recuperar todas as colecoes: ${e}`);
      throw e;
    }
  });

  ipcMain.handle('collection:create', async (_event, collectionName: string) => {
    try {
      await collectionsOperations.createCollection(collectionName);
    } catch (e) {
      throw e;
    }
  });

  ipcMain.handle('collection:get-all-fav', async () => {
    try {
      const response = await collectionsOperations.getFavorites();

      if (!response.success || !response.data) {
        throw new Error(`Falha na requisição das séries favoritas!`);
      }

      const favCollection = response.data;
      return favCollection;
    } catch (error) {
      console.error(`erro em recuperar series favoritas: ${error}`);
      throw error;
    }
  });
}
