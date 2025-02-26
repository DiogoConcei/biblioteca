import FileSystem from "./abstract/FileSystem";
import { Collection } from "../types/collections.interfaces";
import StorageManager from "./StorageManager";
import jsonfile from "jsonfile"
import path from 'path'
import fs from 'fs-extra'
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
        const seriesDir = await fs.readdir(this.basePath, { withFileTypes: true })
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
                return false;
            }

            return true;
        } catch (e) {
            console.error(`Falha em checar se a coleção existe: ${e}`);
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
                    return chapters.isDownload
                }
            }

        } catch (error) {
            console.error(`Falha em verificar o estado do proximo capitulo: ${error}`)
            throw error
        }
        return
    }

    public async isDinamicImage(imagePath: string): Promise<boolean> {
        try {
            if (await this.isWebp(imagePath)) return false

            const dinamicDir = path.join(this.imagesFilesPath, "DinamicImages")
            const content = (await fs.readdir(dinamicDir, { withFileTypes: true })).map((contentPath) => path.join(dinamicDir, contentPath.name))
            const findImage = content.find((contentPath) => path.basename(contentPath) === path.basename(imagePath))

            if (fs.existsSync(findImage)) {
                return false
            }

            return true
        } catch (e) {
            console.error(`Falha em verificar se é uma imagem dinamica: ${e}`)
            throw e
        }
    }

    public async isWebp(imagePath: string): Promise<boolean> {
        try {
            const extName = path.extname(imagePath).toLowerCase()

            if (extName == ".webp") {
                return true
            }

            return false
        } catch (e) {
            console.error(`Falha em checar extensão da imagem`)
            throw e
        }
    }

}

// (async () => {
//     try {
//         const validationManager = new ValidationManager()
//         const teste = "C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\data store\\images files\\showCaseImages\\Spidey Cover.jpg"
//         console.log(await validationManager.isWebp(teste))
//         console.log(await validationManager.isDinamicImage(teste))
//     } catch (error) {
//         console.error('Erro ao executar a função:', error);
//     }
// })();
