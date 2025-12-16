import { IpcMain } from 'electron';
import StorageManager from '../services/StorageManager.ts';
import CollectionsManager from '../services/CollectionsManager';
import FileManager from '../services/FileManager.ts';
import ImageManager from '../services/ImageManager.ts';
import UserManager from '../services/UserManager.ts';
import ComicManager from '../services/ComicManager.ts';
import { ComicTieIn, TieIn } from '../types/comic.interfaces.ts';
import { getMainWindow } from '../main.ts';
import { Literatures } from '../../src/types/auxiliar.interfaces.ts';

export default function seriesHandlers(ipcMain: IpcMain) {
  const comicManager = new ComicManager();
  const storageManager = new StorageManager();
  const imageManager = new ImageManager();
  const userManager = new UserManager();
  const fileManager = new FileManager();
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
                typeof chapter.coverImage === 'string'
                  ? await imageManager.encodeImageToBase64(chapter.coverImage)
                  : '';

              return {
                ...chapter,
                coverImage: encodedCover,
              };
            }),
          )
        : [];

      const updatedChildSeries = data.childSeries
        ? await Promise.all(
            data.childSeries.map(async (tieIn) => {
              const encodedCover = tieIn.coverImage
                ? await imageManager.encodeImageToBase64(tieIn.coverImage)
                : '';

              return {
                ...tieIn,
                coverImage: encodedCover,
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
      const dataPath = await fileManager.getDataPath(serieName);
      const data = await storageManager.selectTieInData(serieName);

      if (!data) throw new Error('Data nao encontrada no Handle');

      const updatedChapters = data.chapters
        ? await Promise.all(
            data.chapters.map(async (chapter) => {
              const encodedCover = await imageManager.encodeImageToBase64(
                chapter.coverImage!,
              );
              return {
                ...chapter,
                coverImage: encodedCover,
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
      const serieData = (await storageManager.readSerieData(
        dataPath,
      )) as Literatures;
      const normalizedData =
        await storageManager.createNormalizedData(serieData);
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
        const serieData = (await storageManager.readSerieData(
          dataPath,
        )) as Literatures;
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
      const serieData = (await storageManager.readSerieData(
        dataPath,
      )) as Literatures;
      await userManager.favoriteSerie(serieData);
      return { success: true };
    } catch (e) {
      console.error(`Erro em favoritar serie: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'serie:recent-read',
    async (_event, dataPath: string, serie_name: string) => {
      try {
        const dPath = serie_name
          ? await fileManager.getDataPath(serie_name)
          : dataPath;
        const serieData = (await storageManager.readSerieData(
          dPath,
        )) as Literatures;
        await userManager.addToRecents(serieData);
        return { success: true };
      } catch (e) {
        console.error(`Erro em adicionar em recentes: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'serie:create-TieIn',
    async (_event, childSerie: ComicTieIn) => {
      try {
        const data = (await storageManager.readSerieData(
          childSerie.dataPath,
        )) as TieIn;

        if (!data.metadata.isCreated) {
          await comicManager.createTieIn(data);
        }

        return {
          success: true,
          data: `/TieIn/${encodeURIComponent(data.name)}`,
          error: '',
        };
      } catch (e) {
        console.log(`Falha em criar as capas da Tie-In`);
        return { success: false, error: 'deu mole ' };
      }
    },
  );

  ipcMain.handle('serie:edit-serie', async (_event, serieName: string) => {
    try {
      const dataResponse = await storageManager.getSerieData(serieName);

      if (!dataResponse.success || !dataResponse.data) {
        throw new Error('Erro na requisição original');
      }

      const oldData: Literatures = dataResponse.data as Literatures;

      const newData = {
        ...oldData,
        coverImage: await imageManager.encodeImageToBase64(oldData.coverImage),
      };

      return { success: true, data: newData };
    } catch (e) {
      console.error(`Falha em encontrar a serie: ${serieName}`);
    }
  });
}
