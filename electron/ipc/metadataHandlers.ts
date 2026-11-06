import { IpcMain } from 'electron';
import MetadataScrapperService from '../services/content/MetadataManager';

export default function metadataHandlers(ipcMain: IpcMain) {
  // const metadataScraper = new MetadataScraperService();
  // ipcMain.handle('metadata:fetch', async (_event, input) => {
  //   try {
  //     const data = await metadataScraper.fetchMetadata(input);
  //     return { success: true, data };
  //   } catch (e) {
  //     return { success: false, error: String(e) };
  //   }
  // });
}
