import { IpcMain } from 'electron';

import FileManager from '../services/FileManager';
import MangaManager from '../services/MangaManager';
import StorageManager from '../services/StorageManager';
import ComicManager from '../services/ComicManager';
import UserManager from '../services/UserManager.ts';
import { Literatures } from '../../src/types/auxiliar.interfaces.ts';

export default function chaptersHandlers(ipcMain: IpcMain) {
  const fileManager = new FileManager();
  const storageManager = new StorageManager();
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();
  const userManager = new UserManager();

  ipcMain.handle(
    'chapter:mark-read',
    async (_event, dataPath: string, chapter_id: number, isRead: boolean) => {
      try {
        await userManager.markChapterRead(dataPath, chapter_id, isRead);
        return { success: true };
      } catch (e) {
        console.error(`Falha em marcar como lido: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'chapter:get-single',
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);

        if (!dataPath) {
          throw new Error(`dataPath is undefined for serieName: ${serieName}`);
        }

        const LiteratureForm = fileManager.foundLiteratureForm(dataPath);
        let chapterData: string[] | string = '';

        switch (LiteratureForm) {
          case 'Mangas':
            chapterData = await mangaManager.getChapter(dataPath, chapter_id);
          case 'Comics':
            chapterData = await comicManager.getComic(dataPath, chapter_id);
          case 'childSeries':
            chapterData = await comicManager.getTieIn(dataPath, chapter_id);

          default:
            break;
        }

        return { success: true, data: chapterData };
      } catch (e) {
        console.error(`Erro ao recuperar o capitulo: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'chapter:save-last-read',
    async (
      _event,
      serieName: string,
      chapter_id: number,
      page_number: number,
    ) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);

        const serieData = (await storageManager.readSerieData(
          dataPath!,
        )) as Literatures;
        const chapter = serieData.chapters?.find((c) => c.id === chapter_id);

        if (chapter && !chapter.isRead) {
          chapter.page.lastPageRead = page_number;

          chapter.isRead = true;
          serieData.chaptersRead += 1;

          if (chapter_id > serieData.readingData.lastChapterId) {
            serieData.readingData.lastChapterId = chapter_id;
          }
        }

        await storageManager.updateSerieData(serieData);

        return { success: true };
      } catch (e) {
        console.error(`Erro ao salvar última página lida: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'chapter:acess-last-read',
    async (_event, dataPath: string) => {
      try {
        const serieData = await storageManager.readSerieData(dataPath);
        const lastChapterId = serieData.readingData.lastChapterId;
        const literatureForm = fileManager.foundLiteratureForm(dataPath);
        const lastChapter = serieData.chapters?.find(
          (c) => c.id === lastChapterId,
        );

        if (!lastChapter)
          throw new Error(
            `Último capítulo não encontrado para a série ${serieData.name}`,
          );

        if (!lastChapter.isDownload) {
          switch (literatureForm) {
            case 'Mangas':
              await mangaManager.createEditionById(
                serieData.dataPath,
                lastChapter.id,
              );
              break;
            case 'Comics':
              await comicManager.createEditionById(
                serieData.dataPath,
                lastChapterId,
              );
              break;
            default:
              break;
          }
        }

        const url = `/${serieData.name}/${serieData.id}/${lastChapter.name}/${lastChapter.id}/${lastChapter.page.lastPageRead}/${lastChapter.isRead}`;

        return { success: true, data: url };
      } catch (e) {
        console.error(`Erro ao acessar último capítulo lido: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'get-next-chapter',
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath!);

        const nextChapter = serieData.chapters?.find(
          (chapter) => chapter.id === chapter_id + 1,
        );

        if (!nextChapter || nextChapter.id > serieData.totalChapters) {
          console.error(
            `Não há próximo capítulo para a série: ${serieData.name}, capítulo atual: ${chapter_id}`,
          );
          return null;
        }

        const url = `/${serieData.name}/${serieData.id}/${nextChapter.name}/${nextChapter.id}/${nextChapter.page.lastPageRead}/${nextChapter.isRead}`;

        return { success: true, data: url };
      } catch (e) {
        console.error(`Erro ao buscar próximo capítulo: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'get-prev-chapter',
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        if (!dataPath) {
          throw new Error(`dataPath is undefined for serieName: ${serieName}`);
        }
        const serieData = await storageManager.readSerieData(dataPath);
        const prevChapter = serieData.chapters?.find(
          (chapter) => chapter.id === chapter_id - 1,
        );

        if (!prevChapter || prevChapter.id < 0) {
          console.error(
            `Não há capítulo anterior para a série: ${serieData.name}, capítulo atual: ${chapter_id}`,
          );
          return null;
        }

        const url = `/${serieData.name}/${serieData.id}/${prevChapter.name}/${prevChapter.id}/${prevChapter.page.lastPageRead}/${prevChapter.isRead}`;

        return { success: true, data: url };
      } catch (e) {
        console.error(`Erro ao buscar capítulo anterior: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );
}
