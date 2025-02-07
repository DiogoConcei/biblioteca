import { IpcMain } from "electron";
import ImageOperations from "../services/ImageManager";
import FileManager from "../services/FileManager";
import StorageManager from "../services/StorageManager";
import ValidationOperations from "../services/ValidationManager";

export default function downloadHandlers(ipcMain: IpcMain) {
    const imageOperations = new ImageOperations()
    const storageOperations = new StorageManager()
    const validationManager = new ValidationOperations()
    const fileManager = new FileManager()

    ipcMain.handle("download-chapter", async (_event, serieName: string, quantity: number) => {
        try {
            await imageOperations.createMangaEdtion(serieName, quantity)
        } catch (error) {
            console.error(`erro em realizar o download: ${error}`)
            throw error
        }
    })

    ipcMain.handle("download-in-reading", async (_event, serieName: string, chapter_id: number) => {
        try {
            const dataPath = await fileManager.getDataPath(serieName)
            const serieData = await storageOperations.readSerieData(dataPath)

            const nextChapter_id = chapter_id + 1
            let already_download = await validationManager.checkDownload(serieData, nextChapter_id)

            if (already_download) return
            console.log(dataPath)

            const chapterData = serieData.chapters

            console.log(dataPath)
            for (let chapters of chapterData) {
                if (chapters.id === nextChapter_id) {
                    await imageOperations.createMangaEdtionById(serieData.data_path, nextChapter_id)
                }
            }

            console.log(dataPath)
        } catch (e) {
            console.error(`Falha em baixar próximo capitulo: ${e}`)
            throw e
        }
    })

    ipcMain.handle("download-individual", async (_event, serieName: string, chapter_id: number) => {
        try {
            const dataPath = await fileManager.getDataPath(serieName)
            const serieData = await storageOperations.readSerieData(dataPath)

            const already_download = await validationManager.checkDownload(serieData, chapter_id)

            if (already_download) return

            await imageOperations.createMangaEdtionById(dataPath, chapter_id)

        } catch (error) {
            console.error(`Falha em baixar próximo capitulo: ${error}`)
            throw error
        }
    })
}

