import FileSystem from "./abstract/FileSystem";
import CollectionsManager from "./CollectionsManager";
import StorageManager from "./StorageManager";
import { SerieCollectionInfo } from "../types/collections.interfaces";
import { Manga } from "../types/manga.interfaces";
import { Collection } from "../types/collections.interfaces";
import { Comic } from "../types/comic.interfaces";
import { Book } from "../types/book.interfaces";
import { Literatures } from "../types/series.interfaces";

export default class UserManager extends FileSystem {
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public ratingSerie(serieData: Literatures, userRating: number): Literatures {
    const starsRating = [
      "1 - Péssimo",
      "2 - Horrível",
      "3 - Regular",
      "4 - Bom",
      "5 - Excelente",
    ];

    let caseIndex = userRating;

    switch (caseIndex) {
      case 0:
        serieData.metadata.rating = 1;
        break;
      case 1:
        serieData.metadata.rating = 2;
        break;
      case 2:
        serieData.metadata.rating = 3;
        break;
      case 3:
        serieData.metadata.rating = 4;
        break;
      case 4:
        serieData.metadata.rating = 5;
        break;
    }

    return serieData;
  }

  public async favoriteSerie(serieData: Literatures): Promise<Literatures> {
    try {
      const collections: Collection[] =
        await this.collectionsManager.getCollections();
      const favCollection = await this.collectionsManager.getFavorites(
        collections
      );

      if (!favCollection) {
        throw new Error("Coleção de favoritos não encontrada.");
      }

      const favSerieJson: SerieCollectionInfo = {
        id: serieData.id,
        name: serieData.name,
        coverImage: serieData.coverImage,
        comic_path: serieData.chaptersPath,
        archivesPath: serieData.archivesPath,
        totalChapters: serieData.totalChapters,
        status: serieData.metadata.status,
        recommendedBy: serieData.metadata.recommendedBy || "",
        originalOwner: serieData.metadata.originalOwner || "",
        rating: serieData.metadata.rating || 0,
      };

      const newFavoriteStatus = !serieData.metadata.isFavorite;

      const serieExists = favCollection.series.some(
        (series) => series.name === serieData.name
      );

      if (newFavoriteStatus && !serieExists) {
        favCollection.series.push(favSerieJson);
      } else if (!newFavoriteStatus) {
        favCollection.series = favCollection.series.filter(
          (series) => series.name !== serieData.name
        );
      }

      serieData.metadata.isFavorite = newFavoriteStatus;

      favCollection.updatedAt = new Date().toISOString();

      await this.collectionsManager.updateFavCollection(
        collections,
        this.appCollections
      );
      await this.storageManager.updateSerieData(serieData);

      return serieData;
    } catch (e) {
      console.error(`Erro ao atualizar coleção de favoritos: ${e}`);
      throw e;
    }
  }

  public async markChapterRead(
    dataPath: string,
    chapter_id: number,
    isRead: boolean
  ): Promise<void> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);
      const chapter = serieData.chapters.find((c) => c.id === chapter_id);

      if (chapter) {
        chapter.isRead = isRead;
      }

      if (isRead && serieData.chaptersRead <= serieData.totalChapters) {
        serieData.readingData.lastChapterId = chapter.id;
        serieData.chaptersRead += 1;
      }

      if (!isRead && serieData.chaptersRead > 0) {
        serieData.chaptersRead -= 1;
      }

      await this.storageManager.updateSerieData(serieData);
    } catch (error) {
      console.error(`Erro ao marcar capítulo como lido: ${error}`);
      throw error;
    }
  }
}

// (async () => {
//     try {
//         const MangaOperations = new UserManager();
//         console.log(await MangaOperations.markChapterRead("C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\data store\\json files\\Mangas\\Jujutsu Kaisen.json", 1, false))
//     } catch (error) {
//         console.error('Erro ao executar a função:', error);
//     }
// })();
