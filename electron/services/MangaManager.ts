import path from 'path';

import FileManager from './FileManager';
import CollectionManager from './CollectionManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';
import { Manga, MangaChapter } from '../types/manga.interfaces';
import { SerieForm } from '../../src/types/series.interfaces';
import GraphSerie from './abstract/GraphSerie';
import PdfManager from './PdfManager';
import ArchiveManager from './ArchiveManager';

export default class MangaManager extends GraphSerie<Manga, MangaChapter> {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly collectionManager: CollectionManager =
    new CollectionManager();

  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly storageManager: StorageManager = new StorageManager();
  protected readonly pdfManager: PdfManager = new PdfManager();
  protected readonly archiveManager: ArchiveManager = new ArchiveManager();

  constructor() {
    super();
  }

  async orderChapters(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const fileName = path.basename(file);
        const { volume, chapter } = this.fileManager.extractSerieInfo(fileName);

        return {
          filePath: file,
          volume: volume ? Number(volume) : 0,
          chapter: chapter ? Number(chapter) : 0,
        };
      }),
    );

    fileDetails.sort((a, b) => a.chapter - b.chapter);

    const orderedPaths = fileDetails.map((fileDetail) => fileDetail.filePath);
    return orderedPaths;
  }

  mountEmptyChapter(serieName: string, fileName: string): MangaChapter {
    const createdAt = new Date().toISOString();

    return {
      id: 0,
      serieName: serieName,
      name: fileName,
      sanitizedName: '',
      archivesPath: '',
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

  async postProcessChapters(chapter: MangaChapter): Promise<MangaChapter> {
    return chapter;
  }

  private async createChapters(
    serieName: string,
    archivesPath: string,
  ): Promise<MangaChapter[]> {
    const [mangaEntries] = await this.fileManager.searchChapters(archivesPath);
    const orderChapters = await this.orderChapters(mangaEntries);

    if (!mangaEntries || mangaEntries.length === 0) return [];

    const chapters: MangaChapter[] = await Promise.all(
      orderChapters.map(async (mangaPath, idx) => {
        const fileName = path
          .basename(mangaPath, path.extname(mangaPath))
          .replaceAll('#', '');
        const sanitizedName = this.fileManager.sanitizeFilename(fileName);

        return {
          ...this.mountEmptyChapter(serieName, fileName),
          id: idx,
          sanitizedName,
          chapterPath: await this.fileManager.buildChapterPath(
            this.mangasImages,
            serieName,
            fileName,
          ),
          archivesPath: mangaPath,
        };
      }),
    );

    return chapters;
  }

  async processSerieData(serie: SerieForm): Promise<Manga> {
    const manga = await this.mountEmptyManga(serie);
    const chapters = await this.createChapters(serie.name, serie.oldPath);

    return {
      ...manga,
      chapters,
    };
  }

  private async mountEmptyManga(serie: SerieForm): Promise<Manga> {
    const nextId = await this.consumeNextSerieId();
    const [, totalChapters] = await this.fileManager.searchChapters(
      serie.oldPath,
    );

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
      dataPath: path.join(this.mangasData, `${serie.name}.json`),
      coverImage: serie.cover_path,
      totalChapters,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: serie.literatureForm,
      chaptersRead: 0,
      readingData: { lastChapterId: 1, lastReadAt: '' },
      chapters: [],
      metadata: {
        status: serie.readingStatus,
        collections: serie.collections,
        recommendedBy: '',
        originalOwner: '',
        lastDownload: 0,
        rating: 0,
        isFavorite: serie.collections.includes('Favoritos'),
        privacy: serie.privacy,
        autoBackup: serie.autoBackup,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }
}
