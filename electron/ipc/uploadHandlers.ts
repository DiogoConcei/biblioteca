import { IpcMain } from 'electron';
import { SerieData, SerieForm } from '../../src/types/series.interfaces.ts';
import {
  APIResponse,
  LiteratureChapter,
} from '../types/electron-auxiliar.interfaces.ts';
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
          paths.map((seriePath) => storageManager.processData(seriePath)),
        );
        return { success: true, data: [] };
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
          switch (s.literatureForm) {
            case 'Manga':
              await mangaManager.createMangaSerie(s);
              break;

            case 'Quadrinho':
              await comicManager.createComicSerie(s);
              break;

            default:
              throw new Error(
                `Tipo de literatura inválido: ${s.literatureForm}`,
              );
          }
        } catch (err) {
          // Logamos e seguimos com os demais itens
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `Erro ao criar série (index=${i}, name=${s.name}):`,
            err,
          );
          errors.push({ index: i, name: s.name, message: msg });
        }
      }

      if (errors.length > 0) {
        // Retornamos um resumo limitado para o renderer. Não retornamos objetos grandes.
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
      filesPath: string[],
      literatureForm: string,
      dataPath: string,
    ) => {
      let processedFiles: LiteratureChapter[] = [];

      switch (literatureForm) {
        case 'Manga':
          processedFiles = await mangaManager.updateChapters(
            filesPath,
            dataPath,
          );
          break;
        case 'Quadrinho':
          processedFiles = await comicManager.updateEditions(
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
