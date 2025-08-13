import fse from 'fs-extra';
import path from 'path';

import SystemManager from './SystemManager.ts';
import FileSystem from './abstract/FileSystem.ts';
import ValidationManager from './ValidationManager.ts';
import ImageManager from './ImageManager.ts';
import StorageManager from './StorageManager.ts';
import CollectionsManager from './CollectionsManager.ts';
import FileManager from './FileManager.ts';
import { SerieForm } from '../../src/types/series.interfaces.ts';
import { Manga, MangaChapter } from '../types/manga.interfaces.ts';

export default class MangaManager extends FileSystem {
  private global_id: number;
  private readonly systemManager: SystemManager = new SystemManager();
  private readonly validationManager: ValidationManager =
    new ValidationManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private readonly fileManager: FileManager = new FileManager();

  constructor() {
    super();
  }

  public async createMangaSerie(serie: SerieForm): Promise<void> {
    const mangaData = await this.createMangaData(serie);
    const mangaChapters = await this.createMangaChapters(
      mangaData.name,
      serie.oldPath,
      mangaData.createdAt,
    );
    mangaData.chapters = mangaChapters;

    if (await this.validationManager.isDinamicImage(mangaData.coverImage)) {
      const mangaCover = await this.imageManager.normalizeImage(
        mangaData.coverImage,
        this.showcaseImages,
      );
      await fse.remove(mangaData.coverImage);
      mangaData.coverImage = mangaCover;
    }

    const normalizedMangaData =
      this.storageManager.createNormalizedData(mangaData);
    await this.collectionsManager.serieToCollection(normalizedMangaData);
    await this.storageManager.writeSerieData(mangaData);
    await this.systemManager.setMangaId(this.global_id);
    await this.fileManager.localUpload(serie.oldPath, mangaData.archivesPath);
  }

  public async createMangaData(serie: SerieForm): Promise<Manga> {
    try {
      let currentId = await this.systemManager.getMangaId();
      this.global_id = currentId + 1;
      const totalChapters = (
        await fse.readdir(serie.oldPath, { withFileTypes: true })
      ).length;

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
        dataPath: path.join(this.mangasData, `${serie.name}.json`),
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
        metadata: {
          status: serie.readingStatus,
          collections: serie.collections,
          recommendedBy: '',
          originalOwner: '',
          lastDownload: 0,
          rating: 0,
          isFavorite: false,
          privacy: serie.privacy,
          autoBackup: serie.autoBackup,
        },

        deletedAt: serie.deletedAt,
        createdAt: serie.createdAt,
        tags: serie.tags,
        comments: [],
      };
    } catch (e) {
      console.error(`Erro ao gerar o conteúdo do mangá: ${e}`);
      throw e;
    }
  }

  public async createMangaChapters(
    serieName: string,
    oldPath: string,
    createdAt: string,
  ): Promise<MangaChapter[]> {
    try {
      const unPaths = (await fse.readdir(oldPath, { withFileTypes: true })).map(
        (direntPath) => path.join(direntPath.parentPath, direntPath.name),
      );

      const chaptersPath = await this.fileManager.orderByChapters(unPaths);

      const chapters = await Promise.all(
        chaptersPath.map(async (chapterPath, index) => {
          const name = path.basename(chapterPath, path.extname(chapterPath));
          const sanitizedName = this.fileManager.sanitizeFilename(name);

          return {
            id: index + 1,
            name: name,
            sanitizedName: sanitizedName,
            archivesPath: path.join(
              this.userLibrary,
              serieName,
              path.basename(chapterPath),
            ),
            chapterPath: '',
            createdAt: createdAt,
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
      console.error(`Falha em gerar capítulos para o mangá: ${e}`);
      throw e;
    }
  }

  public async createMangaCovers(archivesPath: string): Promise<string[]> {
    try {
      const serieName = path.basename(archivesPath);

      const entries = await fse.readdir(archivesPath, { withFileTypes: true });
      const fullPaths = entries.map((entry) =>
        path.join(archivesPath, entry.name),
      );

      const orderedChapters = await this.fileManager.orderByChapters(fullPaths);
      const selectedChapters = orderedChapters.slice(0, 3);

      const covers: string[] = [];

      for (const chapter of selectedChapters) {
        const baseName = path.basename(chapter);
        const chapterName = this.fileManager
          .sanitizeFilename(baseName)
          .slice(0, 32);
        const outputDir = path.join(this.mangasImages, serieName, chapterName);

        await this.storageManager.extractWith7zip(chapter, outputDir);
        await this.imageManager.normalizeChapter(outputDir);

        const imagesEntries = await fse.readdir(outputDir, {
          withFileTypes: true,
        });
        const chapterImages = imagesEntries
          .slice(0, 2)
          .map((entry) => path.join(outputDir, entry.name));

        covers.push(...chapterImages);
      }

      return covers;
    } catch (error) {
      console.error(`Erro em extrair a showcaseImage: ${error}`);
      throw error;
    }
  }

  public async getChapter(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[] | string> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);
      const chaptersData = serieData.chapters;

      if (!chaptersData) {
        throw new Error('Chapters data is undefined.');
      }

      const chapter = chaptersData.find((chap) => chap.id === chapter_id);

      if (!chapter) {
        throw new Error(`Chapter with id ${chapter_id} not found.`);
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
    } catch (error) {
      console.error(`Erro ao obter conteúdo do capítulo: ${error.message}`);
      throw error;
    }
  }

  public async createEditions(dataPath: string, quantity: number) {
    const mangaData = await this.storageManager.readSerieData(dataPath);
    const lastDownload = mangaData.metadata.lastDownload;

    const firstItem = lastDownload;
    if (!mangaData.chapters) {
      throw new Error('Chapters data is undefined.');
    }
    const lastItem = Math.min(
      lastDownload + quantity,
      mangaData.chapters.length,
    );

    const chaptersToProcess = mangaData.chapters.filter(
      (chapter) => chapter.id >= firstItem && chapter.id <= lastItem,
    );

    for await (const chapter of chaptersToProcess) {
      const outputDir = path.join(
        this.mangasImages,
        mangaData.name,
        chapter.name,
      );

      try {
        await this.storageManager.extractWith7zip(
          chapter.archivesPath,
          outputDir,
        );

        await this.imageManager.normalizeChapter(outputDir);
        chapter.isDownload = true;
        chapter.chapterPath = outputDir;
        mangaData.metadata.lastDownload = chapter.id;

        await this.storageManager.updateSerieData(mangaData);
      } catch (e) {
        console.error(
          `Erro ao processar os capítulos em "${mangaData.name}": ${e}`,
        );
        throw e;
      } finally {
        await this.imageManager.clearChapter(outputDir);
      }
    }
  }

  public async createEditionById(dataPath: string, chapter_id: number) {
    const mangaData = await this.storageManager.readSerieData(dataPath);

    if (!mangaData.chapters) {
      throw new Error('Chapters data is undefined.');
    }
    const chapterToProcess = mangaData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );
    if (!chapterToProcess) {
      throw new Error(`Chapter with id ${chapter_id} not found.`);
    }

    const outputDir = path.join(
      this.mangasImages,
      mangaData.name,
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
      mangaData.metadata.lastDownload = chapterToProcess.id;

      await this.storageManager.updateSerieData(mangaData);
    } catch (e) {
      console.error(
        `Erro ao processar os capítulos em "${mangaData.name}": ${e}`,
      );
      throw e;
    }
  }
}

// (async () => {
//   const fileManager = new FileManager();
//   const storageManager = new StorageManager();
//   const mangaManager = new MangaManager();
//   const archivesPath = 'C:\\Users\\diogo\\OneDrive\\Desktop\\Black Clover';

//   const dinastiaM: SerieForm = {
//     name: 'Black Clover',
//     genre: 'Magos',
//     author: 'Desconhecido',
//     language: 'Português',
//     cover_path: 'C:\\Users\\diogo\\Downloads\\Imagens\\cover.jpg',
//     literatureForm: 'Manga',
//     collections: ['Marvel', 'Universo 616'],
//     tags: ['Marvel', 'super-heróis'],
//     privacy: 'Publica',
//     autoBackup: 'Sim',
//     readingStatus: 'Completo',
//     sanitizedName: fileManager.sanitizeFilename('Black clover'),
//     chaptersPath: '/series/dinastia-m/capitulos',
//     createdAt: '2025-08-08T16:00:00Z',
//     oldPath: archivesPath,
//     deletedAt: '',
//   };

//   await mangaManager.createMangaSerie(dinastiaM);
// })();
