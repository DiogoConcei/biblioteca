import { IpcMain } from "electron";
import FileOperations from "../services/FileOperations"
import StorageManager from "../services/StorageManager";
import ImageOperations from "../services/ImageOperations";
import path from 'path'


export default function seriesHandlers(ipcMain: IpcMain) {
    const fileManager = new FileOperations()
    const dataManager = new StorageManager()
    const ImageManager = new ImageOperations()


    ipcMain.handle("create-serie", async (_event, filePaths: string[]) => {
        try {
            await dataManager.createData(filePaths);

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
            const getData = await dataManager.seriesData();

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

    ipcMain.handle("donwload-chapter", async (_event, seriePath: string, quantity: number) => {
        try {
            await ImageManager.extractChapters(seriePath, quantity)
        } catch (error) {
            console.error(`erro em realizar o download: ${error}`)
            throw error
        }
    })

    ipcMain.handle("favorite-serie", async (_event, serieName: string, is_favorite: boolean) => {
        try {
            const serie = await dataManager.selectSerieData(serieName);

            if (!serie) {
                throw new Error(`Série com o nome "${serieName}" não encontrada.`);
            }

            const comicConfig = await dataManager.getComicConfig();

            serie.metadata.is_favorite = !is_favorite;

            if (serie.metadata.is_favorite) {
                comicConfig.favorites.push(serie);
            } else {
                comicConfig.favorites = comicConfig.favorites.filter((series) => series.name !== serieName);
            }

            await dataManager.updateserieData(JSON.stringify(serie), serieName);
            await dataManager.updateComicConfig(JSON.stringify(comicConfig));

            return { success: true };
        } catch (error) {
            console.error(`Erro ao favoritar série "${serieName}":`, error);
            throw new Error("Não foi possível atualizar o status de favorito da série.");
        }
    });


    ipcMain.handle("get-serie", async (_event, serieName: string) => {
        try {
            const data = await dataManager.selectSerieData(serieName)

            const processedData = {
                ...data,
                cover_image: await fileManager.encodeImageToBase64(data.cover_image),
            };

            return processedData
        } catch (error) {
            console.error("Erro ao buscar dados da series:", error);
            throw error;
        }
    })
}
