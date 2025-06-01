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
      console.error(`Falha em criar nova colecao: ${e}`);
      throw e;
    }
  });

  ipcMain.handle('collection:get-all-fav', async () => {
    try {
      const allCollections = await collectionsOperations.getCollections();
      const collections = allCollections.data;

      if (!collections) {
        throw new Error('Nenhuma coleção encontrada.');
      }

      const favCollection = await collectionsOperations.getFavorites();
      return favCollection;
    } catch (error) {
      console.error(`erro em recuperar series favoritas: ${error}`);
      throw error;
    }
  });
}
