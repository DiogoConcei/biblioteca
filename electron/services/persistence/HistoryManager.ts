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
  private readonly collectionManager: CollectionManager = new CollectionManager();
  private readonly writer = new AtomicJsonStore();

  public async getHistory(): Promise<HistoryFile> {
    return fse.readJson(this.historyFile);
  }

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
      serie.metadata.status = ReadingStatus.PENDING;
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

  public async getRecents(limit = 5): Promise<SerieHistoryEntry[]> {
    if (!(await fse.pathExists(this.historyFile))) return [];

    const history: HistoryFile = await fse.readJSON(this.historyFile);
    return [...history.summaries]
      .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
      .slice(0, limit);
  }

  public async getReadEvents(): Promise<ReadEvent[]> {
    if (!(await fse.pathExists(this.historyFile))) return [];

    const history: HistoryFile = await fse.readJSON(this.historyFile);

    return [...(history.events || [])].sort(
      (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime(),
    );
  }

  public async addToHistory(serie: graphSerie): Promise<void> {
    await this.appendEvents(serie, [this.mountReadEvent(serie)]);
  }

  private async removeFromHistory(serie: graphSerie): Promise<void> {
    try {
      const history: HistoryFile = await fse.readJSON(this.historyFile);

      history.events = (history.events || []).filter((e) => {
        if (e.serieId !== serie.id) return true;
        const chapter = serie.chapters.find((c) => c.id === e.chapterId);
        return chapter?.isRead === true;
      });

      const summaryIndex = history.summaries.findIndex((s) => s.serieId === serie.id);
      if (summaryIndex === -1) return;

      const summary = history.summaries[summaryIndex];
      summary.chaptersRead = serie.chapters.filter((c) => c.isRead).length;

      if (summary.chaptersRead === 0) {
        history.summaries.splice(summaryIndex, 1);
      } else {
        const previousValidEvent = history.events.findLast((e) => e.serieId === serie.id);

        if (previousValidEvent) {
          summary.lastChapterId = previousValidEvent.chapterId;
          summary.lastReadAt = previousValidEvent.readAt;
        } else {
          summary.lastChapterId = 0;
        }

        summary.lastChapterLabel = this.chapterLabel(serie, summary.lastChapterId);
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
      literatureForm: serie.literatureForm,
      lastChapterLabel: this.chapterLabel(serie, serie.readingData.lastChapterId),
    };
  }

  private chapterLabel(serie: graphSerie, chapterId: number): string {
    return serie.chapters.find((c) => c.id === chapterId)?.chapterNumber.label ?? '';
  }

  private mountReadEvent(serie: graphSerie): ReadEvent {
    const lastChapter = serie.chapters.find(
      (c) => c.id === serie.readingData.lastChapterId,
    );

    if (!lastChapter) throw new Error('Sem entrada de leitura para essa série');

    return {
      chapterId: lastChapter?.id,
      literatureForm: serie.literatureForm,
      chapterName: lastChapter.name,
      isRead: lastChapter.isRead,
      lastPageRead: lastChapter.page.lastPageRead,
      readAt: serie.readingData.lastReadAt,
      serieId: serie.id,
    };
  }

  private recalcProgress(serie: graphSerie): void {
    serie.chaptersRead = serie.chapters.filter((c) => c.isRead).length;

    if (serie.chaptersRead === serie.totalChapters && serie.totalChapters > 0) {
      serie.metadata.status = ReadingStatus.COMPLETED;
    } else if (serie.chaptersRead > 0) {
      serie.metadata.status = ReadingStatus.IN_PROGRESS;
    } else {
      serie.metadata.status = ReadingStatus.PENDING;
    }
  }

  public async historyControlBatch(
    serie: graphSerie,
    chapterIds: number[],
    isRead: boolean,
  ): Promise<boolean> {
    const ids = new Set(chapterIds);

    const changed = serie.chapters
      .filter((c) => ids.has(c.id) && c.isRead !== isRead)
      .sort((a, b) => a.order - b.order);

    if (changed.length === 0) return isRead;

    changed.forEach((c) => {
      c.isRead = isRead;
    });
    this.recalcProgress(serie);

    if (isRead) {
      const base = Date.now();
      const events: ReadEvent[] = changed.map((c, i) => ({
        chapterId: c.id,
        literatureForm: serie.literatureForm,
        chapterName: c.name,
        isRead: true,
        lastPageRead: c.page.lastPageRead,
        readAt: new Date(base + i).toISOString(),
        serieId: serie.id,
      }));

      const last = events[events.length - 1];
      serie.readingData.lastChapterId = last.chapterId;
      serie.readingData.lastReadAt = last.readAt;

      await this.appendEvents(serie, events);
    } else {
      await this.removeFromHistory(serie);

      const history: HistoryFile = await fse.readJSON(this.historyFile);
      const summary = history.summaries.find((s) => s.serieId === serie.id);

      serie.readingData.lastChapterId = summary?.lastChapterId ?? 0;
      serie.readingData.lastReadAt = summary?.lastReadAt ?? '';
    }

    await this.storageManager.writeData(serie);
    return isRead;
  }

  private async appendEvents(serie: graphSerie, events: ReadEvent[]): Promise<void> {
    const history: HistoryFile = await fse.readJSON(this.historyFile);
    history.events.push(...events);

    const entry = this.mountSerieHistory(serie);
    const index = history.summaries.findIndex((s) => s.serieId === entry.serieId);

    if (index === -1) history.summaries.push(entry);
    else history.summaries[index] = entry;

    history.summaries.sort(
      (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime(),
    );

    await this.collectionManager.updateRecentCollection(history.summaries);
    await this.writer.write(this.historyFile, history);
  }
}
