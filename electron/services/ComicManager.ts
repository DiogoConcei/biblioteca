import FileSystem from './abstract/FileSystem';
import SystemManager from './SystemManager';
import FileManager from './FileManager';
import ValidationManager from './ValidationManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';
import CollectionsManager from './CollectionsManager';
import fse from 'fs-extra';
import path from 'path';
import { ComicEdition } from '../types/comic.interfaces.ts';
import { Literatures, SerieForm } from '../../src/types/series.interfaces.ts';
import { Comic, ComicTieIn } from '../types/comic.interfaces.ts';
import { data } from 'react-router-dom';

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
    // await this.fileManager.sanitizeDirFiles(serie.oldPath, comicData.chapters);

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

  public async createCovers(serie: SerieForm, comicData: Comic): Promise<void> {
    try {
      const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });

      const comicFiles = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(serie.oldPath, entry.name));

      const orderedComics = await this.fileManager.orderByChapters(comicFiles);

      if (orderedComics.length !== comicData.chapters?.length) {
        console.warn(
          `⚠️ Quantidade de capítulos (${
            comicData.chapters!.length
          }) e arquivos ordenados (${orderedComics.length}) não coincidem.`,
        );
        throw new Error('Quantidade de capítulos e arquivos não coincidem.');
      }

      await Promise.all(
        comicData.chapters!.map(async (chapter, idx) => {
          const chapterOutputPath = path.join(
            this.comicsImages,
            serie.name,
            chapter.name,
          );
          chapter.chapterPath = chapterOutputPath;

          const comicFile = orderedComics[idx];

          await this.storageManager.extractCoverWith7zip(
            comicFile,
            chapterOutputPath,
          );

          await this.imageManager.normalizeChapter(chapterOutputPath);

          const cover = await this.coverToComic(chapterOutputPath);
          chapter.coverPath = cover;
        }),
      );
    } catch (err) {
      console.error('❌ Falha em criar a capa das edições:', err);
      throw err;
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
        console.warn(
          `⚠️ Nenhuma imagem encontrada no capítulo: ${chapterPath}`,
        );
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

  public async createEditionData(serie: SerieForm): Promise<ComicEdition[]> {
    try {
      const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });
      const comicEntries = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(entry.parentPath, entry.name));

      if (comicEntries.length === 0) {
        throw new Error('Nenhum arquivo encontrado');
      }

      const orderComics = await this.fileManager.orderByChapters(comicEntries);

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
        parentId: this.global_id,
        childSerieName: path.basename(subPath),
        childSerieArchivesPath: path.join(
          this.userLibrary,
          serieName,
          path.basename(subPath),
        ),
        childSerieDataPath: path.join(
          this.comicsData,
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
}
