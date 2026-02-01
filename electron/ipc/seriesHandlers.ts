import { IpcMain } from 'electron';
import StorageManager from '../services/StorageManager.ts';
import CollectionsManager from '../services/CollectionManager';
import FileManager from '../services/FileManager.ts';
import ImageManager from '../services/ImageManager.ts';
import UserManager from '../services/UserManager.ts';
import TieInManager from '../services/TieInManager.ts';
import { ComicTieIn, TieIn } from '../types/comic.interfaces.ts';
import { SerieEditForm } from '../../src/types/series.interfaces.ts';
import { Literatures } from '../types/electron-auxiliar.interfaces.ts';

export default function seriesHandlers(ipcMain: IpcMain) {
  const tieIn = new TieInManager();
  const storageManager = new StorageManager();
  const imageManager = new ImageManager();
  const userManager = new UserManager();
  const fileManager = new FileManager();
  const collectionManager = new CollectionsManager();

  ipcMain.handle('web:readFileAsDataUrl', async (_evt, rawPath: string) => {
    return await imageManager.readFileAsDataUrl(rawPath);
  });

  ipcMain.handle('serie:get-all', async () => {
    try {
      const getData = await storageManager.seriesData();

      const procesData = await Promise.all(
        getData.map(async (serieData) => {
          const encodedImage = await imageManager.encodeImage(
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
        coverImage: await imageManager.encodeImage(data.coverImage),
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
                  ? await imageManager.encodeImage(chapter.coverImage)
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
                ? await imageManager.encodeImage(tieIn.coverImage)
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
        coverImage: await imageManager.encodeImage(data.coverImage),
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
              const encodedCover = await imageManager.encodeImage(
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

  ipcMain.handle(
    'serie:add-to-collection',
    async (_event, dataPath: string, collectionName: string) => {
      try {
        const serieData = (await storageManager.readSerieData(
          dataPath,
        )) as Literatures;

        const collections = serieData.metadata.collections;

        if (!collections.includes(collectionName)) {
          serieData.metadata.collections.push(collectionName);
          await collectionManager.addInCollection(dataPath, collectionName);
        } else {
          serieData.metadata.collections = collections.filter(
            (col) => col !== collectionName,
          );

          await collectionManager.removeInCollection(
            collectionName,
            serieData.name,
          );
        }

        await storageManager.updateSerieData(serieData);
        return { success: true };
      } catch (e) {
        console.error(`Falha em adicionar a colecao: ${e}`);
        return { success: false, error: String(e) };
      }
    },
  );

  ipcMain.handle(
    'serie:rating',
    async (_event, dataPath: string, userRating: number) => {
      try {
        const serieData = (await storageManager.readSerieData(
          dataPath,
        )) as Literatures;

        serieData.metadata.rating = userRating;

        const success = await collectionManager.updateSerie(serieData.dataPath);

        if (!success) {
          return { success: false };
        }

        await storageManager.updateSerieData(serieData);
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
      const result = await userManager.favoriteSerie(serieData);
      return { success: result };
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
        const result = await userManager.addToRecents(serieData);
        return { success: result };
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
          await tieIn.createTieInSerie(data);
        }

        return {
          success: true,
          data: `/TieIn/${encodeURIComponent(data.name)}`,
          error: '',
        };
      } catch (e) {
        console.error(`Falha em criar as capas da Tie-In`);
        return { success: false, error: 'falha em gerar Tie-In ' };
      }
    },
  );

  // Esse código por acaso é meu?
  // ipcMain.handle('serie:update-serie', async (_event, data: SerieEditForm) => {
  //   try {
  //     if (!data?.dataPath) {
  //       throw new Error('dataPath inválido');
  //     }

  //     const [serieData, updatedData] = await storageManager.patchSerie(data);

  //     const newCover = await imageManager.generateCover(
  //       data.name,
  //       serieData.coverImage,
  //       updatedData.coverImage,
  //     );
  //     updatedData.coverImage = newCover;

  //     await collectionManager.checkDifferences(serieData, updatedData);

  //     await storageManager.patchHelper(updatedData, data);
  //     return { success: true };
  //   } catch (error) {
  //     console.error('Erro ao atualizar série:', error);

  //     return {
  //       success: false,
  //       error:
  //         error instanceof Error
  //           ? error.message
  //           : 'Erro desconhecido ao atualizar série',
  //     };
  //   }
  // });
}
