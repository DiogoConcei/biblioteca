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

    // Adicionado fallback (history.events || []) para evitar TypeError se undefined
    return [...(history.events || [])].sort(
      (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime(),
    );
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

      // 1. LIMPEZA DOS EVENTOS FANTASMAS
      // Remove do array events qualquer evento desta série cujo capítulo não está mais marcado como lido
      history.events = (history.events || []).filter((e) => {
        if (e.serieId !== serie.id) return true; // Mantém eventos de outras séries
        const chapter = serie.chapters.find((c) => c.id === e.chapterId);
        return chapter?.isRead === true; // Só mantém o evento se o capítulo ainda estiver lido
      });

      const summaryIndex = history.summaries.findIndex((s) => s.serieId === serie.id);
      if (summaryIndex === -1) return;

      const summary = history.summaries[summaryIndex];
      summary.chaptersRead = serie.chapters.filter((c) => c.isRead).length;

      if (summary.chaptersRead === 0) {
        history.summaries.splice(summaryIndex, 1);
      } else {
        // 2. CORREÇÃO DO FIND PARA FINDLAST
        // Usa findLast para pegar o evento VÁLIDO MAIS RECENTE (do fim pro começo do array)
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
}
