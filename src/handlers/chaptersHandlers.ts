import { IpcMain } from "electron";
import MangaManager from "../services/MangaManager";
import StorageManager from "../services/StorageManager";

export default function chaptersHandlers(ipcMain: IpcMain) {
    const MangaOperations = new MangaManager()
    const StorageOperations = new StorageManager()

    ipcMain.handle("get-chapter", async (_event, serieName: string, chapter_id: number) => {
        try {
            const chapter = await MangaOperations.getChapter(serieName, chapter_id)
            return chapter
        } catch (error) {
            console.error(`Erro ao recuperar o capitulo`)
            throw error
        }
    })

    ipcMain.handle("save-last-read", async (_event, serieName: string, chapter_id: number, page_number: number) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName)
            const chaptersData = serieData.chapters

            for (let chapters of chaptersData) {

                if (chapters.id === chapter_id) {
                    const last_chapter_id = chapter_id
                    chapters.last_page_read = page_number
                }

            }

            await StorageOperations.updateserieData(JSON.stringify(serieData), serieName)
        } catch (error) {
            console.error(`erro em salvar ultimo lido: ${error}`)
            throw error
        }
    })

    ipcMain.handle("acess-last-read", async (_event, serieName: string) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName)
            const chaptersData = serieData.chapters
            const book_name = serieData.name
            const book_id = serieData.id
            const last_chapter_id = serieData.reading_data.last_chapter_id
            let last_page

            for (let chapters of chaptersData) {

                if (chapters.id === last_chapter_id) {
                    last_page = chapters.last_page_read
                }
            }



            return `/${book_name}/${book_id}/chapter/${last_chapter_id}/${last_page}`
        } catch (error) {
            console.error(`erro em acessar ultimo capitulo lido: ${error}`)
            throw error
        }
    })

    ipcMain.handle("get-last-page", async (_event, serieName: string, chapter_id: number) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName)
            const chaptersData = serieData.chapters
            let last_page

            for (let chapters of chaptersData) {
                if (chapters.id === chapter_id) {
                    last_page = chapters.last_page_read
                }
            }

            return last_page
        } catch (error) {
            console.error(`erro em resgatar ultima página: ${error}`)
            throw error
        }
    })

    ipcMain.handle("mark-read", async (_event, serieName: string, chapter_id: number) => {
        try {
            const serieData = await StorageOperations.selectSerieData(serieName)
            const chaptersData = serieData.chapters

            for (let chapter of chaptersData) {
                if (chapter.id === chapter_id) {
                    chapter.is_read = true
                }
            }

            await StorageOperations.updateserieData(JSON.stringify(serieData), serieName)

        } catch (error) {

        }
    })
}



