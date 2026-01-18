import path from 'path';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import StorageManager from './StorageManager';
import ImageManager from './ImageManager';
import TieInManager from './TieInManager';

import { Comic, ComicEdition, ComicTieIn } from '../types/comic.interfaces';

import { SerieForm } from '../../src/types/series.interfaces';

export default class ComicManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly tieManager: TieInManager = new TieInManager();
  private readonly storageManager: StorageManager = new StorageManager();

  public async createComic(serie: SerieForm): Promise<boolean> {
    const comicData = await this.mountEmptyComic(serie);
    comicData.chapters = await this.createEdition(
      comicData.name,
      serie.oldPath,
    );
    comicData.childSeries = await this.tieManager.createChilds(
      serie.oldPath,
      serie.name,
      comicData.id,
    );

    if (comicData.childSeries) return false;
  }

  public async createEdition(
    serieName: string,
    archivesPath: string,
  ): Promise<ComicEdition[]> {
    const [comicEntries] = await this.fileManager.searchChapters(archivesPath);
    const orderComics = await this.fileManager.orderComic(comicEntries);

    const chapters = await Promise.all(
      orderComics.map(async (comicPath, idx) => {
        const fileName = path
          .basename(comicPath, path.extname(comicPath))
          .replaceAll('#', '');
        const sanitizedName = this.fileManager.sanitizeFilename(fileName);

        return {
          ...this.mountEmptyEdition(serieName, fileName),
          id: idx,
          sanitizedName,
        };
      }),
    );

    return chapters;
  }

  public async createEditionCovers(
    archivesPath: string,
    comicEdition: ComicEdition[],
  ) {
    if (comicEdition.length === 0) return;

    const parse = path.parse(archivesPath);
    const dirName = path.basename(parse.dir);
    const outputPath = path.join(this.dinamicImages, dirName);

    try {
      await Promise.all(
        comicEdition.map(async (chap, idx) => {
          chap.chapterPath = path.join(this.comicsImages, dirName, chap.name);
          chap.coverImage = await this.imageManager.generateCover(
            chap.archivesPath,
            outputPath,
          );
        }),
      );
    } catch (e) {
      console.error(`Falha em gerar capa para as edicoes`);
      throw e;
    }
  }

  private async mountEmptyComic(serie: SerieForm): Promise<Comic> {
    const nextId = (await this.getSerieId()) + 1;
    const subDir = await this.fileManager.searchDirectories(serie.archivesPath);
    const totalChapters = await this.fileManager.countChapters(subDir);

    return {
      id: nextId,
      name: serie.name,
      sanitizedName: serie.sanitizedName,
      archivesPath: path.join(this.userLibrary, serie.name),
      chaptersPath: path.join(
        this.imagesFolder,
        serie.literatureForm,
        serie.name,
      ),
      dataPath: path.join(this.comicsData, `${serie.name}.json`),
      coverImage: serie.cover_path,
      totalChapters,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: serie.literatureForm,
      chaptersRead: 0,
      readingData: { lastChapterId: 1, lastReadAt: '' },
      chapters: [],
      childSeries: [],
      metadata: {
        status: serie.readingStatus,
        collections: serie.collections,
        recommendedBy: '',
        originalOwner: '',
        lastDownload: 0,
        rating: 0,
        isFavorite: serie.collections.includes('Favoritas'),
        privacy: serie.privacy,
        autoBackup: serie.autoBackup,
        compiledComic: false,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }

  private mountEmptyEdition(serieName: string, fileName: string): ComicEdition {
    const createdAt = new Date().toISOString();

    return {
      id: 0,
      serieName: serieName,
      name: fileName,
      coverImage: '',
      sanitizedName: '',
      archivesPath: path.join(this.userLibrary, serieName, fileName),
      chapterPath: '',
      createdAt,
      isRead: false,
      isDownloaded: 'not_downloaded',
      page: {
        lastPageRead: 0,
        favoritePage: 0,
      },
    };
  }
}

// public async createEditionById(
//     dataPath: string,
//     chapter_id: number,
//   ): Promise<void> {
//     const comicData = await this.storageManager.readSerieData(dataPath);

//     if (!comicData.chapters) {
//       throw new Error('Chapters data is undefined.');
//     }

//     const chapterToProcess = comicData.chapters.find(
//       (chapter) => chapter.id === chapter_id,
//     );

//     if (!chapterToProcess) {
//       throw new Error(`Chapter with id ${chapter_id} not found.`);
//     }

//     const extName = path.extname(chapterToProcess.archivesPath);
//     const rawName = this.fileManager.sanitizeFilename(chapterToProcess.name);
//     const chapSafe = rawName.replaceAll('.', '_');
//     const chapterOut = path.join(this.comicsImages, comicData.name, chapSafe);

//     try {
//       await this.storageManager.extractWith7zip(
//         chapterToProcess.archivesPath,
//         chapterOut,
//       );
//       await this.imageManager.normalizeChapter(chapterOut);

//       chapterToProcess.isDownloaded = 'downloaded';
//       chapterToProcess.chapterPath = chapterOut;
//       comicData.metadata.lastDownload = chapterToProcess.id;

//       await this.storageManager.updateSerieData(comicData);
//     } catch (error) {
//       console.error(
//         `Erro ao processar os capítulos em "${comicData.name}":`,
//         error,
//       );
//       throw error;
//     }
//   }

// public async getComic(
//     dataPath: string,
//     chapter_id: number,
//   ): Promise<string[] | string> {
//     try {
//       const comic = await this.storageManager.readSerieData(dataPath);

//       if (!comic.chapters || comic.chapters.length === 0) {
//         throw new Error('Nenhum capítulo encontrado.');
//       }

//       const chapter = comic.chapters.find((chap) => chap.id === chapter_id);

//       if (!chapter || !chapter.chapterPath) {
//         throw new Error('Capítulo não encontrado ou caminho inválido.');
//       }

//       const chapterDirents = await fse.readdir(chapter.chapterPath, {
//         withFileTypes: true,
//       });

//       const imageFiles = chapterDirents
//         .filter(
//           (dirent) =>
//             dirent.isFile() && /\.(jpeg|png|webp|tiff|jpg)$/i.test(dirent.name),
//         )
//         .map((dirent) => path.join(chapter.chapterPath, dirent.name));

//       if (imageFiles.length === 0) {
//         throw new Error('Nenhuma imagem encontrada no capítulo.');
//       }

//       const processedImages =
//         await this.imageManager.encodeImageToBase64(imageFiles);

//       return processedImages;
//     } catch (error) {
//       console.error('Não foi possível encontrar a edição do quadrinho:', error);
//       throw error;
//     }
//   }

// public async uploadChapters(
//   filesPath: string[],
//   dataPath: string,
// ): Promise<ComicEdition[]> {
//   try {
//     const serieData = await this.storageManager.readSerieData(dataPath);

//     if (!serieData.chapters)
//       throw new Error('Dados do capítulo não encontrandos.');

//     const updatedChapters = await this.processChapterData(
//       filesPath,
//       serieData.chapters,
//     );

//     serieData.chapters = updatedChapters;
//     serieData.totalChapters = updatedChapters.length;

//     await this.storageManager.updateSerieData(serieData);

//     const encodeChapter = await Promise.all(
//       updatedChapters.map(async (ch) => {
//         const encodeCover = await this.imageManager.encodeImageToBase64(
//           ch.coverImage!,
//         );

//         return {
//           ...ch,
//           coverImage: encodeCover as string,
//         };
//       }),
//     );
//     return encodeChapter;
//   } catch (err) {
//     console.error('Falha ao processar capítulos enviados: ', err);
//     throw err;
//   }
// }

//  private async processChapterData(
//     filesPath: string[],
//     chapters: ComicEdition[],
//   ): Promise<ComicEdition[]> {
//     const chapterMap = new Map(chapters.map((ch) => [ch.archivesPath, ch]));
//     const existingPaths = chapters.map((ch) => ch.archivesPath);
//     const allPaths = [...existingPaths, ...filesPath];
//     const orderedPaths = await this.fileManager.orderByChapters(allPaths);

//     const date = new Date().toISOString();

//     const result: ComicEdition[] = await Promise.all(
//       orderedPaths.map(async (chapterPath) => {
//         const existing = chapterMap.get(chapterPath);

//         if (existing) {
//           return existing;
//         }

//         const name = path.basename(chapterPath, path.extname(chapterPath));
//         const sanitizedName = this.fileManager.sanitizeFilename(name);
//         const archivesPath = path.join(
//           this.userLibrary,
//           chapters[0].serieName,
//           path.basename(chapterPath),
//         );

//         const [outputPath, coverImage] = await this.processCoverImage(
//           chapterPath,
//           chapters[0].serieName,
//           name,
//         );

//         await fse.move(chapterPath, archivesPath);

//         return {
//           id: 0,
//           serieName: chapters[0].serieName,
//           name,
//           coverImage: coverImage,
//           sanitizedName,
//           archivesPath: archivesPath,
//           chapterPath: outputPath,
//           createdAt: date,
//           isRead: false,
//           isDownloaded: 'not_downloaded',
//           page: {
//             lastPageRead: 0,
//             favoritePage: 0,
//           },
//         };
//       }),
//     );

//     result.forEach((ch, idx) => {
//       ch.id = idx + 1;
//     });

//     return result;
//   }
