import FileSystem from './abstract/LibrarySystem';
import CollectionManager from './CollectionManager';
import StorageManager from './StorageManager';
import {
  Collection,
  SerieInCollection,
} from '../../src/types/collections.interfaces';
import {
  APIResponse,
  Literatures,
} from '../types/electron-auxiliar.interfaces';

export default class UserManager extends FileSystem {
  private readonly collManager: CollectionManager = new CollectionManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public async addToRecents(serieData: Literatures): Promise<boolean> {
    try {
      await this.collManager.addInCollection(serieData.dataPath, 'recentes');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar historico de series:', err);
      throw false;
    }
  }

  public async favoriteSerie(serieData: Literatures): Promise<boolean> {
    try {
      const isFavorite = !serieData.metadata.isFavorite;

      const success = isFavorite
        ? await this.collManager.addInCollection(
            serieData.dataPath,
            'favoritos',
          )
        : (await this.collManager.removeInCollection('favoritos', serieData.id))
            .success;

      if (!success) return false;

      serieData.metadata.isFavorite = isFavorite;
      await this.storageManager.writeData(serieData);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar favoritação de série:', err);
      return false;
    }
  }

  public async markChapterRead(
    dataPath: string,
    chapter_id: number,
    isRead: boolean,
  ): Promise<void> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);

      if (!serieData) {
        return;
      }

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

      await this.storageManager.writeData(serieData);
    } catch (error) {
      console.error(`Erro ao marcar capítulo como lido: ${error}`);
      throw error;
    }
  }
}
