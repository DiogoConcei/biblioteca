import { IpcMain } from 'electron';

import FileManager from '../services/FileManager';
import MangaManager from '../services/MangaManager';
import StorageManager from '../services/StorageManager';
import ComicManager from '../services/ComicManager';
import TieInManager from '../services/TieInManager.ts';
import UserManager from '../services/UserManager.ts';
import ImageManager from '../services/ImageManager.ts';
import { Literatures } from '../types/electron-auxiliar.interfaces.ts';

export default function chaptersHandlers(ipcMain: IpcMain) {
  const fileManager = new FileManager();
  const storageManager = new StorageManager();
  const mangaManager = new MangaManager();
  const comicManager = new ComicManager();
  const tieManager = new TieInManager();
  const userManager = new UserManager();
  const imageManager = new ImageManager();

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
        let tempData: string[] = [];

        switch (LiteratureForm) {
          case 'Mangas':
            chapterData = await mangaManager.getChapter(dataPath, chapter_id);
          case 'Comics':
            tempData = await comicManager.getComic(dataPath, chapter_id);
          case 'childSeries':
            chapterData = await tieManager.getTieIn(dataPath, chapter_id);
          default:
            break;
        }

        return { success: true, data: tempData };
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
      totalPages: number,
    ) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);

        let serieData = (await storageManager.readSerieData(
          dataPath!,
        )) as Literatures;

        const chapters = serieData.chapters ?? [];

        let chapterUpdated = false;

        const updatedChapters = chapters.map((chapter) => {
          if (chapter.id !== chapter_id) return chapter;

          chapterUpdated = true;

          const isLastPage = page_number >= totalPages;

          const updatedChapter = {
            ...chapter,
            page: {
              ...chapter.page,
              lastPageRead: Math.max(
                chapter.page.lastPageRead ?? 0,
                page_number,
              ),
            },
          };

          if (isLastPage && !chapter.isRead) {
            updatedChapter.isRead = true;
            serieData.chaptersRead += 1;
          }

          if (isLastPage && chapter_id > serieData.readingData.lastChapterId) {
            serieData.readingData.lastChapterId = chapter_id;
          }

          return updatedChapter;
        });

        if (!chapterUpdated) {
          return { success: false, error: 'Capítulo não encontrado' };
        }

        serieData = {
          ...serieData,
          chapters: updatedChapters,
        };

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

        if (!lastChapter.isDownloaded) {
          switch (literatureForm) {
            case 'Mangas':
              await mangaManager.createEditionById(
                serieData.dataPath,
                lastChapter.id,
              );
              break;
            case 'Comics':
              await comicManager.createChapterById(
                serieData.dataPath,
                lastChapterId,
              );
              break;
            default:
              break;
          }
        }

        const processedData = {
          ...serieData,
          coverImage: await imageManager.encodeImage(serieData.coverImage),
        };

        const url = `/${encodeURI(serieData.name)}/${serieData.id}/${encodeURI(lastChapter.name)}/${lastChapter.id}/${lastChapter.page.lastPageRead}/${lastChapter.isRead}`;

        return { success: true, data: [url, processedData] };
      } catch (e) {
        console.error(`Erro ao acessar último capítulo lido: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'chapter:get-next-chapter',
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath!);

        const nextChapter = serieData.chapters?.find(
          (chapter) => chapter.id === chapter_id,
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
    'chapter:get-prev-chapter',
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        if (!dataPath) {
          throw new Error(`dataPath is undefined for serieName: ${serieName}`);
        }
        const serieData = await storageManager.readSerieData(dataPath);
        const prevChapter = serieData.chapters?.find(
          (chapter) => chapter.id === chapter_id,
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
