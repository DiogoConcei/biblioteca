import { IpcMain } from "electron";
import { SerieForm } from "../types/series.interfaces";
import StorageManager from "../services/StorageManager";
import MangaManager from "../services/MangaManager";
import BookManager from "../services/BookManager";
import ComicManager from "../services/ComicManager";
import ImageOperations from "../services/ImageManager";
import path from 'path'


export default function seriesHandlers(ipcMain: IpcMain) {
    const MangaOperations = new MangaManager()
    const ComicOperations = new ComicManager()
    const BookOperations = new BookManager()
    const StorageOperations = new StorageManager()
    const ImageManager = new ImageOperations()


    ipcMain.handle("create-serie", async (_event, serieData: SerieForm) => {
        try {
            switch (serieData.literatureForm) {
                case "Manga":
                    await MangaOperations.createManga(serieData)
                    break;
                case "Quadrinho":
                    await ComicOperations.createComic(serieData)
                    break;
                case "Livro":
                    await BookOperations.createBook(serieData)
                    break;
                default:
                    throw new Error("Tipo de literatura inválido");
            }
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

    ipcMain.handle("get-manga-series", async (_event, serieName: string) => {
        try {
            const data = await StorageOperations.selectMangaData(serieName)

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


    ipcMain.handle("get-comic-series", async (_event, serieName: string) => {
        try {
            const data = await StorageOperations.selectMangaData(serieName)

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
