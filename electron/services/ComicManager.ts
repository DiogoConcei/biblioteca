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
import { Literatures } from '../../src/types/auxiliar.interfaces';

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

    comicData.chapters = await this.createEditionData(serie);

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

    if (comicData.childSeries?.length) {
      await Promise.all(
        comicData.childSeries.map((childSerie) =>
          this.createChildCovers(childSerie),
        ),
      );
    }

    await this.fileManager.localUpload(serie.oldPath, comicData.archivesPath);

    await this.systemManager.setMangaId(this.global_id);
    await this.storageManager.writeSerieData(comicData);
  }

  public async createComicData(serie: SerieForm): Promise<Comic> {
    const [nextId, subDir] = await Promise.all([
      this.systemManager.getMangaId().then((id) => id + 1),
      this.searchDirectories(serie.oldPath),
    ]);

    this.global_id = nextId;

    const rightPath = path.join(path.dirname(serie.oldPath), serie.name);

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

  private shortenName(name: string, max = 60): string {
    return name.length > max ? name.slice(0, max).trim() : name;
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
          const fileName = path.basename(orderPth, path.extname(orderPth));
          const rawName = fileName.replace('#', '');
          const safeName = this.shortenName(rawName);

          const sanitizedName =
            await this.fileManager.sanitizeFilename(safeName);
          return {
            id: idx + 1,
            serieName: serie.name,
            name: safeName.replace('#', ''),
            coverImage: '',
            sanitizedName,
            archivesPath: path.join(
              this.userLibrary,
              serie.name,
              path.basename(orderPth),
            ),
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
    const oldPath = path.resolve(serie.oldPath);

    try {
      const entries = await fse.readdir(oldPath, { withFileTypes: true });

      const comicFiles = entries
        .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(e.name))
        .map((e) => path.join(oldPath, e.name));

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
          const safeName =
            String(idx + 1).padStart(3, '0') + chap.sanitizedName;

          const chapterOut = path.join(this.comicsImages, serie.name, safeName);

          chap.chapterPath = chapterOut;

          try {
            await this.storageManager.extractCoverWith7zip(
              comicFiles[idx],
              chapterOut,
            );
            await this.imageManager.normalizeChapter(chapterOut);
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
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(e.name))
      .map((e) => path.join(subPath, e.name));

    const parts = subPath.split(path.sep);

    const index = parts.indexOf(basename);
    const baseAntigo = parts.slice(0, index + 1).join(path.sep);
    const rightDir = subPath.replace(baseAntigo, rightPath);

    return {
      id: idx,
      parentId,
      childSerieName: path.basename(subPath).replace('#', ''),
      compiledComic: chapters.length > 0,
      childSerieArchivesPath: rightDir,
      childSerieDataPath: path.join(
        this.childSeriesData,
        `${path.basename(subPath).replace('#', '')}.json`,
      ),
      childSerieCoverImage: '',
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

  private buildSafeChapterPath(
    serieName: string,
    chapterIndex: number,
  ): string {
    const safeChapter = String(chapterIndex + 1).padStart(3, '0');
    return path.join(this.comicsImages, serieName, safeChapter);
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

  private async createChildCovers(childSeries: ComicTieIn): Promise<void> {
    if (!childSeries.compiledComic) return;
    const archivesPath = childSeries.childSerieArchivesPath;

    const entries = await fse.readdir(archivesPath, { withFileTypes: true });
    const firstChapterEntry = entries.find(
      (e) => e.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(e.name),
    );

    if (!firstChapterEntry) return;
    const firstChapter = path.join(archivesPath, firstChapterEntry.name);
    const serieName = path.basename(path.dirname(firstChapter));
    const chapName = path.basename(firstChapter, path.extname(firstChapter));
    const chapterOut = path.join(this.comicsImages, serieName, chapName);
    await this.storageManager.extractCoverWith7zip(firstChapter, chapterOut);
    await this.imageManager.normalizeChapter(chapterOut);
    childSeries.childSerieCoverImage = await this.coverToComic(chapterOut);
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

    const outputDir = this.buildSafeChapterPath(
      comicData.name,
      chapterToProcess.id - 1,
    );

    try {
      await this.storageManager.extractWith7zip(
        chapterToProcess.archivesPath,
        outputDir,
      );
      await this.imageManager.normalizeChapter(outputDir);

      chapterToProcess.isDownloaded = 'downloaded';
      chapterToProcess.chapterPath = outputDir;
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

    const outputDir = path.join(
      this.comicsImages,
      serieData.name,
      chapterToProcess.name,
    );

    try {
      await this.storageManager.extractWith7zip(
        chapterToProcess.archivesPath,
        outputDir,
      );
      await this.imageManager.normalizeChapter(outputDir);

      chapterToProcess.isDownloaded = 'downloaded';
      chapterToProcess.chapterPath = outputDir;
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

  public async createTieIn(tieIn: ComicTieIn): Promise<void> {
    try {
      if (!tieIn.compiledComic) return;

      const tieInData: TieIn = await this.createTieInData(tieIn);
      tieInData.chapters = await this.createTieInChap(tieInData);

      await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });

      await this.createTieInCovers(tieInData.dataPath);
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
      const sanitizedName = this.fileManager.sanitizeFilename(fileName);

      return {
        id: idx + 1,
        serieName: tieInData.name,
        name: fileName.replace('#', ''),
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

  public async createTieInData(tieIn: ComicTieIn): Promise<TieIn> {
    const id = (await this.systemManager.getMangaId()) + 1;

    const sanitizedName = this.fileManager.sanitizeFilename(
      tieIn.childSerieName,
    );

    const totalChapters = (
      await fse.readdir(tieIn.childSerieArchivesPath, { withFileTypes: true })
    ).map((chap) => path.join(tieIn.childSerieArchivesPath, chap.name)).length;

    const createdAt = new Date().toISOString();

    const childSerieData: TieIn = {
      id,
      name: tieIn.childSerieName,
      sanitizedName,
      archivesPath: tieIn.childSerieArchivesPath,
      chaptersPath: path.join(
        this.imagesFolder,
        'Quadrinho',
        tieIn.childSerieName,
      ),
      totalChapters,
      chaptersRead: 0,
      dataPath: tieIn.childSerieDataPath,
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

    return childSerieData;
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

    const serieName = path.basename(dataPath, path.extname(dataPath));

    await Promise.all(
      tieChapters.map(async (tieChap) => {
        const chapterOut = path.join(
          this.comicsImages,
          serieName,
          tieChap.name,
        );

        try {
          await this.storageManager.extractCoverWith7zip(
            tieChap.archivesPath,
            chapterOut,
          );
          await this.imageManager.normalizeChapter(chapterOut);
          tieChap.coverImage = await this.coverToComic(chapterOut);
          tieChap.chapterPath = chapterOut;
        } catch (error) {
          console.error(
            `Erro no capítulo ${tieChap.name} - (${tieChap.archivesPath}):`,
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
//   const archivesPath =
//     'C:\\Users\\diogo\\Downloads\\Coisa ruim\\02 - Saga Vingadores - A Queda';
//   const name = '02 - Saga Vingadores - A Queda';

//   const dinastiaM: SerieForm = {
//     name: name,
//     genre: 'Super-heróis',
//     author: 'Multiplos',
//     language: 'Português',
//     cover_path:
//       'c:\\Users\\diogo\\Downloads\\Imanges\\84228476f0350e8176d0d7664610c2d7.jpg',
//     literatureForm: 'Quadrinho',
//     collections: ['Marvel'],
//     tags: ['Marvel'],
//     privacy: 'Publica',
//     autoBackup: 'Sim',
//     readingStatus: 'Completo',
//     sanitizedName: fileManager.sanitizeFilename(name),
//     chaptersPath: '',
//     createdAt: '2025-08-08T16:00:00Z',
//     oldPath: archivesPath,
//     archivesPath: archivesPath,
//     deletedAt: '',
//   };

//   await comicManager.createComicSerie(dinastiaM);
// })();

// if (!serieData.childSeries) return;

// const tieIn = (await storageManager.readSerieData(
//   serieData.childSeries[0].childSerieDataPath,
// )) as TieIn;

// console.log(await comicManager.getTieIn(tieIn.dataPath, 1));

// await comicManager.createTieIn(serieData.childSeries[0]);

// (async () => {
//   const imageManager = new ImageManager();
//   const storageManager = new StorageManager();
//   const fileManager = new FileManager();
//   const serieName = 'Black Clover';

//   const dataResponse = await storageManager.getSerieData(serieName);

//   if (!dataResponse.success) {
//     throw new Error('Erro na requisição original');
//   }

//   const oldData: Literatures = dataResponse.data;

//   const newData = {
//     ...oldData,
//     coverImage: await imageManager.encodeImageToBase64(oldData.coverImage),
//   };

//   console.log(newData.coverImage);
// })();
