import path from 'path';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import { ComicTieIn } from '../types/comic.interfaces';

export default class TieInManager extends LibrarySystem {
  public async createChildSeries(
    rightPath: string,
    subPath: string,
    idx: number,
    parentId: number,
  ): Promise<ComicTieIn> {
    const basename = path.basename(rightPath);
    const entries = await fse.readdir(subPath, { withFileTypes: true });
    const chapters = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
      .map((e) => path.join(subPath, e.name));
    const parts = subPath.split(path.sep);
    const index = parts.indexOf(basename);
    const baseAntigo = parts.slice(0, index + 1).join(path.sep);
    const rightDir = subPath.replace(baseAntigo, rightPath);
    const rawName = path.basename(subPath);
    return {
      id: idx,
      parentId,
      serieName: rawName,
      compiledComic: chapters.length > 0,
      archivesPath: rightDir,
      dataPath: path.join(
        this.childSeriesData,
        `${path.basename(subPath)}.json`,
      ),
      coverImage: '',
    };
  }
}

// export default class TieInManager extends LibrarySystem {
//   public async createTieInData(
//     child: ComicTieIn,
//     basePath: string,
//   ): Promise<TieIn> {
//     const id = (await this.systemManager.getMangaId()) + 1;
//     const createdAt = new Date().toISOString();

//     const totalChapters = (
//       await fse.readdir(basePath, {
//         withFileTypes: true,
//       })
//     ).filter((entry) => entry.isFile()).length;

//     const safeName = this.fileManager.shortenName(
//       this.fileManager.sanitizeFilename(child.serieName),
//     );

//     return {
//       id,
//       name: child.serieName,
//       sanitizedName: safeName,
//       archivesPath: child.archivesPath,
//       chaptersPath: path.join(this.imagesFolder, 'Quadrinho', child.serieName),
//       totalChapters,
//       chaptersRead: 0,
//       dataPath: child.dataPath,
//       coverImage: '',
//       literatureForm: 'Quadrinho',
//       chapters: [],
//       readingData: {
//         lastChapterId: 0,
//         lastReadAt: '',
//       },
//       metadata: {
//         lastDownload: 0,
//         isFavorite: false,
//         isCreated: false,
//       },
//       createdAt,
//       deletedAt: '',
//       comments: [],
//     };
//   }

//   public async createTieInById(
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

//   public async createTieIn(tieIn: TieIn): Promise<void> {
//     try {
//       tieIn.chapters = await this.createTieInChap(tieIn);

//       await fse.writeJson(tieIn.dataPath, tieIn, { spaces: 2 });

//       await this.createTieInCovers(tieIn.dataPath);
//     } catch (error) {
//       console.error('Erro ao criar Tie-In:', error);
//       throw error;
//     }
//   }

//   public async createTieInChap(tieInData: TieIn): Promise<ComicEdition[]> {
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

//   public async getTieIn(
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
// }
