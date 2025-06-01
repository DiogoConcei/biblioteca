import { IpcMain } from 'electron';

import StorageManager from '../services/StorageManager';
import FileManager from '../services/FileManager';

export default function userHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const fileManager = new FileManager();

  ipcMain.handle('return-page', async (_event, serieName: string) => {
    try {
      const dataPath = await fileManager.getDataPath(serieName);

      if (!dataPath) {
        throw new Error('Data path not found for the given serie name.');
      }

      const serieData = await storageManager.readSerieData(dataPath);
      const serieLink = `/${serieData.literatureForm}/${serieData.name}/${serieData.id}`;

      return { success: true, data: serieLink };
    } catch (e) {
      console.error(`Falha em criar url de retorno para pagina individual: ${e}`);
      return { success: false, error: String(e) };
    }
  });
}
