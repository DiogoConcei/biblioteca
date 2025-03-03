import { IpcMain } from "electron";
import { Manga } from "../types/manga.interfaces";
import { Comic } from "../types/comic.interfaces";
import { Book } from "../types/book.interfaces";
import { Literatures } from "../types/series.interfaces";
import UserManager from "../services/UserManager";
import StorageManager from "../services/StorageManager";
import FileManager from "../services/FileManager";
import CollectionsOperations from "../services/CollectionsManager";

export default function userHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const fileManager = new FileManager();
  const userManager = new UserManager();

  ipcMain.handle(
    "rating-serie",
    async (_event, dataPath: string, userRating: number) => {
      try {
        const serieData = await storageManager.readSerieData(dataPath);
        const updateData = await userManager.ratingSerie(serieData, userRating);
        storageManager.updateSerieData(updateData);
        return { success: true };
      } catch (e) {
        console.error(`Falha em ranquear serie: ${e}`);
        return { success: false };
      }
    }
  );

  ipcMain.handle("favorite-serie", async (_event, dataPath: string) => {
    try {
      const serieData = await storageManager.readSerieData(dataPath);
      await userManager.favoriteSerie(serieData);
      return { success: true };
    } catch (e) {
      console.error(`Erro em favoritar serie: ${e}`);
      return { success: false };
    }
  });

  ipcMain.handle(
    "mark-read",
    async (_event, dataPath: string, chapter_id: number, isRead: boolean) => {
      try {
        await userManager.markChapterRead(dataPath, chapter_id, isRead);
        return { success: true };
      } catch (error) {
        console.error(`Falha em marcar como lido: ${error}`);
        return { success: false };
      }
    }
  );

  ipcMain.handle("return-page", async (_event, serieName: string) => {
    try {
      const dataPath = await fileManager.getDataPath(serieName);
      const serieData = await storageManager.readSerieData(dataPath);
      return `/${serieData.literatureForm}/${serieData.name}/${serieData.id}`;
    } catch (e) {
      console.error(
        `Falha em criar url de retorno para pagina individual: ${e}`
      );
      throw e;
    }
  });
}
