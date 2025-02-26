import { IpcMain } from "electron";
import FileManager from "../services/FileManager";
import StorageManager from "../services/StorageManager";
import ValidationManager from "../services/ValidationManager";
import MangaManager from "../services/MangaManager";

export default function downloadHandlers(ipcMain: IpcMain) {
  const storageOperations = new StorageManager();
  const validationManager = new ValidationManager();
  const fileManager = new FileManager();
  const mangaManager = new MangaManager();

  ipcMain.handle(
    "download-chapter",
    async (_event, dataPath: string, quantity: number) => {
      try {
        await mangaManager.createEdition(dataPath, quantity);
        return { success: true };
      } catch (error) {
        console.error(`erro em realizar o download: ${error}`);
        return { success: false };
      }
    }
  );

  ipcMain.handle(
    "download-in-reading",
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageOperations.readSerieData(dataPath);

        const nextChapter_id = chapter_id + 1;
        let already_download = await validationManager.checkDownload(
          serieData,
          nextChapter_id
        );

        if (already_download) return;

        const chapterData = serieData.chapters;

        for (let chapters of chapterData) {
          if (chapters.id === nextChapter_id) {
            await mangaManager.createEditionById(
              serieData.dataPath,
              nextChapter_id
            );
          }
        }
      } catch (e) {
        console.error(`Falha em baixar próximo capitulo: ${e}`);
        throw e;
      }
    }
  );

  ipcMain.handle(
    "download-individual",
    async (_event, dataPath: string, chapter_id: number) => {
      try {
        const serieData = await storageOperations.readSerieData(dataPath);
        const chapter = serieData.chapters.find(
          (chap) => chap.id === chapter_id
        );

        if (!chapter) {
          throw new Error(`Capítulo com id ${chapter_id} não foi encontrado.`);
        }

        const alreadyDownloaded = await validationManager.checkDownload(
          serieData,
          chapter_id
        );

        if (alreadyDownloaded) {
          await mangaManager.deleteMangaEditionById(dataPath, chapter_id);
        } else {
          await mangaManager.createEditionById(dataPath, chapter_id);
        }

        return { success: true };
      } catch (error) {
        console.error(`Falha em baixar  capítulo: ${error}`);
        return { success: false };
      }
    }
  );

  ipcMain.handle(
    "check-download",
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageOperations.readSerieData(dataPath);
        const chapter = serieData.chapters.find(
          (chap) => chap.id === chapter_id
        );

        if (!chapter) {
          throw new Error(`Capítulo com id ${chapter_id} não foi encontrado.`);
        }

        const alreadyDownloaded = await validationManager.checkDownload(
          serieData,
          chapter_id
        );

        return alreadyDownloaded;
      } catch (e) {
        console.error(`falha em verificar existencia do capitulo: ${e}`);
        throw e;
      }
    }
  );
}
