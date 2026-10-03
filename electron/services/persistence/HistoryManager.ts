import LibrarySystem from '../abstract/LibrarySystem';
import AtomicJsonStore from '../AtomicJsonStore';
import { StorageManager } from '../StorageManager';
import CollectionManager from '../content/CollectionManager';
import fse from 'fs-extra';
import FileManager from '../FileManager';
import { graphSerie, graphChapter } from '../../types/electron-auxiliar.interfaces';
import { TieIn } from '../../types/comic.interfaces';
import { ReadingStatus } from '../../../src/shared/types/series.interfaces';
import {
  HistoryFile,
  ReadEvent,
  SerieHistoryEntry,
} from '../../types/history.interfaces';
export default class HistoryManager extends LibrarySystem {
  private readonly storageManager = StorageManager.getInstance();
  private readonly fileManager: FileManager = new FileManager();
  private readonly collectionManager: CollectionManager = new CollectionManager();
  private readonly writer = new AtomicJsonStore();

  public async historyControl(
    serie: graphSerie,
    chapter: graphChapter,
    isRead: boolean,
  ): Promise<boolean> {
    const chIndex = serie.chapters.findIndex((c) => c.id === chapter.id);

    if (chIndex !== -1) {
      serie.chapters[chIndex].isRead = isRead;
    }

    serie.chaptersRead = serie.chapters.filter((c) => c.isRead).length;

    if (serie.chaptersRead === serie.totalChapters && serie.totalChapters > 0) {
      serie.metadata.status = ReadingStatus.COMPLETED;
    } else if (serie.chaptersRead > 0) {
      serie.metadata.status = ReadingStatus.IN_PROGRESS;
    } else {
      serie.metadata.status = ReadingStatus.PENDING; // Ou o enum correto para 'Pendente'
    }

    if (isRead === true) {
      serie.readingData.lastChapterId = chapter.id;
      serie.readingData.lastReadAt = new Date().toISOString();

      await this.addToHistory(serie);
      await this.storageManager.writeData(serie);
      return true;
    } else {
      await this.removeFromHistory(serie);
      const history: HistoryFile = await fse.readJSON(this.historyFile);
      const summary = history.summaries.find((s) => s.serieId === serie.id);

      if (summary) {
        serie.readingData.lastChapterId = summary.lastChapterId;
        serie.readingData.lastReadAt = summary.lastReadAt;
      } else {
        serie.readingData.lastChapterId = 0;
        serie.readingData.lastReadAt = '';
      }

      await this.storageManager.writeData(serie);
      return false;
    }
  }

  private async addToHistory(serie: graphSerie): Promise<void> {
    try {
      const historySerie: SerieHistoryEntry = this.mountSerieHistory(serie);
      const readEvent: ReadEvent = this.mountReadEvent(serie);
      let history: HistoryFile = { summaries: [], events: [] };
      history = await fse.readJSON(this.historyFile);

      history.events.push(readEvent);

      const index = history.summaries.findIndex(
        (s) => s.serieId === historySerie.serieId,
      );

      if (index === -1) {
        history.summaries.push(historySerie);
      } else {
        history.summaries[index] = historySerie;
      }

      history.summaries.sort(
        (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime(),
      );

      await this.collectionManager.updateRecentCollection(history.summaries);

      await this.writer.write(this.historyFile, history);
    } catch (error) {
      throw error;
    }
  }

  private async removeFromHistory(serie: graphSerie): Promise<void> {
    try {
      const history: HistoryFile = await fse.readJSON(this.historyFile);

      const summaryIndex = history.summaries.findIndex((s) => s.serieId === serie.id);

      if (summaryIndex === -1) return;

      const summary = history.summaries[summaryIndex];

      summary.chaptersRead = serie.chapters.filter((c) => c.isRead).length;

      if (summary.chaptersRead === 0) {
        history.summaries.splice(summaryIndex, 1);
      } else {
        const previousValidEvent = history.events.find(
          (e) =>
            e.serieId === serie.id &&
            serie.chapters.find((c) => c.id === e.chapterId)?.isRead === true,
        );

        if (previousValidEvent) {
          summary.lastChapterId = previousValidEvent.chapterId;
          summary.lastReadAt = previousValidEvent.readAt;
        } else {
          summary.lastChapterId = 0;
        }
      }

      await this.collectionManager.updateRecentCollection(history.summaries);

      await this.writer.write(this.historyFile, history);
    } catch (error) {
      console.error('Erro ao remover do histórico:', error);
      throw error;
    }
  }
  private mountSerieHistory(serie: graphSerie): SerieHistoryEntry {
    return {
      chaptersRead: serie.chapters.filter((c) => c.isRead).length,
      coverImage: serie.coverImage,
      lastChapterId: serie.readingData.lastChapterId,
      lastReadAt: serie.readingData.lastReadAt,
      serieId: serie.id,
      serieName: serie.name,
      totalChapters: serie.totalChapters,
    };
  }

  private mountReadEvent(serie: graphSerie): ReadEvent {
    return {
      chapterId: serie.readingData.lastChapterId,
      readAt: serie.readingData.lastReadAt,
      serieId: serie.id,
    };
  }
}
