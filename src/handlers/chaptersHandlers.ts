import { IpcMain } from "electron";
import FileOperations from "../services/FileManager";
import ImageManager from "../services/ImageManager";
import MangaManager from "../services/MangaManager";
import StorageManager from "../services/StorageManager";

export default function chaptersHandlers(ipcMain: IpcMain) {
    const mangaOperations = new MangaManager();
    const imageOperations = new ImageManager()
    const storageOperations = new StorageManager();
    const fileOperations = new FileOperations()

    ipcMain.handle("get-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            const dataPath = await fileOperations.getDataPath(serieName)
            return await mangaOperations.getChapter(dataPath, chapter_id);
        } catch (error) {
            console.error(`Erro ao recuperar o capítulo: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("save-last-read", async (_event, serieName: string, chapter_id: number, page_number: number) => {
        try {
            const dataPath = await fileOperations.getDataPath(serieName)
            const serieData = await storageOperations.readSerieData(dataPath)
            const chapter = serieData.chapters.find((c) => c.id === chapter_id);

            if (chapter) {
                chapter.page.last_page_read = page_number;
                serieData.reading_data.last_chapter_id = chapter_id
            }
            await storageOperations.updateSerieData(serieData, dataPath);
        } catch (error) {
            console.error(`Erro ao salvar última página lida: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("acess-last-read", async (_event, dataPath: string) => {
        try {
            const serieData = await storageOperations.readSerieData(dataPath);
            const lastChapterId = serieData.reading_data.last_chapter_id;
            const lastChapter = serieData.chapters.find((c) => c.id === lastChapterId);

            if (!lastChapter) throw new Error(`Último capítulo não encontrado para a série ${serieData.name}`);

            if (lastChapter.is_dowload === false) {
                await imageOperations.createMangaEdtionById(serieData.data_path, lastChapter.id)
            }

            return `/${serieData.name}/${serieData.id}/${lastChapter.name}/${lastChapterId}/${lastChapter.page.last_page_read}`;
        } catch (error) {
            console.error(`Erro ao acessar último capítulo lido: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("get-next-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            const dataPath = await fileOperations.getDataPath(serieName)
            const serieData = await storageOperations.readSerieData(dataPath)
            const totalChapters = serieData.chapters.length;

            if (chapter_id + 1 >= totalChapters) {
                console.warn(`Não há próximo capítulo para a série: ${serieData.name}, capítulo atual: ${chapter_id}`);
                return null;
            }

            const nextChapterId = chapter_id + 1;
            const nextChapter = serieData.chapters.find((c) => c.id === nextChapterId);

            if (!nextChapter) {
                throw new Error(`Capítulo ${nextChapterId} não encontrado na série: ${serieData.name}`);
            }

            return `/${serieData.name}/${serieData.id}/${nextChapter.name}/${nextChapter.id}/${nextChapter.page.last_page_read}`;
        } catch (error) {
            console.error(`Erro ao buscar próximo capítulo: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("get-prev-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            const dataPath = await fileOperations.getDataPath(serieName)
            const serieData = await storageOperations.readSerieData(dataPath);

            const prevChapterId = chapter_id - 1;

            if (prevChapterId < 0) {
                console.warn(`Não há capítulo anterior para a série: ${serieData.name}, capítulo atual: ${chapter_id}`);
                return null;
            }

            const prevChapter = serieData.chapters.find((c) => c.id === prevChapterId);

            if (!prevChapter) {
                throw new Error(`Capítulo ${prevChapterId} não encontrado na série: ${serieData.name}`);
            }

            return `/${serieData.name}/${serieData.id}/${prevChapter.name}/${prevChapter.id}/${prevChapter.page.last_page_read}`;
        } catch (error) {
            console.error(`Erro ao buscar capítulo anterior: ${error}`);
            throw error;
        }
    });

}
