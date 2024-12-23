import { IpcMain } from "electron";
import FileOperations from "../services/FileOperations"
import StorageManager from "../services/StorageManager";

export default function seriesHandlers(ipcMain: IpcMain) {

    // Select ALL
    ipcMain.handle("get-series", async () => {
        const dataManager = new StorageManager();
        const fileManager = new FileOperations();

        try {
            const getData = await dataManager.selectData();

            const processData = await Promise.all(getData.map(async (serieData) => {
                const encodedImage = await fileManager.encodeImageToBase64(serieData.cover_image);
                return {
                    ...serieData,
                    cover_image: encodedImage,
                };
            }));

            return processData;
        } catch (error) {
            console.error("Erro ao buscar dados das séries:", error);
            throw error;
        }

    })

}
