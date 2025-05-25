import SystemManager from './SystemManager.ts';
import FileSystem from './abstract/FileSystem.ts';
import ValidationManager from './ValidationManager.ts';
import ImageManager from './ImageManager.ts';
import StorageManager from './StorageManager.ts';
import CollectionsManager from './CollectionsManager.ts';
import FileManager from './FileManager.ts';

import fse from 'fs-extra';
import path from 'path';

import { SerieForm } from '../../src/types/series.interfaces.ts';
import { Manga, MangaChapter } from '../types/manga.interfaces.ts';

export default class MangaManager extends FileSystem {
  private global_id: number = 0;
  private readonly systemManager: SystemManager = new SystemManager();
  private readonly validationManager: ValidationManager = new ValidationManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly collectionsManager: CollectionsManager = new CollectionsManager();
  private readonly fileManager: FileManager = new FileManager();

  constructor() {
    super();
  }

  public async createMangaSerie(serie: SerieForm): Promise<void> {
    const mangaData = await this.createMangaData(serie);
    const mangaChapters = await this.createMangaChapters(serie.oldPath, mangaData.createdAt);
    mangaData.chapters = mangaChapters;

    if (await this.validationManager.isDinamicImage(mangaData.coverImage)) {
      const mangaCover = await this.imageManager.normalizeImage(mangaData.coverImage);
      await fse.remove(mangaData.coverImage);
      mangaData.coverImage = mangaCover;
    }

    const normalizedMangaData = this.storageManager.createNormalizedData(mangaData);
    await this.collectionsManager.serieToCollection(normalizedMangaData);
    await this.storageManager.writeSerieData(mangaData);
    await this.systemManager.setMangaId(this.global_id);
    await this.fileManager.localUpload(serie.oldPath, mangaData.archivesPath);
  }

  public async createMangaData(serie: SerieForm): Promise<Manga> {
    try {
      this.global_id = (await this.systemManager.getMangaId()) + 1;
      const totalChapters = (await fse.readdir(serie.oldPath, { withFileTypes: true })).length;

      return {
        id: this.global_id,
        name: serie.name,
        sanitizedName: serie.sanitizedName,
        archivesPath: path.join(this.userLibrary, serie.name),
        chaptersPath: path.join(this.imagesFolder, serie.literatureForm, serie.name),
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

  public async createMangaChapters(oldPath: string, createdAt: string): Promise<MangaChapter[]> {
    try {
      const unPaths = (await fse.readdir(oldPath, { withFileTypes: true })).map(direntPath =>
        path.join(direntPath.parentPath, direntPath.name),
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
            archivesPath: path.resolve(chapterPath),
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
}
