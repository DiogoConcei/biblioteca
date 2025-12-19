import FileSystem from './abstract/FileSystem';
import SystemManager from './SystemManager';
import FileManager from './FileManager';
import ValidationManager from './ValidationManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';
import CollectionsManager from './CollectionsManager';
import fse from 'fs-extra';
import path from 'path';

import { SerieForm } from '../../src/types/series.interfaces';
import {
  Comic,
  ComicEdition,
  ComicTieIn,
  TieIn,
} from '../types/comic.interfaces';

export default class ComicManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly systemManager: SystemManager = new SystemManager();
  private readonly validationManager: ValidationManager =
    new ValidationManager();
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private global_id: number = 0;

  constructor() {
    super();
  }

  public async createComicSerie(serie: SerieForm): Promise<void> {
    const comicData = await this.createComicData(serie);
    const editions = await this.createEditionData(serie);
    comicData.chapters = editions;

    if (comicData.childSeries) {
      await Promise.all(
        comicData.childSeries.map(async (child) => {
          const oldPath = await this.fileManager.findPath(
            serie.oldPath,
            child.serieName,
          );

          if (oldPath) {
            const data = await this.createTieInData(child, oldPath);
            await this.createChildCovers(child, oldPath);
            await this.storageManager.writeSerieData(data);
          }
        }),
      );
    }

    if (comicData.chapters.length === 0)
      comicData.metadata.compiledComic = true;
    else await this.createCovers(serie, comicData);

    if (await this.validationManager.isDinamicImage(comicData.coverImage)) {
      const comicCover = await this.imageManager.normalizeImage(
        comicData.coverImage,
        this.showcaseImages,
      );
      await fse.remove(comicData.coverImage);
      comicData.coverImage = comicCover;
    }

    const normalizedMangaData =
      this.storageManager.createNormalizedData(comicData);
    await this.collectionsManager.serieToCollection(normalizedMangaData);

    await this.systemManager.setMangaId(this.global_id);
    await this.storageManager.writeSerieData(comicData);
    await this.fileManager.localUpload(serie.oldPath, comicData.archivesPath);
  }

  public async createTieInData(
    child: ComicTieIn,
    basePath: string,
  ): Promise<TieIn> {
    const id = (await this.systemManager.getMangaId()) + 1;
    const createdAt = new Date().toISOString();

    const totalChapters = (
      await fse.readdir(basePath, {
        withFileTypes: true,
      })
    ).filter((entry) => entry.isFile()).length;

    const safeName = this.fileManager.shortenName(
      this.fileManager.sanitizeFilename(child.serieName),
    );

    return {
      id,
      name: child.serieName,
      sanitizedName: safeName,
      archivesPath: child.archivesPath,
      chaptersPath: path.join(this.imagesFolder, 'Quadrinho', child.serieName),
      totalChapters,
      chaptersRead: 0,
      dataPath: child.dataPath,
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

  public async createComicData(serie: SerieForm): Promise<Comic> {
    const [nextId, subDir] = await Promise.all([
      this.systemManager.getMangaId().then((id) => id + 1),
      this.searchDirectories(serie.oldPath),
    ]);

    this.global_id = nextId;

    const rightPath = path.join(this.userLibrary, serie.name);

    const [comics, childSeries] = await Promise.all([
      this.searchComics([serie.oldPath, ...subDir]),
      subDir.length
        ? Promise.all(
            subDir.map((sd, idx) =>
              this.createChildSeries(rightPath, sd, idx, nextId),
            ),
          )
        : Promise.resolve([]),
    ]);

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
      totalChapters: comics.length,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: serie.literatureForm,
      chaptersRead: 0,
      readingData: { lastChapterId: 1, lastReadAt: '' },
      chapters: [],
      childSeries,
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

  public async createEditionData(serie: SerieForm): Promise<ComicEdition[]> {
    try {
      const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });

      const comicEntries = entries
        .filter(
          (entry) => entry.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(entry.name),
        )
        .map((entry) => path.join(serie.oldPath, entry.name));

      if (comicEntries.length === 0) {
        return [];
      }

      const orderComics = await this.fileManager.orderComic(comicEntries);

      const chapters = await Promise.all(
        orderComics.map(async (orderPth, idx) => {
          const fileName = path.basename(orderPth);
          const rawName = fileName.replace('#', '');
          const safeName = this.fileManager.sanitizeFilename(
            this.fileManager.shortenName(rawName),
          );

          return {
            id: idx + 1,
            serieName: serie.name,
            name: path.basename(fileName, path.extname(fileName)),
            coverImage: '',
            sanitizedName: path.basename(safeName, path.extname(safeName)),
            archivesPath: path.join(this.userLibrary, serie.name, fileName),
            chapterPath: '',
            createdAt: serie.createdAt,
            isRead: false,
            isDownloaded: 'not_downloaded' as
              | 'not_downloaded'
              | 'downloading'
              | 'downloaded',
            page: {
              lastPageRead: 0,
              favoritePage: 0,
            },
          };
        }),
      );

      return chapters;
    } catch (e) {
      console.error(`Falha em criar dados da edição`, e);
      throw e;
    }
  }

  public async createCovers(serie: SerieForm, comicData: Comic): Promise<void> {
    try {
      const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });
      const comicFiles = entries
        .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
        .map((e) => path.join(serie.oldPath, e.name));

      if (!comicData.chapters || comicData.chapters.length === 0) {
        throw new Error('Comic data chapters are missing or empty');
      }

      if (comicFiles.length < comicData.chapters.length) {
        throw new Error(
          'Número de arquivos de quadrinhos é menor que o número de capítulos',
        );
      }

      await Promise.all(
        comicData.chapters.map(async (chap, idx) => {
          const chapterOut = this.fileManager.buildSafeChapterPath(
            this.comicsImages,
            serie.name,
            chap.name,
          );
          try {
            await this.storageManager.extractCoverWith7zip(
              comicFiles[idx],
              chapterOut,
            );
            await this.imageManager.normalizeChapter(chapterOut);
            chap.chapterPath = chapterOut;
            chap.coverImage = await this.coverToComic(chapterOut);
          } catch (e) {
            console.error(
              `Erro no capítulo ${chap.name} - arquivo ${comicFiles[idx]}:`,
              e,
            );
            throw e;
          }
        }),
      );
    } catch (e) {
      console.error('Erro ao criar capas:', e);
      throw e;
    }
  }

  private async coverToComic(chapterPath: string): Promise<string> {
    try {
      const files = await fse.readdir(chapterPath, { withFileTypes: true });
      const firstImage = files.find(
        (file) => file.isFile() && /\.(jpe?g|png|webp)$/i.test(file.name),
      );

      return firstImage ? path.join(chapterPath, firstImage.name) : '';
    } catch (err) {
      console.error(
        `Falha ao encontrar a capa para o capítulo "${chapterPath}":`,
        err,
      );
      throw err;
    }
  }

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

  public async searchDirectories(oldPath: string): Promise<string[]> {
    try {
      const entries = await fse.readdir(oldPath, { withFileTypes: true });
      const directories: string[] = [];
      const dirEntries = entries.filter((e) => e.isDirectory());
      const dirPaths = dirEntries.map((e) => path.join(oldPath, e.name));
      const subDirsArrays = await Promise.all(
        dirPaths.map((dir) => this.searchDirectories(dir)),
      );
      for (const dir of dirPaths) directories.push(dir);
      for (const subDirs of subDirsArrays) directories.push(...subDirs);
      return directories;
    } catch (e) {
      console.error(`Falha em encontrar sub diretórios em ${oldPath}`, e);
      throw e;
    }
  }

  private async searchComics(directories: string[]): Promise<string[]> {
    const comicsPathsArrays = await Promise.all(
      directories.map((dir) =>
        fse
          .readdir(dir, { withFileTypes: true })
          .then((entries) =>
            entries
              .filter((e) => e.isFile())
              .map((e) => path.join(dir, e.name)),
          )
          .catch(() => []),
      ),
    );

    return comicsPathsArrays.flat();
  }

  private async createChildCovers(
    child: ComicTieIn,
    basePath: string,
  ): Promise<void> {
    if (!child.compiledComic) return;

    const entries = await fse.readdir(basePath, {
      withFileTypes: true,
    });

    const firstChapterEntry = entries.find(
      (e) => e.isFile() && /\.(cbz|cbr|zip|rar|PDF)$/i.test(e.name),
    );

    if (!firstChapterEntry) return;

    const firstChapter = path.join(basePath, firstChapterEntry.name);
    const ext = path.extname(firstChapter);
    const rawName = path.basename(firstChapter, path.extname(firstChapter));
    const chapName = this.fileManager.sanitizeDirName(rawName);
    const chapterOut = path.join(this.comicsImages, child.serieName, chapName);

    if (ext === '.pdf') {
      await this.storageManager.extractCoverFromPdf(firstChapter, chapterOut);
    } else {
      await this.storageManager.extractCoverWith7zip(firstChapter, chapterOut);
    }
    await this.imageManager.normalizeChapter(chapterOut);
    child.coverImage = await this.coverToComic(chapterOut);
  }

  public async createEditionById(
    dataPath: string,
    chapter_id: number,
  ): Promise<void> {
    const comicData = await this.storageManager.readSerieData(dataPath);

    if (!comicData.chapters) {
      throw new Error('Chapters data is undefined.');
    }

    const chapterToProcess = comicData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );

    if (!chapterToProcess) {
      throw new Error(`Chapter with id ${chapter_id} not found.`);
    }

    const extName = path.extname(chapterToProcess.archivesPath);
    const rawName = this.fileManager.sanitizeFilename(chapterToProcess.name);
    const chapSafe = rawName.replaceAll('.', '_');
    const chapterOut = path.join(this.comicsImages, comicData.name, chapSafe);

    try {
      await this.storageManager.extractWith7zip(
        chapterToProcess.archivesPath,
        chapterOut,
      );
      await this.imageManager.normalizeChapter(chapterOut);

      chapterToProcess.isDownloaded = 'downloaded';
      chapterToProcess.chapterPath = chapterOut;
      comicData.metadata.lastDownload = chapterToProcess.id;

      await this.storageManager.updateSerieData(comicData);
    } catch (error) {
      console.error(
        `Erro ao processar os capítulos em "${comicData.name}":`,
        error,
      );
      throw error;
    }
  }

  public async createTieInById(
    dataPath: string,
    chapter_id: number,
  ): Promise<void> {
    const serieData = await this.storageManager.readSerieData(dataPath);
    if (!serieData.chapters || !Array.isArray(serieData.chapters)) {
      throw new Error('Dados de capítulos indefinidos ou inválidos.');
    }

    const chapterToProcess = serieData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );

    if (!chapterToProcess) {
      throw new Error(`Capítulo com id ${chapter_id} não encontrado.`);
    }

    const extName = path.extname(chapterToProcess.archivesPath);
    const rawName = this.fileManager.sanitizeFilename(chapterToProcess.name);
    const chapSafe = rawName.replaceAll('.', '_');
    const chapterOut = path.join(this.comicsImages, serieData.name, chapSafe);

    console.log('Não normalizado: ', chapterToProcess.archivesPath);
    console.log(
      'Normalizado: ',
      await path.normalize(chapterToProcess.archivesPath),
    );

    try {
      if (extName === '.pdf') {
        await this.storageManager.convertPdf_overdrive(
          chapterToProcess.archivesPath,
          chapterOut,
        );
      } else {
        await this.storageManager.extractWith7zip(
          chapterToProcess.archivesPath,
          chapterOut,
        );
      }
      await this.imageManager.normalizeChapter(chapterOut);
      chapterToProcess.isDownloaded = 'downloaded';
      chapterToProcess.chapterPath = chapterOut;
      serieData.metadata.lastDownload = chapterToProcess.id;
      await this.storageManager.updateSerieData(serieData);
    } catch (error) {
      console.error(
        `Erro ao processar o capítulo "${chapterToProcess.name}" da série "${serieData.name}":`,
        error,
      );
      throw error;
    }
  }

  public async createTieIn(tieIn: TieIn): Promise<void> {
    try {
      tieIn.chapters = await this.createTieInChap(tieIn);

      await fse.writeJson(tieIn.dataPath, tieIn, { spaces: 2 });

      await this.createTieInCovers(tieIn.dataPath);
    } catch (error) {
      console.error('Erro ao criar Tie-In:', error);
      throw error;
    }
  }

  public async createTieInChap(tieInData: TieIn): Promise<ComicEdition[]> {
    const entries = await fse.readdir(tieInData.archivesPath, {
      withFileTypes: true,
    });

    const comicEntries = entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(tieInData.archivesPath, entry.name));

    if (comicEntries.length === 0) {
      throw new Error(`Nenhum arquivo encontrado em ${tieInData.archivesPath}`);
    }

    const orderComics = await this.fileManager.orderComic(comicEntries);

    const chapters: ComicEdition[] = orderComics.map((orderPath, idx) => {
      const fileName = path.basename(orderPath, path.extname(orderPath));
      const rawName = fileName.replace('#', '');
      const safeName = this.fileManager.shortenName(rawName);
      const sanitizedName = this.fileManager.sanitizeFilename(safeName);

      return {
        id: idx + 1,
        serieName: tieInData.name,
        name: fileName,
        coverImage: '',
        sanitizedName,
        archivesPath: path.join(
          tieInData.archivesPath,
          path.basename(orderPath),
        ),
        chapterPath: '',
        createdAt: tieInData.createdAt,
        isRead: false,
        isDownloaded: 'not_downloaded',
        page: {
          lastPageRead: 0,
          favoritePage: 0,
        },
      };
    });

    return chapters;
  }

  public async createTieInCovers(dataPath: string): Promise<void> {
    if (await this.validationManager.tieInCreated(dataPath)) {
      return;
    }

    const tieInData = (await this.storageManager.readSerieData(
      dataPath,
    )) as TieIn;
    const tieChapters = tieInData.chapters;
    if (!tieChapters || tieChapters.length === 0) {
      console.warn(`Nenhum capítulo encontrado para Tie-In em ${dataPath}`);
      return;
    }

    await Promise.all(
      tieChapters.map(async (chap) => {
        const rawName = this.fileManager.sanitizeFilename(chap.name);
        const chapSafe = rawName.replaceAll('.', '_');
        const safeDir = this.fileManager
          .sanitizeDirName(tieInData.name)
          .slice(0, 10);
        const chapterOut = path.join(this.dinamicImages, safeDir, chapSafe);

        const ext = path.extname(chap.archivesPath);
        let coverPath = '';

        try {
          if (ext === '.pdf') {
            coverPath = await this.storageManager.extractCoverFromPdf(
              chap.archivesPath,
              chapterOut,
            );
          } else {
            coverPath = await this.storageManager.extractCoverWith7zip(
              chap.archivesPath,
              chapterOut,
            );
          }

          chap.chapterPath = path.join(this.comicsImages, safeDir, chapSafe);
          chap.chapterPath = path.join(this.comicsImages, safeDir, chapSafe);

          await this.imageManager.normalizeChapter(coverPath);
          chap.coverImage = await this.coverToComic(coverPath);
        } catch (error) {
          console.error(
            `Erro no capítulo ${chap.name} - (${chap.archivesPath}):`,
            error,
          );
          throw error;
        }
      }),
    );

    tieInData.metadata.isCreated = true;
    await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
  }

  public async getComic(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[] | string> {
    try {
      const comic = await this.storageManager.readSerieData(dataPath);

      if (!comic.chapters || comic.chapters.length === 0) {
        throw new Error('Nenhum capítulo encontrado.');
      }

      const chapter = comic.chapters.find((chap) => chap.id === chapter_id);

      if (!chapter || !chapter.chapterPath) {
        throw new Error('Capítulo não encontrado ou caminho inválido.');
      }

      const chapterDirents = await fse.readdir(chapter.chapterPath, {
        withFileTypes: true,
      });

      const imageFiles = chapterDirents
        .filter(
          (dirent) =>
            dirent.isFile() && /\.(jpeg|png|webp|tiff|jpg)$/i.test(dirent.name),
        )
        .map((dirent) => path.join(chapter.chapterPath, dirent.name));

      if (imageFiles.length === 0) {
        throw new Error('Nenhuma imagem encontrada no capítulo.');
      }

      const processedImages =
        await this.imageManager.encodeImageToBase64(imageFiles);

      return processedImages;
    } catch (error) {
      console.error('Não foi possível encontrar a edição do quadrinho:', error);
      throw error;
    }
  }

  public async getTieIn(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[] | string> {
    try {
      const tieIn = await this.storageManager.readSerieData(dataPath);

      if (!tieIn.chapters || tieIn.chapters.length === 0) {
        throw new Error('Nenhum capítulo encontrado.');
      }

      const chapter = tieIn.chapters.find((chap) => chap.id === chapter_id);

      if (!chapter || !chapter.chapterPath) {
        throw new Error('Capítulo não encontrado ou caminho inválido.');
      }

      const chapterDirents = await fse.readdir(chapter.chapterPath, {
        withFileTypes: true,
      });

      const imageFiles = chapterDirents
        .filter(
          (dirent) =>
            dirent.isFile() && /\.(jpeg|png|webp|tiff|jpg)$/i.test(dirent.name),
        )
        .map((dirent) => path.join(chapter.chapterPath, dirent.name));

      if (imageFiles.length === 0) {
        throw new Error('Nenhuma imagem encontrada no capítulo.');
      }

      const processedImages =
        await this.imageManager.encodeImageToBase64(imageFiles);

      return processedImages;
    } catch (error) {
      console.error('Não foi possível encontrar a edição do quadrinho:', error);
      throw error;
    }
  }
}

// (async () => {
//   const fileManager = new FileManager();
//   const storageManager = new StorageManager();
//   const comicManager = new ComicManager();
//   const name = '03 - Capitão América Vol 5 - 1 a 21';
//   const archivesPath =
//     'C:\\Users\\diogo\\Desktop\\03 - Capitão América Vol 5 - 1 a 21';

//   // const dataPath =
//   //   'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\json files\\childSeries\\Versão PDF.json';
//   // const tieIn = (await storageManager.readSerieData(dataPath)) as TieIn;

//   // await comicManager.createTieIn(tieIn);
//   const dinastiaM: SerieForm = {
//     name: name,
//     genre: 'Marvel',
//     author: 'Michael Bendis',
//     language: 'Português',
//     cover_path:
//       'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\images files\\showcase images\\Capitao.webp',
//     literatureForm: 'Quadrinho',
//     collections: ['Marvel'],
//     tags: ['Super Herói'],
//     privacy: 'Publica',
//     autoBackup: 'Sim',
//     readingStatus: 'Completo',
//     sanitizedName: fileManager.sanitizeFilename(name),
//     chaptersPath: '',
//     archivesPath: archivesPath,
//     createdAt: '2025-08-08T16:00:00Z',
//     oldPath: archivesPath,
//     deletedAt: '',
//   };

//   await comicManager.createComicSerie(dinastiaM);
// })();
