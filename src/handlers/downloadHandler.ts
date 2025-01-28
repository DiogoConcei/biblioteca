import { IpcMain } from "electron";
import ImageOperations from "../services/ImageOperations";
import StorageManager from "../services/StorageManager";
import ValidationOperations from "../services/ValidationOperations";

export default function downloadHandlers(ipcMain: IpcMain) {
    const ImageManager = new ImageOperations()
    const StorageOperations = new StorageManager()
    const ValidationManager = new ValidationOperations()

    ipcMain.handle("download-chapter", async (_event, serieName: string, quantity: number) => {
        try {
            await ImageManager.createComic(serieName, quantity)
        } catch (error) {
            console.error(`erro em realizar o download: ${error}`)
            throw error
        }
    })

    ipcMain.handle("download-in-reading", async (_event, serieName: string, chapter_id: number) => {
        try {
            const nextChapter_id = chapter_id + 1
            let already_download = await ValidationManager.checkDownload(serieName, nextChapter_id)

            if (already_download) return

            const serieData = await StorageOperations.selectSerieData(serieName)
            const chapterData = serieData.chapters

            for (let chapters of chapterData) {
                if (chapters.id === nextChapter_id) {
                    await ImageManager.createComicById(serieName, nextChapter_id)
                }
            }

        } catch (error) {
            console.error(`Falha em baixar próximo capitulo: ${error}`)
            throw new error
        }
    })

    ipcMain.handle("download-individual", async (_event, serieName: string, chapter_id: number) => {
        try {
            let already_download = await ValidationManager.checkDownload(serieName, chapter_id)

            if (already_download) return

            const serieData = await StorageOperations.selectSerieData(serieName)
            const chapterData = serieData.chapters

            for (let chapters of chapterData) {
                if (chapters.id === chapter_id) {
                    await ImageManager.createComicById(serieName, chapter_id)
                }
            }

        } catch (error) {
            console.error(`Falha em baixar próximo capitulo: ${error}`)
            throw new error
        }
    })
}

