import { IpcMain } from "electron";
import CollectionsOperations from "../services/CollectionsManager";
import { NormalizedSerieData } from "../types/series.interfaces";

export default function collectionHandlers(ipcMain: IpcMain) {
    const CollectionsManager = new CollectionsOperations()

    ipcMain.handle("create-collection", async (_event, collectionName: string) => {
        try {
            await CollectionsManager.createCollection(collectionName)
        } catch (e) {
            console.error(`Falha em criar nova colecao: ${e}`)
            throw e
        }
    })

    ipcMain.handle("add-to-collection", async (_event, serieData: NormalizedSerieData) => {
        try {
            await CollectionsManager.serieToCollection(serieData)
        } catch (e) {
            console.error(`Falha em adicionar a colecao: ${e}`)
            throw e
        }
    })

    // ipcMain.handle("get-fav-series", async () => {
    //     try {
    //         const allCollections = await CollectionsManager.getMangaCollections()
    //         const favCollection = await CollectionsManager.getFavorites(allCollections)
    //         return favCollection
    //     } catch (error) {
    //         console.error(`erro em recuperar series favoritas: ${error}`)
    //         throw error
    //     }
    // })


}





