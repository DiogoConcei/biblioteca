import { IpcMain } from 'electron';
import StorageManager from '../services/StorageManager.ts';
import ImageManager from '../services/ImageManager.ts';

export default function seriesHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const imageManager = new ImageManager();

  ipcMain.handle('serie:get-all', async () => {
    try {
      const getData = await storageManager.seriesData();

      const procesData = await Promise.all(
        getData.map(async serieData => {
          const encodedImage = await imageManager.encodeImageToBase64(serieData.coverImage);

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

  // ipcMain.handle('get-manga-serie', async (_event, serieName: string) => {
  //   try {
  //     const data = await storageManager.selectMangaData(serieName);

  //     const processedData = {
  //       ...data,
  //       coverImage: await imageManager.encodeImageToBase64(data.coverImage),
  //     };

  //     return processedData;
  //   } catch (error) {
  //     console.error('Erro ao buscar dados da series:', error);
  //     throw error;
  //   }
  // });

  // ipcMain.handle('get-comic-serie', async (_event, serieName: string) => {
  //   try {
  //     const data = await storageManager.selectComicData(serieName);

  //     const updatedChapters = await Promise.all(
  //       data.chapters.map(async chapter => {
  //         const encodedCover = await imageManager.encodeImageToBase64(chapter.coverPath);

  //         return {
  //           ...chapter,
  //           coverPath: encodedCover,
  //         };
  //       }),
  //     );

  //     const processedData = {
  //       ...data,
  //       chapters: updatedChapters,
  //     };

  //     return processedData;
  //   } catch (error) {
  //     console.error('Erro ao buscar dados da series:', error);
  //     throw error;
  //   }
  // });
}
