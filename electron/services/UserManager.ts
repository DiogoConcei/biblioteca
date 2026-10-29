import FileSystem from './abstract/LibrarySystem';
import storageManager from './StorageManager';
import HistoryManager from './persistence/HistoryManager';
import CollectionManager from './content/CollectionManager';
import {
  ReadableSerie,
  LastReadCandidate,
  Literatures,
  graphSerie,
} from '../types/electron-auxiliar.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
import { ReadingStatus } from '../../src/shared/types/series.interfaces';
import FileManager from './FileManager';

export default class UserManager extends FileSystem {
  private readonly storageManager = storageManager;
  private readonly fileManager: FileManager = new FileManager();
  private readonly historyManager: HistoryManager = new HistoryManager();
  private readonly collectionManager: CollectionManager = new CollectionManager();

  constructor() {
    super();
  }

  public async markRead(
    dataPath: string,
    chapter_id: number,
    isRead: boolean,
  ): Promise<boolean> {
    try {
      const serie = await this.storageManager.readSerieData(dataPath);
      if (!serie) return false;

      const chapter = serie.chapters.find((c) => c.id === chapter_id);
      if (!chapter) return false;

      return await this.historyManager.historyControl(serie, chapter, isRead);
    } catch (error) {
      console.error(`Erro ao marcar capítulo como lido no path ${dataPath}:`, error);
      return false;
    }
  }

  async addToRecentes(serie: graphSerie): Promise<boolean> {
    return true;
  }

  public async favoriteSerie(serieData: Literatures): Promise<boolean> {
    try {
      const isFavorite = !serieData.metadata.isFavorite;
      let success: boolean;

      if (isFavorite) {
        success = await this.collectionManager.addInCollection(
          serieData.dataPath,
          'favoritos',
        );
      } else {
        success = await this.collectionManager.removeInCollection(
          'favoritos',
          serieData.id,
        );
      }

      if (!success) return false;

      serieData.metadata.isFavorite = isFavorite;
      await this.storageManager.writeData(serieData);

      return true;
    } catch (err) {
      console.error('Erro ao atualizar favoritação de série:', err);
      return false;
    }
  }

  public mountChapterUrl(
    serie: ReadableSerie,
    chapterId: number,
    chapterName: string,
    lastPageRead: number,
    isRead: boolean,
  ): string {
    return `/${encodeURIComponent(serie.name)}/${serie.id}/${encodeURIComponent(chapterName)}/${chapterId}/${lastPageRead}/${isRead}`;
  }
}
