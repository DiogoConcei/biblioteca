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

        switch (LiteratureForm) {
          case 'Mangas':
            chapterData = await mangaManager.getManga(dataPath, chapter_id);
            break;
          case 'Comics':
            chapterData = await comicManager.getComic(dataPath, chapter_id);
            break;
          case 'childSeries':
            chapterData = await tieManager.getTieIn(dataPath, chapter_id);
            break;
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
      totalPages: number,
    ) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        if (!dataPath) throw new Error('Caminho da série não encontrado');

        const serieData = (await storageManager.readSerieData(
          dataPath,
        )) as Literatures;
        if (!serieData?.chapters?.length)
          throw new Error('Capítulos não encontrados');

        let chapterFound = false;

        const updatedChapters = serieData.chapters.map((chapter) => {
          if (chapter.id !== chapter_id) return chapter;

          chapterFound = true;

          const isLastPage = page_number >= totalPages;

          return {
            ...chapter,
            page: {
              ...chapter.page,
              lastPageRead: Math.max(
                chapter.page?.lastPageRead ?? 0,
                page_number,
              ),
            },
            isRead: chapter.isRead || isLastPage,
          };
        });

        if (!chapterFound)
          return { success: false, error: 'Capítulo não encontrado' };

        const updatedReadingData = {
          ...serieData.readingData,
          lastChapterId: Math.max(
            serieData.readingData.lastChapterId ?? 0,
            chapter_id,
          ),
        };

        const updatedChaptersRead = updatedChapters.filter(
          (c) => c.isRead,
        ).length;

        const updatedSerieData: Literatures = {
          ...serieData,
          chapters: updatedChapters,
          chaptersRead: updatedChaptersRead,
          readingData: updatedReadingData,
        };

        await storageManager.writeData(updatedSerieData);

        return { success: true };
      } catch (e) {
        console.error('Erro ao salvar última página lida:', e);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle('chapter:acess-last-read', async (_event, serieId: number) => {
    try {
      const candidate =
        await userManager.resolveLastReadCandidateBySerieId(serieId);

      if (!candidate) {
        return {
          success: false,
          error: 'Nenhum capítulo disponível para abrir nesta série.',
        };
      }

      const chapter = candidate.serie.chapters?.find((item) => item.id === 0);

      if (!chapter) {
        return {
          success: false,
          error: 'Capítulo final não encontrado para a série selecionada.',
        };
      }

      if (chapter.isDownloaded === 'not_downloaded') {
        const dataPath = candidate.serie.dataPath;
        const LiteratureForm = fileManager.foundLiteratureForm(dataPath);

        switch (LiteratureForm) {
          case 'Mangas':
            await mangaManager.createChapterById(dataPath, chapter.id);
            break;
          case 'Comics':
            await comicManager.createChapterById(dataPath, chapter.id);
            break;
          case 'childSeries':
            await tieManager.createChapterById(dataPath, chapter.id);
            break;
          default:
            break;
        }
      }

      const url = userManager.mountChapterUrl(
        candidate.serie,
        chapter.id,
        chapter.name,
        candidate.lastPageRead,
        candidate.isRead,
      );

      return { success: true, data: [url, candidate.serie] };
    } catch (e) {
      console.error(`Erro ao acessar último capítulo lido: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'chapter:get-next-chapter',
    async (_event, serieName: string, chapter_id: number) => {
      try {
        const dataPath = await fileManager.getDataPath(serieName);
        const serieData = await storageManager.readSerieData(dataPath!);

        if (!serieData) {
          return { success: false, error: `Falha em recuperar dados` };
        }

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

        if (!serieData) {
          return { success: false, error: `Falha em recuperar dados` };
        }
        const prevChapter = serieData.chapters!.find(
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
