import { IpcMain } from "electron";
import FileOperations from "../services/FileOperations"
import StorageManager from "../services/StorageManager";
import ImageOperations from "../services/ImageOperations";
import path from 'path'

export default function uploadHandlers(ipcMain: IpcMain) {
    const FileManager = new FileOperations()
    const StorageOperations = new StorageManager()
    const ImageManager = new ImageOperations()

    ipcMain.handle("file:handleDrop", async (_event, filePaths: string[]) => {
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


    ipcMain.handle("create-serie", async (_event, filePaths: string[]) => {
        try {
            await StorageOperations.createData(filePaths);

            const filesName = await Promise.all(
                filePaths.map(async (file) => {
                    const fileName = path.basename(file);
                    return fileName;
                })
            );

            await ImageManager.extractInitialCovers(filesName);

            await new Promise((resolve) => {
                _event.sender.send("serie-created", { message: "Nova série criada com sucesso!" });
                resolve(null);
            });
        } catch (error) {
            console.error(`Erro ao criar a série: ${error}`);
            throw error;
        }

    })
}





