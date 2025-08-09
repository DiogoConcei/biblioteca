import { IpcMain } from 'electron';

import FileManager from '../services/FileManager';
import StorageManager from '../services/StorageManager';
import ValidationManager from '../services/ValidationManager';
import MangaManager from '../services/MangaManager';
import ComicManager from '../services/ComicManager';

export default function downloadHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const validationManager = new ValidationManager();
  const fileManager = new FileManager();
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();

  ipcMain.handle(
    'donwload:multiple',
    async (_event, dataPath: string, quantity: number) => {
      try {
        await mangaManager.createEditions(dataPath, quantity);
        return true;
      } catch (e) {
        console.error('Falha em baixar multiplos capitulos');
        return false;
      }
    },
  );

  ipcMain.handle(
    'download:single',
    async (_event, dataPath: string, chapter_id: number) => {
      const literatureForm = fileManager.foundLiteratureForm(dataPath);

      try {
        if (literatureForm === 'Mangas') {
          await mangaManager.createEditionById(dataPath, chapter_id);
        } else if (literatureForm === 'Comics') {
          await comicManager.createEditionById(dataPath, chapter_id);
        } else if (literatureForm === 'childSeries') {
          await comicManager.createTieInById(dataPath, chapter_id);
        }

        return true;
      } catch (e) {
        console.error('Falha em baixar capítulo', e);
        return false;
      }
    },
  );

  ipcMain.handle(
    'download:delete',
    async (_event, dataPath: string, chapter_id: number) => {
      const serieData = await storageManager.readSerieData(dataPath);
      const chapter = serieData.chapters?.find((ch) => ch.id === chapter_id);

      if (!chapter) {
        throw new Error(`Capítulo com id ${chapter_id} não encontrado.`);
      }

      try {
        await storageManager.deleteSerieChapter(serieData, chapter);
        return true;
      } catch (e) {
        console.error('Erro ao deletar capítulo:', e);
        return false;
      }
    },
  );

  ipcMain.handle(
    'download:reading',
    async (_event, serieName: string, chapter_id: number) => {
      const dataPath = await fileManager.getDataPath(serieName);

      if (!dataPath) {
        throw new Error(`Data path not found for serie: ${serieName}`);
      }
      const serieData = await storageManager.readSerieData(dataPath);
      const literatureForm = fileManager.foundLiteratureForm(dataPath);

      const chapter = serieData.chapters?.find(
        (chap) => chap.id === chapter_id,
      );

      if (!chapter) {
        throw new Error(`Capítulo com id ${chapter_id} não encontrado.`);
      }

      if (await validationManager.checkDownload(serieData, chapter.id))
        return true;

      try {
        switch (literatureForm) {
          case 'Mangas':
            await mangaManager.createEditionById(dataPath, chapter_id);
            break;
          case 'Comics':
            await comicManager.createEditionById(dataPath, chapter_id);
            break;
          default:
            break;
        }

        return true;
      } catch (e) {
        console.error('Falha em baixar o proximo capitulo');
        return false;
      }
    },
  );

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
