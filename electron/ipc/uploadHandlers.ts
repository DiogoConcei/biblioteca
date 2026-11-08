import { IpcMain } from 'electron';

import {
  LiteratureForm,
  SerieData,
  SerieForm,
} from '../../src/shared/types/series.interfaces.ts';
import { APIResponse, LiteratureChapter } from '../types/electron-auxiliar.interfaces.ts';
import {
  ChapterUploadPayload,
  ProcessedChapterResult,
  ProcessedUploadResult,
} from '../types/upload.interfaces';

import storageManager from '../services/StorageManager.ts';
import ComicManager from '../services/content/ComicManager.ts';
import BookManager from '../services/content/BookManager.ts';
import MangaManager from '../services/content/MangaManager.ts';
import FileManager from '../services/FileManager.ts';
import ImageManager from '../services/processing/ImageManager.ts';
import ManagerFactory from '../services/adapters/ManagerFactory.ts';

export interface SuggestedCover {
  chapterName: string;
  path: string;
  url: string;
  page: number;
  recommended?: boolean;
}
export default function uploadHandlers(ipcMain: IpcMain) {
  const comicManager = new ComicManager();
  const mangaManager = new MangaManager();
  const fileManager = new FileManager();
  const imageManager = new ImageManager();
  const bookManager = new BookManager();

  ManagerFactory.register(LiteratureForm.MANGA, mangaManager);
  ManagerFactory.register(LiteratureForm.COMIC, comicManager);
  ManagerFactory.register(LiteratureForm.BOOK, bookManager);

  ipcMain.handle(
    'upload:process-files',
    async (_event, filePaths: unknown): Promise<APIResponse<ProcessedUploadResult>> => {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return {
          success: false,
          error: 'Nenhum arquivo foi selecionado para upload.',
        };
      }

      const paths = filePaths.filter((p): p is string => typeof p === 'string');

      if (!paths.length) {
        return {
          success: false,
          error: 'Os caminhos de arquivos estão inválidos.',
        };
      }

      try {
        const processed = await storageManager.processUpload(paths);
        return { success: true, data: processed };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'upload:process-series',
    async (_event, seriesData: SerieForm[]): Promise<APIResponse<void>> => {
      if (!Array.isArray(seriesData)) {
        return {
          success: false,
          error: 'Payload inválido: esperado um array de séries.',
        };
      }

      const errors: { index: number; name?: string; message: string }[] = [];

      for (let i = 0; i < seriesData.length; i++) {
        const s = seriesData[i];

        if (!s || typeof s !== 'object') {
          errors.push({
            index: i,
            message: 'Item inválido (não é um objeto).',
          });
          continue;
        }

        try {
          const manager = ManagerFactory.get(s.literatureForm);
          await manager.createSerie(s);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Erro ao criar série (index=${i}, name=${s.name}):`, err);
          errors.push({ index: i, name: s.name, message: msg });
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `Algumas séries falharam. Exemplos: ${errors
            .slice(0, 5)
            .map((e) => `#${e.index}(${e.name ?? '—'}): ${e.message}`)
            .join(' ; ')}`,
        };
      }

      return { success: true };
    },
  );

  ipcMain.handle(
    'chapter:upload-chapter',
    async (
      _event,
      chapterData: ChapterUploadPayload,
    ): Promise<APIResponse<ProcessedChapterResult>> => {
      try {
        const serie = await storageManager.searchSerieById(chapterData.serieId);

        if (!serie) return { success: false, error: 'Série não encontrada.' };
        if (!serie.chapters)
          return { success: false, error: 'Dados dos capítulos não encontrados.' };

        switch (serie.literatureForm) {
          case 'Manga': {
            const data = await mangaManager.updateChapters(serie, chapterData);
            return { success: true, data };
          }
          case 'Quadrinho': {
            const data = await comicManager.updateChapters(serie, chapterData);
            return { success: true, data };
          }
          default:
            return { success: false, error: 'Tipo de literatura inválido.' };
        }
      } catch (e) {
        console.error('Falha no upload de novos capítulos: ', e);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'upload:suggest-cover',
    async (
      _event,
      oldPath: string,
      type: LiteratureForm,
    ): Promise<APIResponse<SuggestedCover[]>> => {
      if (typeof oldPath !== 'string')
        return { success: false, error: 'Caminho inválido.' };
      try {
        const [entries] = await fileManager.searchChapters(oldPath);
        const result = await imageManager.suggestCover(entries, type);
        return { success: true, data: result };
      } catch (err) {
        console.error('Erro ao criar sugestão de capas para a série:', err);
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('upload:clear-temp-covers', async (): Promise<APIResponse<void>> => {
    try {
      await imageManager.clearSuggestedCovers();
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
}
