import { IpcMain } from "electron";
import StorageManager from "../services/StorageManager";
import MangaManager from "../services/MangaManager";
import ImageOperations from "../services/ImageOperations";
import path from 'path'


export default function seriesHandlers(ipcMain: IpcMain) {
    const ComicOperations = new MangaManager()
    const StorageOperations = new StorageManager()
    const ImageManager = new ImageOperations()


    ipcMain.handle("create-serie", async (_event, filePaths: string[]) => {
        try {
            // await ComicOperations.createManga(filePaths);

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


    ipcMain.handle("get-all-series", async () => {

        try {
            const getData = await StorageOperations.seriesData();

            const processData = await Promise.all(getData.map(async (serieData) => {
                const encodedImage = await ImageManager.encodeImageToBase64(serieData.cover_image);
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

    ipcMain.handle("get-serie", async (_event, serieName: string) => {
        try {
            const data = await StorageOperations.selectSerieData(serieName)

            const processedData = {
                ...data,
                cover_image: await ImageManager.encodeImageToBase64(data.cover_image),
            };

            return processedData
        } catch (error) {
            console.error("Erro ao buscar dados da series:", error);
            throw error;
        }
    })

}
