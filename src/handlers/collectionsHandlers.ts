import { IpcMain } from "electron";
import { Literatures, NormalizedSerieData } from "../types/series.interfaces";
import CollectionsManager from "../services/CollectionsManager";
import StorageManager from "../services/StorageManager";

export default function collectionHandlers(ipcMain: IpcMain) {
    const collectionsOperations = new CollectionsManager()
    const storageOperations = new StorageManager()

    ipcMain.handle("get-collections", async () => {
        try {
            const collections = await collectionsOperations.getCollections()
            return collections
        } catch (e) {
            console.error(`Falha em recuperar todas as colecoes: ${e}`)
            throw e
        }
    })


    ipcMain.handle("create-collection", async (_event, collectionName: string) => {
        try {
            await collectionsOperations.createCollection(collectionName)
        } catch (e) {
            console.error(`Falha em criar nova colecao: ${e}`)
            throw e
        }
    })

    ipcMain.handle("serie-to-collection", async (_event, dataPath: string) => {
        try {
            const serieData = await storageOperations.readSerieData(dataPath)
            const normalizedData = await storageOperations.createNormalizedData(serieData)
            await collectionsOperations.serieToCollection(normalizedData)
        } catch (e) {
            console.error(`Falha em adicionar a colecao: ${e}`)
            throw e
        }
    })

    ipcMain.handle("get-fav-series", async () => {
        try {
            const allCollections = await collectionsOperations.getCollections()
            const favCollection = await collectionsOperations.getFavorites(allCollections)
            return favCollection
        } catch (error) {
            console.error(`erro em recuperar series favoritas: ${error}`)
            throw error
        }
    })

}





