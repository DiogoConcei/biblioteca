import { IpcMain } from 'electron';

import FileManager from '../services/FileManager';
import storageManager from '../services/StorageManager';

import ValidationManager from '../services/persistence/ValidationManager';
import BookManager from '../services/content/BookManager';
import TieInManager from '../services/content/TieInManager';
import ComicManager from '../services/content/ComicManager';
import MangaManager from '../services/content/MangaManager';
import ManagerFactory from '../services/adapters/ManagerFactory';
import { APIResponse } from '../types/electron-auxiliar.interfaces';

export default function downloadHandlers(ipcMain: IpcMain) {
  const validationManager = new ValidationManager();
  const fileManager = new FileManager();
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();
  const tieManager = new TieInManager();
  const bookManager = new BookManager();

  ipcMain.handle(
    'download:single',
    async (_event, dataPath: string, chapter_id: number): Promise<APIResponse<void>> => {
      try {
        const literatureForm = fileManager.foundLiteratureForm(dataPath);
        const manager = ManagerFactory.get(literatureForm);
        await manager.createChapterById(dataPath, chapter_id);

        return { success: true };
      } catch (e) {
        console.error('Falha em baixar capítulo', e);
        return { success: false, error: (e as Error).message };
      }
    },
  );

  ipcMain.handle(
    'download:delete',
    async (_event, dataPath: string, chapter_id: number): Promise<APIResponse<void>> => {
      try {
        const form = fileManager.foundLiteratureForm(dataPath);
        await ManagerFactory.get(form).deleteChapterById(dataPath, chapter_id);
        return { success: true };
      } catch (e) {
        console.error('Falha em deletar capítulo', e);
        return { success: false, error: (e as Error).message };
      }
    },
  );

  ipcMain.handle(
    'download:reading',
    async (_event, serieName: string, chapter_id: number): Promise<APIResponse<void>> => {
      const dataPath = await fileManager.getDataPath(serieName);

      if (!dataPath) {
        throw new Error(
          `Não foi possível encontrar o caminho de dados para a série: ${serieName}`,
        );
      }

      const serieData = await storageManager.readSerieData(dataPath);
      const literatureForm = fileManager.foundLiteratureForm(dataPath);

      if (!serieData) {
        throw new Error(`Dados da série não encontrados em: ${dataPath}`);
      }

      const chapter = serieData.chapters.find((chap) => chap.id === chapter_id);

      if (!chapter) {
        throw new Error(`Capítulo com id ${chapter_id} não encontrado.`);
      }

      if (await validationManager.checkDownload(serieData, chapter.id))
        return { success: true };

      try {
        const manager = ManagerFactory.get(literatureForm);
        await manager.createChapterById(dataPath, chapter_id);

        return { success: true };
      } catch (e) {
        console.error('Falha em baixar o proximo capitulo');
        return { success: false, error: (e as Error).message };
      }
    },
  );

  // ipcMain.handle(
  //   'donwload:multiple',
  //   async (_event, dataPath: string, quantity: number) => {
  //     try {
  //       const literatureForm = fileManager.foundLiteratureForm(dataPath);
  //       if (literatureForm === 'Mangas') {
  //         await mangaManager.createMultipleChapters(dataPath, quantity);
  //       } else if (literatureForm === 'Comics') {
  //         await comicManager.createMultipleChapters(dataPath, quantity);
  //       } else if (literatureForm === 'childSeries') {
  //         await tieManager.createMultipleChapters(dataPath, quantity);
  //       } else if (literatureForm === 'books' || literatureForm === 'Books') {
  //         await bookManager.createMultipleChapters(dataPath, quantity);
  //       }
  //       return true;
  //     } catch (e) {
  //       console.error('Falha em baixar multiplos capitulos');
  //       return false;
  //     }
  //   },
  // );

  ipcMain.handle(
    'download:check',
    async (_event, serieName: string, chapterId: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath);

        if (!serieData?.chapters) {
          throw new Error('Erro ao recuperar os dados da série.');
        }

        return await validationManager.checkDownload(serieData, chapterId);
      } catch (e) {
        console.error('Erro ao verificar download:', e);
        throw e;
      }
    },
  );
}
