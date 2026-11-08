import { IpcMain } from 'electron';
import MetadataManager from '../services/content/MetadataManager';
import { APIResponse } from '../types/electron-auxiliar.interfaces';
import { ScrapedMetadata } from '../types/metadata.interfaces';

export default function metadataHandlers(ipcMain: IpcMain) {
  const metadataManager = new MetadataManager();

  ipcMain.handle(
    'metadata:fetch',
    async (
      _event,
      title: string,
      type: 'manga' | 'comic',
      year?: number,
      author?: string,
    ): Promise<APIResponse<ScrapedMetadata[] | null>> => {
      const data = await metadataManager.fetchTopMetadata({ title, type, year, author });

      return { success: data.length > 0, data };
    },
  );
}
