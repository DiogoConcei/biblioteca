import FileSystem from './abstract/FileSystem';
import CollectionsManager from './CollectionsManager';
import StorageManager from './StorageManager';
import {
  SerieCollectionInfo,
  Collection,
} from '../../src/types/collections.interfaces';
import { Literatures } from '../../src/types/auxiliar.interfaces';

export default class UserManager extends FileSystem {
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public ratingSerie(serieData: Literatures, userRating: number): Literatures {
    const caseIndex = userRating;

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

  public async addToRecents(serieData: Literatures): Promise<Literatures> {
    try {
      const response = await this.collectionsManager.getCollections();

      if (!response.success || !response.data) {
        throw new Error('Não foi possível carregar as coleções do usuário.');
      }

      const collections = response.data as Collection[];
      const recCollection = collections.find((col) => col.name === 'Recentes');

      if (!recCollection) {
        throw new Error('Coleção "Recentes" não encontrada.');
      }

      const {
        id,
        name,
        coverImage,
        chaptersPath: comic_path,
        archivesPath,
        totalChapters,
        metadata: {
          status,
          recommendedBy = serieData.metadata.recommendedBy,
          originalOwner = serieData.metadata.originalOwner,
          rating = 0,
          isFavorite,
        },
      } = serieData;

      const dataAtual = Date.now();

      const RecentSerieJson: SerieCollectionInfo = {
        id,
        name,
        coverImage,
        comic_path,
        archivesPath,
        totalChapters,
        status,
        recommendedBy: recommendedBy ?? '',
        originalOwner: originalOwner ?? '',
        rating,
        addAt: dataAtual,
      };

      const newFavoriteStatus = !isFavorite;
      const existsInFavs = recCollection.series.some((s) => s.id === id);

      if (newFavoriteStatus && !existsInFavs) {
        recCollection.series.push(RecentSerieJson);
      } else if (!newFavoriteStatus && existsInFavs) {
        recCollection.series = recCollection.series.filter((s) => s.id !== id);
      }

      serieData.metadata.isFavorite = newFavoriteStatus;
      recCollection.updatedAt = new Date().toISOString();

      await this.collectionsManager.updateRecCollection(
        collections,
        this.appCollections,
      );
      await this.storageManager.updateSerieData(serieData);

      return serieData;
    } catch (err) {
      console.error('Erro ao atualizar favoritação de série:', err);
      throw err;
    }
  }

  public async favoriteSerie(serieData: Literatures): Promise<Literatures> {
    try {
      const response = await this.collectionsManager.getCollections();
      if (!response.success || !response.data) {
        throw new Error('Não foi possível carregar as coleções do usuário.');
      }

      const collections = response.data;
      const favCollection = collections.find((col) => col.name === 'Favoritas');
      if (!favCollection) {
        throw new Error('Coleção "Favoritas" não encontrada.');
      }

      const {
        id,
        name,
        coverImage,
        chaptersPath: comic_path,
        archivesPath,
        totalChapters,
        metadata: {
          status,
          recommendedBy = serieData.metadata.recommendedBy,
          originalOwner = serieData.metadata.originalOwner,
          rating = 0,
          isFavorite,
        },
      } = serieData;

      const dataAtual = Date.now();

      const favSerieJson: SerieCollectionInfo = {
        id,
        name,
        coverImage,
        comic_path,
        archivesPath,
        totalChapters,
        status,
        recommendedBy: recommendedBy ?? '',
        originalOwner: originalOwner ?? '',
        rating,
        addAt: dataAtual,
      };

      const newFavoriteStatus = !isFavorite;
      const existsInFavs = favCollection.series.some((s) => s.id === id);

      if (newFavoriteStatus && !existsInFavs) {
        favCollection.series.push(favSerieJson);
      } else if (!newFavoriteStatus && existsInFavs) {
        favCollection.series = favCollection.series.filter((s) => s.id !== id);
      }

      serieData.metadata.isFavorite = newFavoriteStatus;
      favCollection.updatedAt = new Date().toISOString();

      await this.collectionsManager.updateFavCollection(
        collections,
        this.appCollections,
      );
      await this.storageManager.updateSerieData(serieData);

      return serieData;
    } catch (err) {
      console.error('Erro ao atualizar favoritação de série:', err);
      throw err;
    }
  }

  public async markChapterRead(
    dataPath: string,
    chapter_id: number,
    isRead: boolean,
  ): Promise<void> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);

      if (!serieData.chapters || serieData.chapters.length === 0) {
        console.warn('Série sem capítulos ao tentar marcar leitura.');
        return;
      }

      const chapter = serieData.chapters.find((c) => c.id === chapter_id);

      if (!chapter) {
        console.warn(`Capítulo ${chapter_id} não encontrado em ${dataPath}.`);
        return;
      }

      chapter.isRead = isRead;

      if (chapter_id !== 1) {
        if (isRead) {
          if (serieData.chaptersRead < serieData.totalChapters) {
            serieData.chaptersRead += 1;
          } else {
            console.warn('chaptersRead já está no máximo permitido.');
          }
        } else {
          if (serieData.chaptersRead > 0) {
            serieData.chaptersRead -= 1;
          } else {
            console.warn('chaptersRead já está no mínimo permitido.');
          }
        }
      }

      await this.storageManager.updateSerieData(serieData);
    } catch (error) {
      console.error(`Erro ao marcar capítulo como lido: ${error}`);
      throw error;
    }
  }
}
