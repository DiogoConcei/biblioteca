import { IpcMain } from 'electron';

import StorageManager from '../services/StorageManager.ts';
import CollectionsManager from '../services/CollectionsManager';
import ImageManager from '../services/ImageManager.ts';
import UserManager from '../services/UserManager.ts';
import { getMainWindow } from '../main.ts';
import ComicManager from '../services/ComicManager.ts';
import { ComicTieIn } from '../types/comic.interfaces.ts';

export default function seriesHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const imageManager = new ImageManager();
  const userManager = new UserManager();
  const collectionManager = new CollectionsManager();

  ipcMain.handle('serie:get-all', async () => {
    try {
      const getData = await storageManager.seriesData();

      const procesData = await Promise.all(
        getData.map(async (serieData) => {
          const encodedImage = await imageManager.encodeImageToBase64(
            serieData.coverImage,
          );

          return {
            ...serieData,
            coverImage: encodedImage,
          };
        }),
      );

      return { success: true, data: procesData, error: ' ' };
    } catch (e) {
      console.error(`Falha em recuperar todas as séries: ${e}`);
      return { success: false, data: '', error: String(e) };
    }
  });

  ipcMain.handle('serie:manga-serie', async (_event, serieName: string) => {
    try {
      const data = await storageManager.selectMangaData(serieName);

      const processedData = {
        ...data,
        coverImage: await imageManager.encodeImageToBase64(data.coverImage),
      };

      return { success: true, data: processedData, error: ' ' };
    } catch (e) {
      console.error('Erro ao buscar dados da series:', e);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('serie:comic-serie', async (_event, serieName: string) => {
    try {
      const data = await storageManager.selectComicData(serieName);

      const updatedChapters = data.chapters
        ? await Promise.all(
            data.chapters.map(async (chapter) => {
              const encodedCover =
                typeof chapter.coverPath === 'string'
                  ? await imageManager.encodeImageToBase64(chapter.coverPath)
                  : '';

              return {
                ...chapter,
                coverPath: encodedCover,
              };
            }),
          )
        : [];

      const updatedChildSeries = data.childSeries
        ? await Promise.all(
            data.childSeries.map(async (tieIn) => {
              const encodedCover = tieIn.childSerieCoverPath
                ? await imageManager.encodeImageToBase64(
                    tieIn.childSerieCoverPath,
                  )
                : '';

              return {
                ...tieIn,
                childSerieCoverPath: encodedCover,
              };
            }),
          )
        : [];

      const processedData = {
        ...data,
        chapters: updatedChapters,
        childSeries: updatedChildSeries,
      };

      return { success: true, data: processedData, error: '' };
    } catch (error) {
      console.error('Erro ao buscar dados da series:', error);
      throw error;
    }
  });

  ipcMain.handle('serie:get-TieIn', async (_event, serieName: string) => {
    try {
      const data = await storageManager.selectTieInData(serieName);

      if (!data) throw new Error('Data nao encontrada no Handle');

      const updatedChapters = data.chapters
        ? await Promise.all(
            data.chapters.map(async (chapter) => {
              const encodedCover = await imageManager.encodeImageToBase64(
                chapter.coverPath!,
              );
              return {
                ...chapter,
                coverPath: encodedCover,
              };
            }),
          )
        : [];

      const processedData = {
        ...data,
        chapters: updatedChapters,
      };

      return { success: true, data: processedData, error: '' };
    } catch (e) {
      return { success: false, data: null, error: e };
    }
  });

  ipcMain.handle('serie:addToCollection', async (_event, dataPath: string) => {
    try {
      const serieData = await storageManager.readSerieData(dataPath);
      const normalizedData = await storageManager.createNormalizedData(
        serieData,
      );
      const result = await collectionManager.serieToCollection(normalizedData);
      return { success: result };
    } catch (e) {
      console.error(`Falha em adicionar a colecao: ${e}`);
      return { sucess: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'serie:rating',
    async (_event, dataPath: string, userRating: number) => {
      try {
        const serieData = await storageManager.readSerieData(dataPath);
        const updateData = await userManager.ratingSerie(serieData, userRating);
        await collectionManager.updateSerieInAllCollections(serieData.id, {
          rating: updateData.metadata.rating,
        });

        const win = getMainWindow();

        if (win) {
          win.webContents.send('update-rating');
        }

        await storageManager.updateSerieData(updateData);
        return { success: true };
      } catch (e) {
        console.error(`Falha em ranquear serie: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle('serie:favorite', async (_event, dataPath: string) => {
    try {
      const serieData = await storageManager.readSerieData(dataPath);
      await userManager.favoriteSerie(serieData);
      return { success: true };
    } catch (e) {
      console.error(`Erro em favoritar serie: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('serie:recent-read', async (_event, dataPath: string) => {
    try {
      const serieData = await storageManager.readSerieData(dataPath);
      await userManager.addToRecents(serieData);
      return { success: true };
    } catch (e) {
      console.error(`Erro em favoritar serie: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'serie:create-TieIn',
    async (_event, childSerie: ComicTieIn) => {
      try {
        const comicManager = new ComicManager();
        await comicManager.createTieIn(childSerie);

        return {
          success: true,
          data: `/TieIn/${encodeURI(childSerie.childSerieName)}`,
          error: '',
        };
      } catch (e) {
        console.log(`Falha em criar as capas da Tie-In`);
        return { success: true, error: 'deu mole ' };
      }
    },
  );
}
