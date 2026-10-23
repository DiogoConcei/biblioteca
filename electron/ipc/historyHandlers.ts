import { IpcMain } from 'electron';
import HistoryManager from '../services/persistence/HistoryManager';
import ImageManager from '../services/processing/ImageManager';
import { APIResponse } from '../types/electron-auxiliar.interfaces';
import { SerieHistoryEntry } from '../types/history.interfaces';

export default function historyHandlers(ipcMain: IpcMain) {
  const historyManager = new HistoryManager();
  const imageManager = new ImageManager();

  ipcMain.handle(
    'history:get-recents',
    async (_event, limit: number = 5): Promise<APIResponse<SerieHistoryEntry[]>> => {
      try {
        const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 5;

        const recents = await historyManager.getRecents(safeLimit);
        const data = recents.map((s) => ({
          ...s,
          coverImage: imageManager.getMediaUrl(s.coverImage),
        }));
        return { success: true, data };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  );
}
