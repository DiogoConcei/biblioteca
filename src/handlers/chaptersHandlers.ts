import { IpcMain } from "electron";
import FileManager from "../services/FileManager";
import MangaManager from "../services/MangaManager";
import StorageManager from "../services/StorageManager";
import ComicManager from "../services/ComicManager";

export default function chaptersHandlers(ipcMain: IpcMain) {
  const fileManager = new FileManager();
  const storageManager = new StorageManager();
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();

  ipcMain.handle(
    "get-chapter",
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);

        const LiteratureForm = fileManager.foundLiteratureForm(dataPath);

        switch (LiteratureForm) {
          case "Mangas":
            return await mangaManager.getChapter(dataPath, chapter_id);
            break;
          case "Comics":
            return await comicManager.getComic(dataPath, chapter_id);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Erro ao recuperar o capítulo: ${error}`);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "save-last-read",
    async (
      _event,
      serieName: string,
      chapter_id: number,
      page_number: number
    ) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath);
        const chapter = serieData.chapters.find((c) => c.id === chapter_id);

        if (chapter) {
          chapter.page.lastPageRead = page_number;
          serieData.readingData.lastChapterId = chapter_id;
        }

        await storageManager.updateSerieData(serieData);
      } catch (error) {
        console.error(`Erro ao salvar última página lida: ${error}`);
        throw error;
      }
    }
  );

  ipcMain.handle("acess-last-read", async (_event, dataPath: string) => {
    try {
      const serieData = await storageManager.readSerieData(dataPath);
      const lastChapterId = serieData.readingData.lastChapterId;
      const literatureForm = fileManager.foundLiteratureForm(dataPath);
      const lastChapter = serieData.chapters.find(
        (c) => c.id === lastChapterId
      );

      if (!lastChapter)
        throw new Error(
          `Último capítulo não encontrado para a série ${serieData.name}`
        );

      if (!lastChapter.isDownload) {
        switch (literatureForm) {
          case "Mangas":
            await mangaManager.createEditionById(
              serieData.dataPath,
              lastChapter.id
            );
            break;
          case "Comics":
            await comicManager.createEditionById(
              serieData.dataPath,
              lastChapterId
            );
            break;
          default:
            break;
        }
      }

      const url = `/${serieData.name}/${serieData.id}/${lastChapter.name}/${lastChapterId}/${lastChapter.page.lastPageRead}/${lastChapter.isRead}`;

      return url;
    } catch (error) {
      console.error(`Erro ao acessar último capítulo lido: ${error}`);
      throw error;
    }
  });

  ipcMain.handle(
    "get-next-chapter",
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath);
        const nextChapter = serieData.chapters.find(
          (chapter) => chapter.id === chapter_id + 1
        );

        if (!nextChapter || nextChapter.id >= serieData.totalChapters) {
          console.error(
            `Não há próximo capítulo para a série: ${serieData.name}, capítulo atual: ${chapter_id}`
          );
          return null;
        }

        const url = `/${serieData.name}/${serieData.id}/${nextChapter.name}/${nextChapter.id}/${nextChapter.page.lastPageRead}/${nextChapter.isRead}`;

        return url;
      } catch (error) {
        console.error(`Erro ao buscar próximo capítulo: ${error}`);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "get-prev-chapter",
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath);
        const prevChapter = serieData.chapters.find(
          (chapter) => chapter.id === chapter_id - 1
        );

        if (!prevChapter || prevChapter.id < 0) {
          console.error(
            `Não há capítulo anterior para a série: ${serieData.name}, capítulo atual: ${chapter_id}`
          );
          return null;
        }

        const url = `/${serieData.name}/${serieData.id}/${prevChapter.name}/${prevChapter.id}/${prevChapter.page.lastPageRead}/${prevChapter.isRead}`;

        return url;
      } catch (error) {
        console.error(`Erro ao buscar capítulo anterior: ${error}`);
        throw error;
      }
    }
  );
}
