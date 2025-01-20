import { IpcMain } from "electron";
import MangaManager from "../services/MangaManager";
import StorageManager from "../services/StorageManager";

export default function chaptersHandlers(ipcMain: IpcMain) {
    const MangaOperations = new MangaManager();
    const StorageOperations = new StorageManager();

    ipcMain.handle("get-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            return await MangaOperations.getChapter(serieName, chapter_id);
        } catch (error) {
            console.error(`Erro ao recuperar o capítulo: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("save-last-read", async (_event, serieName: string, chapter_id: number, page_number: number) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName);
            const chapter = serieData.chapters.find((c) => c.id === chapter_id);
            if (chapter) {
                chapter.last_page_read = page_number;
                serieData.reading_data.last_chapter_id = chapter_id
            }
            await StorageOperations.updateserieData(JSON.stringify(serieData), serieName);
        } catch (error) {
            console.error(`Erro ao salvar última página lida: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("acess-last-read", async (_event, serieName: string) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName);
            const lastChapterId = serieData.reading_data.last_chapter_id;
            const lastChapter = serieData.chapters.find((c) => c.id === lastChapterId);

            if (!lastChapter) throw new Error(`Último capítulo não encontrado para a série ${serieName}`);

            return `/${serieData.name}/${serieData.id}/${lastChapter.name}/${lastChapterId}/${lastChapter.last_page_read}`;
        } catch (error) {
            console.error(`Erro ao acessar último capítulo lido: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("get-next-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName);
            const totalChapters = serieData.chapters.length;

            if (chapter_id + 1 >= totalChapters) {
                console.warn(`Não há próximo capítulo para a série: ${serieName}, capítulo atual: ${chapter_id}`);
                return null;
            }

            const nextChapterId = chapter_id + 1;
            const nextChapter = serieData.chapters.find((c) => c.id === nextChapterId);

            if (!nextChapter) {
                throw new Error(`Capítulo ${nextChapterId} não encontrado na série: ${serieName}`);
            }

            return `/${serieData.name}/${serieData.id}/${nextChapter.name}/${nextChapter.id}/${nextChapter.last_page_read}`;
        } catch (error) {
            console.error(`Erro ao buscar próximo capítulo: ${error}`);
            throw error;
        }
    });

    ipcMain.handle("get-prev-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName);

            const prevChapterId = chapter_id - 1;

            if (prevChapterId < 0) {
                console.warn(`Não há capítulo anterior para a série: ${serieName}, capítulo atual: ${chapter_id}`);
                return null;
            }

            const prevChapter = serieData.chapters.find((c) => c.id === prevChapterId);

            if (!prevChapter) {
                throw new Error(`Capítulo ${prevChapterId} não encontrado na série: ${serieName}`);
            }

            console.log(prevChapter.id)
            return `/${serieData.name}/${serieData.id}/${prevChapter.name}/${prevChapter.id}/${prevChapter.last_page_read}`;
        } catch (error) {
            console.error(`Erro ao buscar capítulo anterior: ${error}`);
            throw error;
        }
    });

}
