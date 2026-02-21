import FileSystem from './abstract/LibrarySystem';
import CollectionManager from './CollectionManager';
import StorageManager from './StorageManager';
import {
  ReadableSerie,
  LastReadCandidate,
} from '../types/electron-auxiliar.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
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

  public async addToRecents(serieData: Literatures | TieIn): Promise<boolean> {
    try {
      await this.collManager.addLastRead(serieData);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar historico de series:', err);
      throw false;
    }
  }

  public async favoriteSerie(serieData: Literatures): Promise<boolean> {
    try {
      const isFavorite = !serieData.metadata.isFavorite;
      let success: boolean;

      if (isFavorite) {
        success = await this.collManager.addInCollection(
          serieData.dataPath,
          'favoritos',
        );
      } else {
        success = await this.collManager.removeInCollection(
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

  public async resolveLastReadCandidate(
    dataPath: string,
    visited = new Set<string>(),
  ): Promise<LastReadCandidate | null> {
    if (!dataPath || visited.has(dataPath)) return null;

    visited.add(dataPath);

    const serieData = await this.storageManager.readData(dataPath);
    if (!serieData) return null;

    let bestCandidate = this.resolveChapterFromSerie(serieData);

    if (this.isComic(serieData) && serieData.childSeries?.length) {
      for (const child of serieData.childSeries) {
        const childCandidate = await this.resolveLastReadCandidate(
          child.dataPath,
          visited,
        );
        bestCandidate = this.pickBestCandidate(bestCandidate, childCandidate);
      }
    }

    return bestCandidate;
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

  private pickBestCandidate(
    current: LastReadCandidate | null,
    next: LastReadCandidate | null,
  ): LastReadCandidate | null {
    if (!next) return current;
    if (!current) return next;

    if (next.timestamp !== current.timestamp) {
      return next.timestamp > current.timestamp ? next : current;
    }

    return next.chapterId > current.chapterId ? next : current;
  }

  private resolveChapterFromSerie(
    serie: ReadableSerie,
  ): LastReadCandidate | null {
    if (!serie.chapters?.length) return null;

    const explicitLastRead = serie.chapters.find(
      (chapter) => chapter.id === serie.readingData.lastChapterId,
    );

    const fallbackLastRead = [...serie.chapters]
      .filter((chapter) => chapter.isRead)
      .sort((a, b) => b.id - a.id)[0];

    const chapter = explicitLastRead ?? fallbackLastRead ?? serie.chapters[0];

    return {
      serie,
      chapterId: chapter.id,
      lastPageRead: chapter.page?.lastPageRead ?? 0,
      isRead: chapter.isRead,
      timestamp: this.getSerieTimestamp(serie),
    };
  }

  private isComic(serie: ReadableSerie): serie is Comic {
    return 'childSeries' in serie;
  }

  private getSerieTimestamp(serie: ReadableSerie): number {
    const rawDate = serie.readingData.lastReadAt;
    if (!rawDate) return 0;

    const parsed = new Date(rawDate).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
