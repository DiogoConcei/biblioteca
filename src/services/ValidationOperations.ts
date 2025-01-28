import { FileSystem } from "./abstract/FileSystem";
import StorageManager from "./StorageManager";
import path from 'path'
import fse from 'fs-extra'

export default class ValidationOperations extends FileSystem {
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

    public async checkDownload(serieName: string, nextChapter_id: number): Promise<boolean> {
        try {
            const serieData = await this.storageOperations.selectSerieData(serieName)
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

