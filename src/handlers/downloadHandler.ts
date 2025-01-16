import { IpcMain } from "electron";
import ImageOperations from "../services/ImageOperations";

export default function downloadHandlers(ipcMain: IpcMain) {
    const ImageManager = new ImageOperations()

    ipcMain.handle("download-chapter", async (_event, serieName: string, quantity: number) => {
        try {
            await ImageManager.createComicImages(serieName, quantity)
        } catch (error) {
            console.error(`erro em realizar o download: ${error}`)
            throw error
        }
    })
}

