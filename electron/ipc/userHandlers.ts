import { IpcMain } from "electron";

import StorageManager from "../services/StorageManager";
import FileManager from "../services/FileManager";

export default function userHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const fileManager = new FileManager();

  ipcMain.handle(
    "chapter:return-page",
    async (_event, dataPath: string, serieName?: string) => {
      try {
        const sDPath = serieName
          ? await fileManager.getDataPath(serieName)
          : dataPath;

        const serieData = await storageManager.readSerieData(sDPath);
        const serieLink = `/${serieData.literatureForm}/${serieData.name}/${serieData.id}`;

        return { success: true, data: serieLink };
      } catch (e) {
        console.error(
          `Falha em criar url de retorno para pagina individual: ${e}`
        );
        return { success: false, error: String(e) };
      }
    }
  );
}
