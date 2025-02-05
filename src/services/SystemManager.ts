import { FileSystem } from "./abstract/FileSystem";
import fse from "fs-extra"
import { AppConfig } from "../types/series.interfaces";

export default class SystemConfig extends FileSystem {

    constructor() {
        super()
    }

    public async getFullScreenConfig(): Promise<boolean> {
        try {
            let data: AppConfig = JSON.parse(await fse.readFile(this.comicConfig, "utf-8"));
            return data.config.settings.full_screen
        } catch (error) {
            console.error(`Erro em recuperar configurações: ${error}`)
            throw error
        }
    }

    public async getThemeConfig(): Promise<boolean> {
        try {
            let data: AppConfig = JSON.parse(await fse.readFile(this.comicConfig, "utf-8"));
            return data.config.settings.ligth_mode
        } catch (error) {
            console.error(`Erro em recuperar configurações: ${error}`)
            throw error
        }
    }

    public async switchTheme(colorTheme: boolean): Promise<void> {
        try {
            let data: AppConfig = JSON.parse(await fse.readFile(this.comicConfig, "utf-8"));
            data.config.settings.ligth_mode = !colorTheme
            await fse.writeFile(this.comicConfig, JSON.stringify(data), "utf-8")
        } catch (error) {
            console.error(`Erro em atualizar modelo de tela: ${error}`)
            throw error
        }
    }

    public async setFullScreenConfig(isFullScreen: boolean): Promise<void> {
        try {
            let data: AppConfig = JSON.parse(await fse.readFile(this.comicConfig, "utf-8"));
            data.config.settings.full_screen = isFullScreen
            await fse.writeFile(this.comicConfig, JSON.stringify(data), "utf-8")
        } catch (error) {
            console.error(`Erro em atualizar modelo de tela: ${error}`)
            throw error
        }
    }

    public async getMangaId(): Promise<number> {
        try {
            let data: AppConfig = JSON.parse(await fse.readFile(this.comicConfig, "utf-8"));
            return data.metadata.global_id
        } catch (e) {
            console.error(`Erro ao obter o ID atual: ${e}`);
            throw e;
        }
    }

    public async setMangaId(currentId: number): Promise<number> {
        try {
            let data: AppConfig = JSON.parse(await fse.readFile(this.configFilePath, "utf-8"));
            data.metadata.global_id = currentId
            await fse.writeFile(this.configFilePath, JSON.stringify(data), "utf-8")
            return currentId;
        } catch (e) {
            console.error(`Erro ao obter o ID atual: ${e}`);
            throw e;
        }
    }

}


