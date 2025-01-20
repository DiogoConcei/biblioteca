import { IpcMain } from "electron";
import StorageManager from "../services/StorageManager";

export default function contextMenuHandlers(ipcMain: IpcMain) {
    const storageManager = new StorageManager();

    ipcMain.handle("context-menu-excluir", async (_event, itemName: string) => {
        try {
        } catch (error) {
            console.error(`Erro ao excluir o item: ${itemName}`, error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle("context-menu-deletar", async (_event, itemName: string) => {
        try {
        } catch (error) {
            console.error(`Erro ao deletar permanentemente o item: ${itemName}`, error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle("context-menu-renomear", async (_event, oldName: string, newName: string) => {
        try {
        } catch (error) {
            console.error(`Erro ao renomear o item de "${oldName}" para "${newName}"`, error);
            return { success: false, error: error.message };
        }
    });
}
