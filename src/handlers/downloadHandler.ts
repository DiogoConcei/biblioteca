import { IpcMain } from "electron";
import FileManager from "../services/FileManager";
import StorageManager from "../services/StorageManager";
import ValidationManager from "../services/ValidationManager";
import MangaManager from "../services/MangaManager";
import ComicManager from "../services/ComicManager";

export default function downloadHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const validationManager = new ValidationManager();
  const fileManager = new FileManager();
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();

  ipcMain.handle(
    "multiple-download",
    async (_event, dataPath: string, quantity: number) => {
      try {
        await mangaManager.createEditions(dataPath, quantity);
        return true;
      } catch (e) {
        console.error("Falha em baixar multiplos capitulos");
        return false;
      }
    }
  );

  ipcMain.handle(
    "single-download",
    async (_event, dataPath: string, chapter_id: number) => {
      const literatureForm = fileManager.foundLiteratureForm(dataPath);
      const serieData = await storageManager.readSerieData(dataPath);
      const chapter = serieData.chapters.find((ch) => ch.id === chapter_id);

      if (!chapter) {
        throw new Error(`Capítulo com id ${chapter_id} não encontrado.`);
      }

      if (chapter.isDownload) {
        await storageManager.deleteSerieChapter(
          serieData,
          chapter,
          literatureForm
        );
        return true;
      }

      console.log(literatureForm);

      try {
        if (literatureForm === "Mangas") {
          await mangaManager.createEditionById(dataPath, chapter_id);
        } else if (literatureForm === "Comics") {
          await comicManager.createEditionById(dataPath, chapter_id);
        }

        return true;
      } catch (e) {
        console.error("Falha em baixar arquivo", e);
        return false;
      }
    }
  );

  // Download durante a leitura

  ipcMain.handle(
    "donwload-in-reading",
    async (_event, serieName: string, chapter_id: number) => {
      const dataPath = await fileManager.getDataPath(serieName);
      const serieData = await storageManager.readSerieData(dataPath);
      const literatureForm = fileManager.foundLiteratureForm(dataPath);

      const chapter = serieData.chapters.find((chap) => chap.id === chapter_id);

      if (await validationManager.checkDownload(serieData, chapter.id))
        return true;

      console.log(literatureForm);

      try {
        switch (literatureForm) {
          case "Mangas":
            await mangaManager.createEditionById(dataPath, chapter_id);
            break;
          case "Comics":
            await comicManager.createEditionById(dataPath, chapter_id);
          default:
            break;
        }

        return true;
      } catch (e) {
        console.error("Falha em baixar o proximo capitulo");
        return false;
      }
    }
  );

  ipcMain.handle(
    "check-download",
    async (_event, serieName: string, chapter_id: number) => {
      const dataPath = await fileManager.getDataPath(serieName);
      const serieData = await storageManager.readSerieData(dataPath);
      const chapter = serieData.chapters.find((chap) => chap.id === chapter_id);

      if (!chapter) {
        throw new Error(`Capítulo com id ${chapter_id} não foi encontrado.`);
      }

      try {
        const alreadyDownloaded = await validationManager.checkDownload(
          serieData,
          chapter_id
        );

        return alreadyDownloaded;
      } catch (e) {
        console.error(`falha em verificar existencia do capitulo: ${e}`);
        return false;
      }
    }
  );
}
