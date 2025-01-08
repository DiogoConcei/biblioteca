import { IpcMain } from "electron";
import FileOperations from "../services/FileOperations"
import StorageManager from "../services/StorageManager";
import ComicManager from "../services/ComicManager";
import ImageOperations from "../services/ImageOperations";
import path from 'path'


export default function seriesHandlers(ipcMain: IpcMain) {
    const FileManager = new FileOperations()
    const ComicOperations = new ComicManager()
    const StorageOperations = new StorageManager()
    const ImageManager = new ImageOperations()


    ipcMain.handle("create-serie", async (_event, filePaths: string[]) => {
        try {
            await ComicOperations.createComic(filePaths);

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
                const encodedImage = await FileManager.encodeImageToBase64(serieData.cover_image);
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

    ipcMain.handle("download-chapter", async (_event, seriePath: string, quantity: number) => {
        try {
            await ImageManager.extractChapters(seriePath, quantity)
        } catch (error) {
            console.error(`erro em realizar o download: ${error}`)
            throw error
        }
    })

    ipcMain.handle("favorite-serie", async (_event, serieName: string) => {
        try {
            const serie = await StorageOperations.selectSerieData(serieName);

            if (!serie) {
                throw new Error(`Série com o nome "${serieName}" não encontrada.`);
            }

            const collections = await ComicOperations.getCollections();
            const favCollection = collections.collections.find((collection) => collection.name === "Favorites");

            if (!favCollection) {
                throw new Error('Coleção de favoritos não encontrada.');
            }

            const favSerieJson = {
                id: serie.id,
                name: serie.name,
                cover_image: serie.cover_image,
                comic_path: serie.serie_path,
                total_chapters: serie.total_chapters,
                status: serie.metadata.status,
                recommended_by: serie.metadata.recommended_by || "",
                original_owner: serie.metadata.original_owner || "",
                rating: serie.metadata.rating || 0
            };

            const newFavoriteStatus = !serie.metadata.is_favorite;

            const serieExists = favCollection.comics.some((series) => series.name === serieName);

            if (newFavoriteStatus && !serieExists) {
                favCollection.comics.push(favSerieJson);
            } else if (!newFavoriteStatus) {
                favCollection.comics = favCollection.comics.filter((series) => series.name !== serieName);
            }


            serie.metadata.is_favorite = newFavoriteStatus;

            await StorageOperations.updateserieData(JSON.stringify(serie), serieName);
            await StorageOperations.updateFavCollection(JSON.stringify(collections));

            return { success: true };
        } catch (error) {
            console.error(`Erro ao atualizar coleção de favoritos: ${error}`);
            return { success: false };
        }
    });

    ipcMain.handle("rating-serie", async (_event, serieName: string, userRating: string) => {
        const serie = await StorageOperations.selectSerieData(serieName)

        if (!serie) {
            throw new Error(`Série com o nome "${serieName}" não encontrada.`);
        }

        const starsRating = [
            "1 - Péssimo",
            "2 - Horrível",
            "3 - Regular",
            "4 - Bom",
            "5 - Excelente",
        ];

        let caseIndex = starsRating.indexOf(userRating)

        switch (caseIndex) {
            case 0:
                serie.metadata.rating = 1
                break
            case 1:
                serie.metadata.rating = 2
                break
            case 2:
                serie.metadata.rating = 3
                break
            case 3:
                serie.metadata.rating = 4
                break
            case 4:
                serie.metadata.rating = 5
                break
        }

        await StorageOperations.updateserieData(JSON.stringify(serie), serieName);
    })


    ipcMain.handle("get-serie", async (_event, serieName: string) => {
        try {
            const data = await StorageOperations.selectSerieData(serieName)

            const processedData = {
                ...data,
                cover_image: await FileManager.encodeImageToBase64(data.cover_image),
            };

            return processedData
        } catch (error) {
            console.error("Erro ao buscar dados da series:", error);
            throw error;
        }
    })

    ipcMain.handle("get-favSeries", async () => {
        try {
            const collections = await ComicOperations.getCollections();
            const findCollection = collections.collections.find((collection) => collection.name === "Favorites");
            const favCollection = findCollection.comics
            return favCollection
        } catch (error) {
            console.error(`erro em recuperar series favoritas: ${error}`)
            throw error
        }
    })
}
