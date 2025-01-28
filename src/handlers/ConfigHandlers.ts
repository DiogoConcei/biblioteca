import { IpcMain } from "electron";
import SystemConfig from "../services/SystemConfig";


export default function ConfigHandlers(ipcMain: IpcMain) {
    const SystemOperations = new SystemConfig()

    ipcMain.handle("get-screen-config", async (_event, urlLocation: string) => {
        try {
            let isVisualizerActive = /^\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(
                urlLocation
            );
            const ScreenConfig = await SystemOperations.getFullScreenConfig()

            if (ScreenConfig && isVisualizerActive) {
                return true
            }

            return false
        } catch (error) {
            console.error(`Erro em recuperar as configurações de tela: ${error}`)
            throw error
        }
    })

    ipcMain.handle("control-full-screen", async (_event) => {
        try {
            const ScreenConfig = await SystemOperations.getFullScreenConfig()
            SystemOperations.setFullScreenConfig(!ScreenConfig)
            return ScreenConfig
        } catch (error) {
            console.error(`falha em atualizar estado da tela: ${error}`)
            throw error
        }
    })

    ipcMain.handle("get-theme-config", async (_event) => {
        try {
            const isLightMode = await SystemOperations.getThemeConfig()
            return isLightMode
        } catch (error) {
            console.error(`erro em recuperar configurações de exibição: ${error}`)
            throw error
        }
    })

    ipcMain.handle("switch-theme-color", async (_event) => {
        try {
            const isLightMode = await SystemOperations.getThemeConfig()
            SystemOperations.switchTheme(isLightMode)
            return !isLightMode
        } catch (error) {
            console.error(`erro em trocar as configurações de exibição: ${error}`)
            throw error
        }
    })
}