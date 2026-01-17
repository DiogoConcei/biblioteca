import path from 'path';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import StorageManager from './StorageManager';

import {
  Comic,
  ComicEdition,
  ComicTieIn,
  TieIn,
} from '../types/comic.interfaces';

import { SerieForm } from '../../src/types/series.interfaces';

export default class ComicManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();

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

  private async mountEmptyComic(serie: SerieForm): Promise<Comic> {
    const nextId = (await this.getSerieId()) + 1;
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
      totalChapters: 0,
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

//   public async createCovers(serie: SerieForm, comicData: Comic): Promise<void> {
//     try {
//       const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });
//       const comicFiles = entries
//         .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
//         .map((e) => path.join(serie.oldPath, e.name));
//       if (!comicData.chapters || comicData.chapters.length === 0) {
//         throw new Error('Comic data chapters are missing or empty');
//       }
//       if (comicFiles.length < comicData.chapters.length) {
//         throw new Error(
//           'Número de arquivos de quadrinhos é menor que o número de capítulos',
//         );
//       }

//       await Promise.all(
//         comicData.chapters.map(async (chap, idx) => {
//           let coverPath = '';
//           const ext = path.extname(chap.archivesPath);
//           const rawName = chap.name;
//           const chapName = this.fileManager.sanitizeDirName(rawName);
//           const chapterOut = path.join(
//             this.comicsImages,
//             comicData.name,
//             chapName,
//           );

//           try {
//             chap.chapterPath = chapterOut;
//             chap.coverImage = resultCover;
//           } catch (e) {
//             console.error(
//               `Erro no capítulo ${chap.name} - arquivo ${comicFiles[idx]}:`,
//               e,
//             );
//             throw e;
//           }
//         }),
//       );
//     } catch (e) {
//       console.error('Erro ao criar capas:', e);
//       throw e;
//     }
//   }

//   private async processCoverImage(
//     chapterPath: string,
//     chName: string,
//     serieName: string,
//   ): Promise<string[]> {
//     const chapterOut = path.join(this.comicsImages, serieName, chapName);

//     return [chapterOut, resultCover];
//   }

//   public async createTieInCovers(dataPath: string): Promise<void> {
//     if (await this.validationManager.tieInCreated(dataPath)) {
//       return;
//     }

//     const tieInData = (await this.storageManager.readSerieData(
//       dataPath,
//     )) as TieIn;
//     const tieChapters = tieInData.chapters;
//     if (!tieChapters || tieChapters.length === 0) {
//       console.warn(`Nenhum capítulo encontrado para Tie-In em ${dataPath}`);
//       return;
//     }

//     await Promise.all(
//       tieChapters.map(async (chap) => {
//         const ext = path.extname(chap.archivesPath);
//         let coverPath = '';
//         const rawName = this.fileManager.sanitizeFilename(chap.name);
//         const chapSafe = rawName.replaceAll('.', '_');
//         const safeDir = this.fileManager
//           .sanitizeDirName(tieInData.name)
//           .slice(0, 10)
//           .replaceAll('.', '_');
//         const chapterOut = path.join(this.comicsImages, safeDir, chapSafe);
//         const outputPath = path.join(this.dinamicImages, tieInData.name);

//         try {
//
//           chap.chapterPath = chapterOut;
//           chap.coverImage = resultCover;
//         } catch (error) {
//           console.error(
//             `Erro no capítulo ${chap.name} - (${chap.archivesPath}):`,
//             error,
//           );
//           throw error;
//         }
//       }),
//     );

//     tieInData.metadata.isCreated = true;
//     await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
//   }
