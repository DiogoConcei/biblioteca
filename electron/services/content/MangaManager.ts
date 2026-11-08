import path from 'path';

import FileManager from '../FileManager';
import CollectionManager from './CollectionManager';
import ImageManager from '../processing/ImageManager';
import storageManager from '../StorageManager';
import { Manga, MangaChapter } from '../../types/manga.interfaces';
import { SerieForm } from '../../../src/shared/types/series.interfaces';
import GraphSerie from '../abstract/GraphSerie';
import PdfManager from '../processing/PdfManager';
import ArchiveManager from '../processing/ArchiveManager';

export default class MangaManager extends GraphSerie<Manga, MangaChapter> {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly collectionManager: CollectionManager = new CollectionManager();

  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly storageManager = storageManager;
  protected readonly pdfManager: PdfManager = new PdfManager();
  protected readonly archiveManager: ArchiveManager = new ArchiveManager();

  constructor() {
    super();
  }

  mountEmptyChapter(serieName: string, fileName: string): MangaChapter {
    const createdAt = new Date().toISOString();

    return {
      id: 0,
      order: 0,
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
      chapterNumber: {
        label: '',
        value: 0,
      },
      coverImage: '',
    };
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

  async postProcessChapters(chapter: MangaChapter): Promise<MangaChapter> {
    return chapter;
  }

  async processSerieData(serie: SerieForm): Promise<Manga> {
    const manga = await this.mountEmptyManga(serie);
    const chapters = await this.createChapters(
      manga.name,
      manga.chaptersPath,
      serie.oldPath,
    );
    return { ...manga, chapters };
  }

  private async mountEmptyManga(serie: SerieForm): Promise<Manga> {
    const nextId = await this.consumeNextSerieId();
    const [, totalChapters] = await this.fileManager.searchChapters(serie.oldPath);

    return {
      id: nextId,
      name: serie.name,
      sanitizedName: serie.sanitizedName,
      archivesPath: path.join(this.userLibrary, serie.name),
      chaptersPath: path.join(this.imagesFolder, serie.literatureForm, serie.name),
      dataPath: path.join(this.mangasData, `${serie.name}.json`),
      serieGallery: path.join(this.gallery, `${serie.name}`),
      coverGallery: path.join(this.gallery, `${serie.name}`, `covers`),
      pagesGallery: path.join(this.gallery, `${serie.name}`, `pages`),
      description: serie.description ?? '',
      backgroundImage: serie.backgroundImage ?? '',
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
        viewMode: serie.viewMode,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }

  private async createChapters(
    serieName: string,
    chaptersPath: string,
    archivesPath: string,
  ): Promise<MangaChapter[]> {
    const [mangaEntries] = await this.fileManager.searchChapters(archivesPath);
    if (!mangaEntries || mangaEntries.length === 0) return [];

    const ordered = await this.orderChapters(mangaEntries);

    return Promise.all(
      ordered.map(
        (mangaPath, idx) =>
          this.createChapter(
            serieName,
            chaptersPath,
            mangaPath,
            idx,
          ) as Promise<MangaChapter>,
      ),
    );
  }
}
