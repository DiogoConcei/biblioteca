import { IpcMain } from 'electron';
import HistoryManager from '../services/persistence/HistoryManager';
import ImageManager from '../services/processing/ImageManager';
import { APIResponse } from '../types/electron-auxiliar.interfaces';
import { SerieHistoryEntry } from '../types/history.interfaces';
import storageManager from '../services/StorageManager';

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

  ipcMain.handle(
    'history:add-to-history',
    async (_event, dataPath: string, chapterId: number): Promise<APIResponse<void>> => {
      try {
        const serieData = await storageManager.readSerieData(dataPath);

        if (!serieData) return { success: false };

        const opennedChapter = serieData.chapters.find((c) => c.id === chapterId);

        if (!opennedChapter) return { success: false };

        serieData.readingData.lastChapterId = opennedChapter.id;
        serieData.readingData.lastReadAt = new Date().toISOString();

        await historyManager.addToHistory(serieData);
        await storageManager.writeData(serieData);

        return { success: true };
      } catch (e) {
        console.error(`Erro em adicionar em recentes: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );
}
