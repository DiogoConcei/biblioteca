import { ComicCollection } from "../types/collections.interfaces";
import { FileSystem } from "./abstract/FileSystem";
import jsonfile from "jsonfile"

export default class CollectionsOperations extends FileSystem {

    constructor() {
        super()
    }

    public async getCollections(): Promise<ComicCollection> {
        try {
            const dataCollections: ComicCollection = await jsonfile.readFile(this.comicCollections);
            return dataCollections
        } catch (error) {
            console.error(`erro em recuperar a coleção de series favoritas: ${error}`)
            return undefined
        }
    }
}