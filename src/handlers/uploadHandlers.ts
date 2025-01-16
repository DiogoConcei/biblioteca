import { IpcMain } from "electron";
import FileOperations from "../services/FileOperations"

export default function uploadHandlers(ipcMain: IpcMain) {
    const FileManager = new FileOperations()

    ipcMain.handle("localUpload", async (_event, filePaths: string[]) => {
        if (!filePaths || filePaths.length === 0) {
            console.error("Nenhum arquivo fornecido para upload.");
            throw new Error("Nenhum arquivo fornecido.");
        }

        try {
            const newPaths = await Promise.all(
                filePaths.map(async (file) => {
                    try {
                        return await FileManager.localUpload(file);
                    } catch (error) {
                        console.error(`Erro ao fazer upload de ${file}: ${error}`);
                        throw error;
                    }
                })
            );
            return newPaths;
        } catch (error) {
            console.error(`Erro ao processar os caminhos: ${error}`);
            throw error;
        }
    });

}





