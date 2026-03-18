import { ipcMain } from 'electron';

import uploadHandlers from './uploadHandlers.ts';
import seriesHandlers from './seriesHandlers.ts';
import collectionHandlers from './collectionHandlers.ts';
import downloadHandlers from './downloadHandlers.ts';
import userHandlers from './userHandlers.ts';
import chaptersHandlers from './chaptersHandlers.ts';
import systemHandlers from './systemHandlers.ts';
import MetadataScraperService from '../services/MetadataManager';

export function registerHandlers() {
  const metadataScraper = new MetadataScraperService();

  uploadHandlers(ipcMain);
  seriesHandlers(ipcMain);
  collectionHandlers(ipcMain);
  userHandlers(ipcMain);
  chaptersHandlers(ipcMain);
  downloadHandlers(ipcMain);
  systemHandlers(ipcMain);

  ipcMain.handle('metadata:fetch', async (_event, input) => {
    try {
      const data = await metadataScraper.fetchMetadata(input);
      return { success: true, data };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}
