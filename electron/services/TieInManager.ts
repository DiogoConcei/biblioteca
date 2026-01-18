import path from 'path';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';

import { ComicTieIn, TieIn } from '../types/comic.interfaces';

export default class TieInManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly storageManager: StorageManager = new StorageManager();

  public async crateChildCover(
    serieName: string,
    basePath: string,
  ): Promise<string> {
    try {
      const firstChapter = await this.fileManager.findFirstChapter(basePath);
      const outputPath = path.join(this.dinamicImages, serieName);
      return await this.imageManager.generateCover(firstChapter, outputPath);
    } catch (e) {
      throw new Error('Falha em gerar capa da TieIn');
    }
  }

  public async createTieCovers(dataPath: string): Promise<void> {
    if (!(await this.isCreated(dataPath))) return;

    const tieInData = (await this.storageManager.readSerieData(
      dataPath,
    )) as TieIn;

    const tieChapters = tieInData.chapters;

    if (!tieChapters || tieChapters.length === 0) {
      console.warn(`Nenhum capítulo encontrado para Tie-In em ${dataPath}`);
      return;
    }

    const safeName = this.fileManager.sanitizeFilename(tieInData.name);
    const outputPath = path.join(this.dinamicImages, tieInData.name);

    await Promise.all(
      tieChapters.map(async (chap) => {
        const chapSafe = this.fileManager.sanitizeFilename(chap.name);
        chap.chapterPath = path.join(
          this.comicsImages,
          tieInData.name,
          chapSafe,
        );
        chap.coverImage = await this.imageManager.generateCover(
          chap.archivesPath,
          outputPath,
        );
      }),
    );
    tieInData.metadata.isCreated = true;
    await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
  }

  private async isCreated(dataPath: string): Promise<boolean> {
    try {
      const tieInData = (await this.storageManager.readSerieData(
        dataPath,
      )) as unknown as TieIn;

      if (tieInData.metadata.isCreated) {
        return true;
      }

      return false;
    } catch (e) {
      console.log(`Falha em verificar existência da TieIn`);
      throw e;
    }
  }

  public async createTieIn(
    child: ComicTieIn,
    basePath: string,
  ): Promise<TieIn> {
    const totalChapters = await this.fileManager.singleCountChapter(basePath);
    const safeName = this.fileManager.sanitizeFilename(child.serieName);
    const emptyTie = await this.mountEmptyTieIn();

    return {
      ...emptyTie,
      name: child.serieName,
      sanitizedName: safeName,
      archivesPath: child.archivesPath,
      chaptersPath: path.join(this.imagesFolder, 'Quadrinho', child.serieName),
      totalChapters,
      dataPath: child.dataPath,
    };
  }

  private async mountEmptyTieIn(): Promise<TieIn> {
    const id = (await this.getSerieId()) + 1;
    const createdAt = new Date().toISOString();

    return {
      id,
      name: '',
      sanitizedName: '',
      archivesPath: '',
      chaptersPath: '',
      totalChapters: 0,
      chaptersRead: 0,
      dataPath: '',
      coverImage: '',
      literatureForm: 'Quadrinho',
      chapters: [],
      readingData: {
        lastChapterId: 0,
        lastReadAt: '',
      },
      metadata: {
        lastDownload: 0,
        isFavorite: false,
        isCreated: false,
      },
      createdAt,
      deletedAt: '',
      comments: [],
    };
  }

  public async createChilds(
    archivesPath: string,
    serieName: string,
    parentId: number,
  ): Promise<ComicTieIn[]> {
    const rightPath = path.join(this.userLibrary, serieName);
    const subPaths = await this.fileManager.searchDirectories(archivesPath);

    const childSeries: ComicTieIn[] = await Promise.all(
      subPaths.map(async (subPath, idx) => {
        const chapter = await this.fileManager.findFirstChapter(subPath);

        const relativeToSerie = path.relative(
          subPath.split(path.sep).slice(-1)[0],
          subPath,
        );

        const rightDir = path.join(rightPath, relativeToSerie);

        return {
          ...this.mountEmptyChild(parentId, subPath),
          id: idx,
          compiledComic: chapter ? true : false,
          archivesPath: rightDir,
        };
      }),
    );

    return childSeries;
  }

  private mountEmptyChild(parentId: number, subPath: string) {
    const rawName = path.basename(subPath);

    return {
      id: 0,
      parentId,
      serieName: rawName,
      compiledComic: false,
      archivesPath: '',
      dataPath: path.join(
        this.childSeriesData,
        `${path.basename(subPath)}.json`,
      ),
      coverImage: '',
    };
  }
}

// public async createTieInById(
//     dataPath: string,
//     chapter_id: number,
//   ): Promise<void> {
//     const serieData = await this.storageManager.readSerieData(dataPath);
//     if (!serieData.chapters || !Array.isArray(serieData.chapters)) {
//       throw new Error('Dados de capítulos indefinidos ou inválidos.');
//     }

//     const chapterToProcess = serieData.chapters.find(
//       (chapter) => chapter.id === chapter_id,
//     );

//     if (!chapterToProcess) {
//       throw new Error(`Capítulo com id ${chapter_id} não encontrado.`);
//     }

//     const extName = path.extname(chapterToProcess.archivesPath);
//     const rawName = this.fileManager.sanitizeFilename(chapterToProcess.name);
//     const chapSafe = rawName.replaceAll('.', '_');
//     const chapterOut = path.join(this.comicsImages, serieData.name, chapSafe);

//     console.log('Não normalizado: ', chapterToProcess.archivesPath);
//     console.log(
//       'Normalizado: ',
//       await path.normalize(chapterToProcess.archivesPath),
//     );

//     try {
//       if (extName === '.pdf') {
//         await this.storageManager.convertPdf_overdrive(
//           chapterToProcess.archivesPath,
//           chapterOut,
//         );
//       } else {
//         await this.storageManager.extractWith7zip(
//           chapterToProcess.archivesPath,
//           chapterOut,
//         );
//       }
//       await this.imageManager.normalizeChapter(chapterOut);
//       chapterToProcess.isDownloaded = 'downloaded';
//       chapterToProcess.chapterPath = chapterOut;
//       serieData.metadata.lastDownload = chapterToProcess.id;
//       await this.storageManager.updateSerieData(serieData);
//     } catch (error) {
//       console.error(
//         `Erro ao processar o capítulo "${chapterToProcess.name}" da série "${serieData.name}":`,
//         error,
//       );
//       throw error;
//     }
//   }

// public async createTieIn(tieIn: TieIn): Promise<void> {
//   try {
//     tieIn.chapters = await this.createTieInChap(tieIn);

//     await fse.writeJson(tieIn.dataPath, tieIn, { spaces: 2 });

//     await this.createTieInCovers(tieIn.dataPath);
//   } catch (error) {
//     console.error('Erro ao criar Tie-In:', error);
//     throw error;
//   }
// }

// public async createTieInChap(tieInData: TieIn): Promise<ComicEdition[]> {
//     const entries = await fse.readdir(tieInData.archivesPath, {
//       withFileTypes: true,
//     });

//     const comicEntries = entries
//       .filter((entry) => entry.isFile())
//       .map((entry) => path.join(tieInData.archivesPath, entry.name));

//     if (comicEntries.length === 0) {
//       throw new Error(`Nenhum arquivo encontrado em ${tieInData.archivesPath}`);
//     }

//     const orderComics = await this.fileManager.orderComic(comicEntries);

//     const chapters: ComicEdition[] = orderComics.map((orderPath, idx) => {
//       const fileName = path.basename(orderPath, path.extname(orderPath));
//       const rawName = fileName.replace('#', '');
//       const safeName = this.fileManager.shortenName(rawName);
//       const sanitizedName = this.fileManager.sanitizeFilename(safeName);

//       return {
//         id: idx + 1,
//         serieName: tieInData.name,
//         name: fileName,
//         coverImage: '',
//         sanitizedName,
//         archivesPath: path.join(
//           tieInData.archivesPath,
//           path.basename(orderPath),
//         ),
//         chapterPath: '',
//         createdAt: tieInData.createdAt,
//         isRead: false,
//         isDownloaded: 'not_downloaded',
//         page: {
//           lastPageRead: 0,
//           favoritePage: 0,
//         },
//       };
//     });

//     return chapters;
//   }

//  public async getTieIn(
//     dataPath: string,
//     chapter_id: number,
//   ): Promise<string[] | string> {
//     try {
//       const tieIn = await this.storageManager.readSerieData(dataPath);

//       if (!tieIn.chapters || tieIn.chapters.length === 0) {
//         throw new Error('Nenhum capítulo encontrado.');
//       }

//       const chapter = tieIn.chapters.find((chap) => chap.id === chapter_id);

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
