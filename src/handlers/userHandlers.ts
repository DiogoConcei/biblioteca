import { IpcMain } from "electron";
import { Manga } from "../types/manga.interfaces";
import { Comic } from "../types/comic.interfaces";
import { Book } from "../types/book.interfaces";
import { Literatures } from "../types/series.interfaces";
import UserManager from "../services/UserManager";
import StorageManager from "../services/StorageManager";
import CollectionsOperations from "../services/CollectionsManager";

export default function userHandlers(ipcMain: IpcMain) {
    const StorageOperations = new StorageManager()
    const UserOperations = new UserManager()

    ipcMain.handle("rating-serie", async (_event, serieData: Literatures, userRating: string) => {
        try {
            const updateData = await UserOperations.ratingSerie(serieData, userRating)
            this.StorageOperations.updateSerieData(updateData, serieData.data_path);
            return { success: true };
        } catch (e) {
            console.error(`Falha em ranquear serie: ${e}`)
            return { success: false };
        }
    })

    ipcMain.handle("favorite-serie", async (_event, data_path: string) => {
        try {
            const serieData = await StorageOperations.readSerieData(data_path)
            await UserOperations.favoriteSerie(serieData)
            return { success: true };
        } catch (e) {
            console.error(`Erro em favoritar serie: ${e}`)
            return { success: false };
        }
    });

    ipcMain.handle("mark-read", async (_event, serieData: Literatures, chapter_id: number) => {
        try {
            const chapter = serieData.chapters.find((c) => c.id === chapter_id);

            if (chapter) chapter.is_read = true;

            await StorageOperations.updateSerieData(serieData, serieData.data_path);
        } catch (error) {
            console.error(`Erro ao marcar capítulo como lido: ${error}`);
            throw error;
        }
    });
}

