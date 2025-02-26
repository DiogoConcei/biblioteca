import { IpcMain } from "electron";
import { SerieForm } from "../types/series.interfaces";
import StorageManager from "../services/StorageManager";
import MangaManager from "../services/MangaManager";
import BookManager from "../services/BookManager";
import ComicManager from "../services/ComicManager";
import ImageManager from "../services/ImageManager";

export default function seriesHandlers(ipcMain: IpcMain) {
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();
  const bookManager = new BookManager();
  const storageManager = new StorageManager();
  const imageManager = new ImageManager();
  ipcMain.removeHandler("create-serie");

  ipcMain.handle("create-serie", async (_event, serieData: SerieForm) => {
    try {
      switch (serieData.literatureForm) {
        case "Manga":
          await mangaManager.createMangaSerie(serieData);
          break;
        case "Quadrinho":
          await comicManager.createComicSerie(serieData);
          break;
        case "Livro":
          await bookManager.createBook(serieData);
          break;
        default:
          throw new Error("Tipo de literatura inválido");
      }
    } catch (error) {
      console.error(`Erro ao criar a série: ${error}`);
      throw error;
    }
  });

  ipcMain.handle("get-all-series", async () => {
    try {
      const getData = await storageManager.seriesData();

      const processData = await Promise.all(
        getData.map(async (serieData) => {
          const encodedImage = await imageManager.encodeImageToBase64(
            serieData.coverImage
          );

          return {
            ...serieData,
            coverImage: encodedImage,
          };
        })
      );

      return processData;
    } catch (error) {
      console.error("Erro ao buscar dados das séries:", error);
      throw error;
    }
  });

  ipcMain.handle("get-manga-serie", async (_event, serieName: string) => {
    try {
      const data = await storageManager.selectMangaData(serieName);

      const processedData = {
        ...data,
        coverImage: await imageManager.encodeImageToBase64(data.coverImage),
      };

      return processedData;
    } catch (error) {
      console.error("Erro ao buscar dados da series:", error);
      throw error;
    }
  });

  ipcMain.handle("get-comic-serie", async (_event, serieName: string) => {
    try {
      const data = await storageManager.selectComicData(serieName);

      const updatedChapters = await Promise.all(
        data.chapters.map(async (chapter) => {
          const encodedCover = await imageManager.encodeImageToBase64(
            chapter.coverPath
          );

          return {
            ...chapter,
            coverPath: encodedCover,
          };
        })
      );

      const processedData = {
        ...data,
        chapters: updatedChapters,
      };

      return processedData;
    } catch (error) {
      console.error("Erro ao buscar dados da series:", error);
      throw error;
    }
  });
}
