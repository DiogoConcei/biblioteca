import { IpcMain } from "electron";
import CollectionsOperations from "../services/CollectionsOperations";

export default function collectionHandlers(ipcMain: IpcMain) {
    const CollectionsManager = new CollectionsOperations()

    ipcMain.handle("get-favSeries", async () => {
        try {
            const collections = await CollectionsManager.getCollections();
            const findCollection = collections.collections.find((collection) => collection.name === "Favorites");
            const favCollection = findCollection.comics
            return favCollection
        } catch (error) {
            console.error(`erro em recuperar series favoritas: ${error}`)
            throw error
        }
    })

}





