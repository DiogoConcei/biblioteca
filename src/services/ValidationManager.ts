import { FileSystem } from "./abstract/FileSystem";
import { Collection } from "../types/collections.interfaces";
import StorageManager from "./StorageManager";
import jsonfile from "jsonfile"
import path from 'path'
import fse from 'fs-extra'

export default class ValidationManager extends FileSystem {
    private readonly storageOperations: StorageManager = new StorageManager()

    constructor() {
        super()
    }

    public async serieExist(file: string): Promise<boolean> {
        const newSerieName = path.basename(file).toLocaleLowerCase()
        const seriesDir = await fse.readdir(this.seriesPath, { withFileTypes: true })
        const seriesName = seriesDir.map((seriesDir) => seriesDir.name.toLowerCase())


        for (let serieName of seriesName) {
            if (serieName === newSerieName) {
                return true
            }
        }

        return true
    }

    public async collectionExist(collectionName: string): Promise<boolean> {
        try {
            let collections: Collection[] = [];

            try {
                const data = await jsonfile.readFile(this.appCollections, "utf-8");
                collections = Array.isArray(data) ? data : [];
            } catch (readError) {
                collections = [];
            }

            if (collections.some((collection) => collection.name === collectionName)) {
                console.log("Coleção já existente. Abandonando criação.");
                console.log("passou no false")
                return false;
            }

            console.log("passou no true")
            return true;
        } catch (e) {
            console.log(`Falha em checar se a coleção existe: ${e}`);
            throw e;
        }
    }

    public async serieExistsInCollection(collectionName: string, serieId: number): Promise<boolean> {
        try {
            const collections: Collection[] = await jsonfile.readFile(this.appCollections, "utf-8");

            const collection = collections.find(c => c.name === collectionName);
            if (!collection) {
                console.warn(`Coleção "${collectionName}" não encontrada.`);
                return false;
            }

            return collection.series.some(serie => serie.id === serieId);
        } catch (error) {
            console.error(`Erro ao verificar se a série existe na coleção: ${error}`);
            throw error;
        }
    }




    public async checkDownload(serieName: string, nextChapter_id: number): Promise<boolean> {
        try {
            const serieData = await this.storageOperations.selectMangaData(serieName)
            const chaptersData = serieData.chapters

            if (chaptersData.length - 1 >= nextChapter_id) return false

            for (let chapters of chaptersData) {
                if (nextChapter_id === chapters.id) {
                    return chapters.is_dowload
                }
            }

        } catch (error) {
            console.error(`Falha em verificar o estado do proximo capitulo: ${error}`)
            throw new error
        }
        return
    }

}

