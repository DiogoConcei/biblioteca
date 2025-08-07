import FileSystem from './abstract/FileSystem';
import SystemManager from './SystemManager';
import FileManager from './FileManager';
import ValidationManager from './ValidationManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';
import CollectionsManager from './CollectionsManager';
import fse from 'fs-extra';
import path from 'path';
import { SerieForm } from '../../src/types/series.interfaces.ts';
import {
  Comic,
  ComicEdition,
  ComicTieIn,
  childSerie,
} from '../types/comic.interfaces.ts';

export default class ComicManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly systemManager: SystemManager = new SystemManager();
  private readonly validationManager: ValidationManager =
    new ValidationManager();
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private global_id: number;

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
    await this.storageManager.writeSerieData(comicData);
    await this.systemManager.setMangaId(this.global_id);
    await this.fileManager.localUpload(serie.oldPath, comicData.archivesPath);
  }

  public async createEditionData(serie: SerieForm): Promise<ComicEdition[]> {
    try {
      const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });

      const comicEntries = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(entry.parentPath, entry.name));
      if (comicEntries.length === 0) {
        throw new Error('Nenhum arquivo encontrado');
      }
      const orderComics = await this.fileManager.orderComic(comicEntries);
      const chapters: ComicEdition[] = await Promise.all(
        orderComics.map(async (orderPth, idx) => {
          const fileName = path.basename(orderPth, path.extname(orderPth));
          const sanitizedName = await this.fileManager.sanitizeFilename(
            fileName,
          );
          return {
            id: idx + 1,
            name: fileName.replace('#', ''),
            coverPath: '',
            sanitizedName: sanitizedName,
            archivesPath: path.join(
              this.userLibrary,
              serie.name,
              path.basename(orderPth),
            ),
            chapterPath: '',
            createdAt: serie.createdAt,
            isRead: false,
            isDownload: false,
            page: {
              lastPageRead: 0,
              favoritePage: 0,
            },
          };
        }),
      );
      return chapters;
    } catch (e) {
      console.error(`Falha em criar dados da edição`);
      throw e;
    }
  }

  public async createCovers(serie: SerieForm, comicData: Comic): Promise<void> {
    try {
      const oldPath = path.resolve(serie.oldPath);
      let entries: fse.Dirent[];

      try {
        entries = await fse.readdir(oldPath, { withFileTypes: true });
      } catch (e) {
        console.log(`Erro ao ler diretório ${oldPath}: `, e);
        throw e;
      }

      const comicFiles = entries
        .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(e.name))
        .map((e) => path.join(e.parentPath, e.name));

      await Promise.all(
        comicData.chapters!.map(async (chap, idx) => {
          const chapterOut = path.join(
            this.comicsImages,
            serie.name,
            chap.name,
          );

          try {
            chap.chapterPath = chapterOut;
            await this.storageManager.extractCoverWith7zip(
              comicFiles[idx],
              chapterOut,
            );
            await this.imageManager.normalizeChapter(chapterOut);
            chap.coverPath = await this.coverToComic(chapterOut);
          } catch (e) {
            console.log(`Erro no capítulo ${chap.name} - (${comicFiles[idx]})`);
            throw e;
          }
        }),
      );
    } catch (e) {
      throw e;
    }
  }

  private async coverToComic(chapterPath: string): Promise<string> {
    try {
      const files = await fse.readdir(chapterPath, { withFileTypes: true });
      const firstImage = files.find(
        (file) => file.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(file.name),
      );

      if (firstImage) {
        const imagePath = path.join(chapterPath, firstImage.name);
        return imagePath;
      } else {
        return '';
      }
    } catch (err) {
      console.error(
        `❌ Falha ao encontrar a capa para o capítulo "${chapterPath}":`,
        err,
      );
      throw err;
    }
  }

  public async createComicData(serie: SerieForm): Promise<Comic> {
    this.global_id = (await this.systemManager.getMangaId()) + 1;
    const subDir = await this.searchDirectories(serie.oldPath);
    const allDir = [serie.oldPath, ...subDir];
    const comics = await this.searchComics(allDir);
    const totalChapters = comics.length;
    let childSeries: ComicTieIn[] = [];

    if (subDir.length > 0) {
      childSeries = await Promise.all(
        subDir.map((subSerie) => this.createChildSeries(serie.name, subSerie)),
      );
    }

    return {
      id: this.global_id,
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
      totalChapters: totalChapters,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: serie.literatureForm,
      chaptersRead: 0,
      readingData: {
        lastChapterId: 1,
        lastReadAt: '',
      },
      chapters: [],
      childSeries: childSeries,
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

  public async createChildSeries(
    serieName: string,
    subPath: string,
  ): Promise<ComicTieIn> {
    try {
      return {
        id: this.global_id + 1,
        parentId: this.global_id,
        childSerieName: path.basename(subPath),
        childSerieArchivesPath: path.join(
          this.userLibrary,
          serieName,
          path.basename(subPath),
        ),
        childSerieDataPath: path.join(
          this.childSeriesData,
          `${path.basename(subPath)}.json`,
        ),
        childSerieCoverPath: '',
      };
    } catch (e) {
      console.error(`Erro ao criar as Tie-In: `);
      throw e;
    }
  }

  public async searchDirectories(oldPath: string): Promise<string[]> {
    let directories: string[] = [];

    try {
      const entries = await fse.readdir(oldPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(oldPath, entry.name);
          directories.push(fullPath);
          const subDirs = await this.searchDirectories(fullPath);
          directories.push(...subDirs);
        }
      }
    } catch (e) {
      console.error(`Falha em encontrar sub diretórios em ${oldPath}`);
      throw e;
    }

    return directories;
  }

  private async searchComics(directories: string[]): Promise<string[]> {
    const comicsPathsArrays = await Promise.all(
      directories.map(async (dir) => {
        try {
          return (await fse.readdir(dir, { withFileTypes: true }))
            .filter((e) => e.isFile())
            .map((e) => path.join(dir, e.name));
        } catch {
          return [];
        }
      }),
    );

    return comicsPathsArrays.flat();
  }

  public async createEditionById(dataPath: string, chapter_id: number) {
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

    const outputDir = path.join(
      this.comicsImages,
      comicData.name,
      chapterToProcess.name,
    );

    try {
      await this.storageManager.extractWith7zip(
        chapterToProcess.archivesPath,
        outputDir,
      );

      await this.imageManager.normalizeChapter(outputDir);
      chapterToProcess.isDownload = true;
      chapterToProcess.chapterPath = outputDir;
      comicData.metadata.lastDownload = chapterToProcess.id;

      await this.storageManager.updateSerieData(comicData);
    } catch (e) {
      console.error(
        `Erro ao processar os capítulos em "${comicData.name}": ${e}`,
      );
      throw e;
    }
  }

  public async createTieInById(dataPath: string, chapter_id: number) {
    const comicData = (await this.storageManager.readSerieData(
      dataPath,
    )) as unknown;
    const serieData = comicData as childSerie;

    if (!serieData.chapters) {
      throw new Error('Chapters data is undefined.');
    }
    const chapterToProcess = serieData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );
    if (!chapterToProcess) {
      throw new Error(`Chapter with id ${chapter_id} not found.`);
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
      chapterToProcess.isDownload = true;
      chapterToProcess.chapterPath = outputDir;
      serieData.metadata.lastDownload = chapterToProcess.id;

      await this.storageManager.updateSerieData(serieData);
    } catch (e) {
      console.error(
        `Erro ao processar os capítulos em "${serieData.name}": ${e}`,
      );
      throw e;
    }
  }

  public async getComic(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[] | string> {
    try {
      const data = await this.storageManager.readSerieData(dataPath);
      const comic = data as Comic;
      const chaptersData: ComicEdition[] = comic.chapters as ComicEdition[];
      const chapter = chaptersData.find((chap) => chap.id === chapter_id);

      if (!chapter) {
        throw new Error('Capítulo não encontrado');
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

      const processedImages = await this.imageManager.encodeImageToBase64(
        imageFiles,
      );

      return processedImages;
    } catch (e) {
      console.error('Não foi possível encontrar a edição do quadrinho');
      throw e;
    }
  }
  public async getTieIn(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[] | string> {
    try {
      const data = await this.storageManager.readSerieData(dataPath);
      const comic = data as childSerie;
      const chaptersData: ComicEdition[] = comic.chapters as ComicEdition[];
      const chapter = chaptersData.find((chap) => chap.id === chapter_id);

      if (!chapter) {
        throw new Error('Capítulo não encontrado');
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

      const processedImages = await this.imageManager.encodeImageToBase64(
        imageFiles,
      );

      return processedImages;
    } catch (e) {
      console.error('Não foi possível encontrar a edição do quadrinho');
      throw e;
    }
  }

  public async createTieIn(tieIn: ComicTieIn): Promise<string> {
    try {
      const dir = path.dirname(tieIn.childSerieDataPath);

      if (!(await fse.pathExists(dir))) {
        await fse.mkdir(dir, { recursive: true });
      }

      const tieInData: childSerie = await this.createTieInData(tieIn);
      const tieInChap: ComicEdition[] = await this.createTieInChap(tieInData);
      tieInData.chapters = tieInChap;
      await this.createTieCover(tieInData);

      await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
      return tieInData.coverImage;
    } catch (e) {
      console.error(`Erro ao criar Tie-In: ${e}`);
      throw e;
    }
  }

  public async createTieCover(tieInData: childSerie): Promise<void> {
    const archivesPath = path.resolve(tieInData.archivesPath);

    const entries = await fse.readdir(archivesPath, { withFileTypes: true });

    const comicFiles = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(e.name))
      .map((e) => path.join(e.parentPath, e.name));

    const chapName = path.basename(comicFiles[0], path.extname(comicFiles[0]));
    const chapterOut = path.join(this.comicsImages, tieInData.name, chapName);

    if (tieInData.chapters) {
      tieInData.chapters[0].chapterPath = chapterOut;
      await this.storageManager.extractCoverWith7zip(comicFiles[0], chapterOut);
      await this.imageManager.normalizeChapter(chapterOut);
      tieInData.chapters[0].coverPath = await this.coverToComic(chapterOut);
      tieInData.coverImage = tieInData.chapters[0].coverPath;
    }
  }

  public async createTieInChap(tieInData: childSerie): Promise<ComicEdition[]> {
    const entries = await fse.readdir(tieInData.archivesPath, {
      withFileTypes: true,
    });

    const comicEntries = entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(entry.parentPath, entry.name));

    if (comicEntries.length === 0) {
      throw new Error('Nenhum arquivo encontrado');
    }

    const orderComics = await this.fileManager.orderComic(comicEntries);

    const chapters: ComicEdition[] = await Promise.all(
      orderComics.map(async (orderPath, idx) => {
        const fileName = path.basename(orderPath, path.extname(orderPath));
        const sanitizedName = this.fileManager.sanitizeFilename(fileName);

        return {
          id: idx + 1,
          name: fileName.replace('#', ''),
          coverPath: '',
          sanitizedName: sanitizedName,
          archivesPath: path.join(
            tieInData.archivesPath,
            path.basename(orderPath),
          ),
          chapterPath: '',
          createdAt: tieInData.createdAt,
          isRead: false,
          isDownload: false,
          page: {
            lastPageRead: 0,
            favoritePage: 0,
          },
        };
      }),
    );

    return chapters;
  }

  public async createTieInData(tieIn: ComicTieIn): Promise<childSerie> {
    const childSerieData: childSerie = {
      id: (await this.systemManager.getMangaId()) + 1,
      name: tieIn.childSerieName,
      sanitizedName: this.fileManager.sanitizeFilename(tieIn.childSerieName),
      archivesPath: tieIn.childSerieArchivesPath,
      chaptersPath: path.join(
        this.imagesFolder,
        'Quadrinho',
        tieIn.childSerieName,
      ),
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
      createdAt: new Date().toISOString(),
      deletedAt: undefined,
      comments: [],
    };

    return childSerieData;
  }

  public async createTieInCovers(dataPath: string): Promise<void> {
    if (await this.validationManager.tieInCreated(dataPath)) return;

    const tieInData = (await this.storageManager.readSerieData(
      dataPath,
    )) as unknown as childSerie;
    const tieChapters = tieInData.chapters;

    const serieName = path.basename(dataPath, path.extname(dataPath));

    if (!tieChapters) return;

    await Promise.all(
      tieChapters?.map(async (tieChap) => {
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
          tieChap.coverPath = await this.coverToComic(chapterOut);
          tieChap.chapterPath = chapterOut;
        } catch (e) {
          console.log(
            `Erro no capítulo ${tieChap.name} - (${tieChap.archivesPath})`,
          );
          throw e;
        }
      }),
    );

    tieInData.metadata.isCreated = true;
    await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
  }
}

// (async () => {
//   const storageManager = new StorageManager();
//   const fileManager = new FileManager();
//   const comicManager = new ComicManager();

//   const dataPath =
//     'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\json files\\Comics\\Homem Aranha.json';
//   const comicData = (await storageManager.readSerieData(dataPath)) as Comic;

//   if (!comicData.childSeries) {
//     return;
//   }

//   await comicManager.createTieIn(comicData.childSeries[0] as ComicTieIn);
// })();
