import { FileSystem } from "./abstract/FileSystem";
import { Collection } from "../types/collections.interfaces";
import StorageManager from "./StorageManager";
import jsonfile from "jsonfile"
import path from 'path'
import fse from 'fs-extra'
import FileManager from "./FileManager";
import { Literatures } from "../types/series.interfaces";
import ImageManager from "./ImageManager";

export default class ValidationManager extends FileSystem {
    private readonly storageManager: StorageManager = new StorageManager()
    private readonly fileManager: FileManager = new FileManager()
    private readonly imageManager: ImageManager = new ImageManager()

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

    public async checkDownload(serieData: Literatures, chapter_id: number): Promise<boolean> {
        try {
            const chaptersData = serieData.chapters

            if (chapter_id > chaptersData.length) return

            for (let chapters of chaptersData) {
                if (chapter_id === chapters.id) {
                    return chapters.is_dowload
                }
            }

        } catch (error) {
            console.error(`Falha em verificar o estado do proximo capitulo: ${error}`)
            throw error
        }
        return
    }

}

// (async () => {
//     try {
//         const MangaOperations = new StorageManager();
//         const imageOperations = new ImageManager()
//         const validationManager = new ValidationManager()
//         const serieData = await MangaOperations.readSerieData("C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\data store\\json files\\Mangas\\Dr. Stone.json")

//         const already_download = await validationManager.checkDownload(serieData, 3)

//         if (already_download) return

//         await imageOperations.createMangaEdtionById(serieData.data_path, 3)

//     } catch (error) {
//         console.error('Erro ao executar a função:', error);
//     }
// })();
