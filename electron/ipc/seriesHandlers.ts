import { IpcMain } from 'electron';

import storageManager from '../services/StorageManager.ts';
import CollectionsManager from '../services/CollectionManager';
import FileManager from '../services/FileManager.ts';
import ImageManager from '../services/ImageManager.ts';
import UserManager from '../services/UserManager.ts';
import TieInManager from '../services/TieInManager.ts';
import { TieIn, ComicTieIn } from '../types/comic.interfaces.ts';
import { SerieInCollection } from '../../src/types/collections.interfaces.ts';
import { SerieEditForm } from '../../src/types/series.interfaces.ts';
import { Literatures } from '../types/electron-auxiliar.interfaces.ts';

export default function seriesHandlers(ipcMain: IpcMain) {
  const tieIn = new TieInManager();
  const imageManager = new ImageManager();
  const userManager = new UserManager();
  const fileManager = new FileManager();
  const collectionManager = new CollectionsManager();

  ipcMain.handle('web:readFileAsDataUrl', async (_evt, rawPath: string) => {
    return await imageManager.readFileAsDataUrl(rawPath);
  });

  ipcMain.handle('serie:get-all', async () => {
    try {
      const getData = await storageManager.getViewData();

      if (!getData) {
        throw new Error('Falha em gerar dados de visualizacao');
      }

      const procesData = (
        await Promise.all(
          getData.map(async (serieData) => {
            try {
              const encodedImage = await imageManager.getThumbnailUrl(
                serieData.coverImage,
              );

              return {
                ...serieData,
                coverImage: encodedImage,
              };
            } catch (err) {
              console.warn(
                `Aviso: Falha ao carregar miniatura para ${serieData.name}:`,
                err,
              );
              return {
                ...serieData,
                coverImage: '',
              };
            }
          }),
        )
      ).filter(Boolean);

      return { success: true, data: procesData };
    } catch (e) {
      console.error(`Falha em recuperar todas as séries: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'serie:get',
    async (
      _event,
      serieName: string,
      literatureForm: 'Manga' | 'Quadrinho' | 'Books' | 'childSeries',
    ) => {
      try {
        const data = await storageManager.selectSerieData<Literatures | TieIn>(
          serieName,
          literatureForm,
        );

        if (!data) throw new Error('Dados da série não encontrados.');

        const updatedChapters = await Promise.all(
          (data.chapters ?? []).map(async (chapter) => ({
            ...chapter,
            coverImage: imageManager.getMediaUrl(
              chapter.coverImage || chapter.chapterPath || '',
            ),
          })),
        );

        const childSeries =
          'childSeries' in data ? (data.childSeries ?? []) : [];
        const updatedChildSeries = await Promise.all(
          childSeries.map(async (tieIn) => ({
            ...tieIn,
            coverImage: imageManager.getMediaUrl(tieIn.coverImage || ''),
          })),
        );

        return {
          success: true,
          data: {
            ...data,
            coverImage: imageManager.getMediaUrl(data.coverImage),
            chapters: updatedChapters,
            childSeries: updatedChildSeries,
          },
          error: '',
        };
      } catch (error) {
        console.error(`Erro ao buscar dados da série ${serieName}:`, error);
        return { success: false, error: String(error) };
      }
    },
  );

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
            serieData.id,
          );
        }

        await storageManager.writeData(serieData);
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

        await storageManager.writeData(serieData);
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

      const newFav: SerieInCollection = await collectionManager.mountSerieInfo(
        serieData.dataPath,
      );

      const result = await userManager.favoriteSerie(serieData);
      return { success: result, data: newFav };
    } catch (e) {
      console.error(`Erro em favoritar serie: ${e}`);
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(
    'serie:recent-read',
    async (_event, dataPath: string, serie_name: string) => {
      try {
        let pathData: string;

        if (serie_name) {
          pathData = await fileManager.getDataPath(serie_name);
        } else {
          pathData = dataPath;
        }

        const serieData = await storageManager.readSerieData(pathData);

        if (!serieData) return { success: false };

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
        const data = await storageManager.readTieInData(childSerie.dataPath);

        if (!data) {
          throw new Error('Dados da Tie-In nao encontrados');
        }

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

  ipcMain.handle(
    'serie:update-serie',
    async (_event, editedData: SerieEditForm) => {
      try {
        const oldData = await storageManager.readSerieData(editedData.dataPath);

        if (!oldData) {
          throw new Error('Dados antigos não encontrados para a série');
        }

        // 1️⃣ Normaliza imagem antes de qualquer merge
        const normalizedCover = await imageManager.processCoverIfNeeded(
          editedData.coverImage,
          oldData.coverImage,
        );

        const preparedData: SerieEditForm = {
          ...editedData,
          coverImage: normalizedCover,
        };

        // 2️⃣ Gera updatedData com diff profundo
        const updatedData = storageManager.buildUpdatedSerie(
          oldData,
          preparedData,
        );

        if (!updatedData.hasChanges) {
          return { success: true }; // nada mudou
        }

        // 3️⃣ Persistência segura
        const finalPath = await storageManager.persistSerie(
          oldData,
          updatedData.data,
        );

        // 4️⃣ Atualização de coleções
        await collectionManager.updateSerie(finalPath);

        await collectionManager.collectionControl(
          finalPath,
          oldData.metadata.collections,
          updatedData.data.metadata.collections,
        );

        return { success: true };
      } catch (e) {
        console.error('Erro no update de série:', e);
        return {
          success: false,
          error: 'Falha ao salvar dados editados da série',
        };
      }
    },
  );
}
