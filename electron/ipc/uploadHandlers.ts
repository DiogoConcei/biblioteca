import { IpcMain } from 'electron';
import { SerieData, SerieForm } from '../../src/types/series.interfaces.ts';
import {
  APIResponse,
  LiteratureChapter,
} from '../../src/types/auxiliar.interfaces.ts';
import MangaManager from '../services/MangaManager.ts';
import StorageManager from '../services/StorageManager.ts';
import ComicManager from '../services/ComicManager.ts';

export default function uploadHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const comicManager = new ComicManager();
  const mangaManager = new MangaManager();

  ipcMain.handle(
    'upload:process-data',
    async (_event, filePaths: unknown): Promise<APIResponse<SerieData[]>> => {
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
        const processed = await Promise.all(
          paths.map((seriePath) => storageManager.preProcessedData(seriePath)),
        );
        return { success: true, data: processed };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'upload:process-serie',
    async (_event, serieData: SerieForm): Promise<APIResponse<null>> => {
      if (typeof serieData !== 'object' || serieData === null) {
        return { success: false, error: 'Dados da série inválidos.' };
      }

      try {
        switch (serieData.literatureForm) {
          case 'Manga':
            await mangaManager.createMangaSerie(serieData);
            break;
          case 'Quadrinho':
            await comicManager.createComicSerie(serieData);
            break;
          default:
            throw new Error('Tipo de literatura inválido');
        }

        return { success: true };
      } catch (err) {
        console.error('Erro ao criar a série:', err);
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'chapter:upload-chapter',
    async (
      _event,
      filesPath: string[],
      literatureForm: string,
      dataPath: string,
    ) => {
      let processedFiles: LiteratureChapter[] = [];

      switch (literatureForm) {
        case 'Manga':
          processedFiles = await mangaManager.uploadChapters(
            filesPath,
            dataPath,
          );
          break;
        case 'Quadrinho':
          processedFiles = await comicManager.uploadChapters(
            filesPath,
            dataPath,
          );
          break;
        default:
          throw new Error('Tipo de literature inválido');
      }

      return { success: true, data: processedFiles };
    },
  );
}
