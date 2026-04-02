import path from 'path';

import FileManager from './FileManager';
import storageManager from './StorageManager';
import ImageManager from './ImageManager';
import CollectionManager from './CollectionManager';
import PdfManager from './PdfManager';
import ArchiveManager from './ArchiveManager';
import { Comic, ComicEdition, ComicTieIn } from '../types/comic.interfaces';
import { SerieForm } from '../../src/types/series.interfaces';
import GraphSerie from './abstract/GraphSerie';

interface ITieInManager {
  processTieInData(basePath: string, childSeries: ComicTieIn[]): Promise<void>;
}

export default class ComicManager extends GraphSerie<Comic, ComicEdition> {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly collectionManager: CollectionManager =
    new CollectionManager();
  protected readonly storageManager = storageManager;
  protected readonly pdfManager: PdfManager = new PdfManager();
  protected readonly archiveManager: ArchiveManager = new ArchiveManager();

  async createEditions(
    serieName: string,
    archivesPath: string,
  ): Promise<ComicEdition[]> {
    const [comicEntries] = await this.fileManager.searchChapters(archivesPath);
    const orderComics = await this.orderChapters(comicEntries);

    if (!comicEntries || comicEntries.length === 0) return [];

    const chapters: ComicEdition[] = await Promise.all(
      orderComics.map(async (comicPath, idx) => {
        const fileName = path
          .basename(comicPath, path.extname(comicPath))
          .replaceAll('#', '');
        const sanitizedName = this.fileManager.sanitizeFilename(fileName);

        return {
          ...this.mountEmptyChapter(serieName, fileName),
          id: idx,
          sanitizedName,
          chapterPath: await this.fileManager.buildChapterPath(
            this.comicsImages,
            serieName,
            fileName,
          ),
          archivesPath: comicPath,
        };
      }),
    );

    return chapters;
  }

  async createEdition(
    serieName: string,
    archivePath: string,
    id: number,
  ): Promise<ComicEdition> {
    const fileName = path
      .basename(archivePath, path.extname(archivePath))
      .replaceAll('#', '');
    const sanitizedName = this.fileManager.sanitizeFilename(fileName);

    return {
      ...this.mountEmptyChapter(serieName, fileName),
      id: id,
      sanitizedName,
      chapterPath: await this.fileManager.buildChapterPath(
        this.comicsImages,
        serieName,
        fileName,
      ),
      archivesPath: archivePath,
    };
  }

  async createEditionCovers(
    archivesPath: string,
    comicEdition: ComicEdition[],
  ) {
    const dirName = path.basename(archivesPath);

    try {
      await Promise.all(
        comicEdition.map(async (chap) => {
          const rawName = chap.name;
          const safeDirName = this.fileManager
            .sanitizeDirName(rawName)
            .replaceAll('_', '')
            .replaceAll('-', '');

          const outputPath = path.join(
            this.showcaseImages,
            chap.name,
            safeDirName,
          );

          chap.chapterPath = path.join(this.comicsImages, dirName, chap.name);

          if (!chap.archivesPath) {
            console.warn(
              `Arquivo de origem não informado para a edição ${chap.name}. Pulando geração de capa.`,
            );
            return;
          }

          chap.coverImage = await this.imageManager.generateCover(
            chap.archivesPath,
            outputPath,
          );
        }),
      );
    } catch (e) {
      console.error(`Falha em gerar capa para as edicoes`);
      throw e;
    }
  }

  async postProcessChapters(chapter: ComicEdition): Promise<ComicEdition> {
    if (chapter.coverImage) {
      return chapter;
    }

    const outputPath = path.join(
      this.showcaseImages,
      chapter.serieName,
      chapter.name,
    );

    if (!chapter.archivesPath) {
      console.warn(
        `Arquivo de origem não informado para a edição ${chapter.name}. Pulando geração de capa.`,
      );
      return chapter;
    }

    chapter.coverImage = await this.imageManager.generateCover(
      chapter.archivesPath,
      outputPath,
    );

    return chapter;
  }

  async orderChapters(filesPath: string[]): Promise<string[]> {
    const items = filesPath.map((file, index) => {
      const info = this.fileManager.extractComicInfo(file);
      return { ...info, filePath: file, fsIndex: index };
    });

    items.sort((a, b) => {
      if (a.readingIndex !== b.readingIndex)
        return a.readingIndex - b.readingIndex;

      if (a.partIndex !== b.partIndex) return a.partIndex - b.partIndex;

      if (a.issueNumber !== b.issueNumber) return a.issueNumber - b.issueNumber;

      if (a.category !== b.category) return a.category - b.category;

      return a.fsIndex - b.fsIndex;
    });

    return items.map((i) => i.filePath);
  }

  public async createChilds(
    serieName: string,
    parentId: number,
    archivesPath: string,
  ): Promise<ComicTieIn[]> {
    const rightPath = path.join(this.userLibrary, serieName);
    const subPaths = await this.fileManager.searchDirectories(archivesPath);

    const childSeries: ComicTieIn[] = await Promise.all(
      subPaths.map(async (subPath, idx) => {
        const chapter = await this.fileManager.findFirstChapter(subPath);

        const relative = path.relative(archivesPath, subPath);

        const rightDir = path.join(rightPath, relative);

        return {
          ...this.mountEmptyChild(parentId, subPath),
          id: idx,
          compiledComic: !!chapter,
          archivesPath: rightDir,
        };
      }),
    );

    return childSeries;
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

  async processSerieData(serie: SerieForm): Promise<Comic> {
    const comic = await this.mountEmptyComic(serie);
    const chapters = await this.createEditions(serie.name, serie.oldPath);
    const childSeries = await this.createChilds(
      comic.name,
      comic.id,
      serie.oldPath,
    );

    return {
      ...comic,
      chapters,
      childSeries,
    };
  }

  async createSerie(
    serie: SerieForm,
    tieInManager?: ITieInManager,
  ): Promise<void> {
    const serieData = await this.processSerieData(serie);

    if (
      tieInManager &&
      serieData.childSeries &&
      serieData.childSeries.length > 0
    ) {
      await tieInManager.processTieInData(serie.oldPath, serieData.childSeries);
    }

    await this.processCovers(serieData);
    await this.collectionManager.initializeCollections(
      serieData,
      serieData.metadata.collections,
    );
    await this.updateSystem(serieData, serie.oldPath);
  }

  async mountEmptyComic(serie: SerieForm): Promise<Comic> {
    const nextId = await this.consumeNextSerieId();
    const subDir = await this.fileManager.searchDirectories(serie.oldPath);
    const totalChapters = await this.fileManager.countChapters([
      serie.oldPath,
      ...subDir,
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
      totalChapters,
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
        isFavorite: serie.collections.includes('Favoritos'),
        privacy: serie.privacy,
        autoBackup: serie.autoBackup,
        compiledComic: totalChapters ? false : true,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }

  mountEmptyChapter(serieName: string, fileName: string): ComicEdition {
    const createdAt = new Date().toISOString();
    const safeName = this.fileManager.sanitizeDirName(fileName);

    return {
      id: 0,
      serieName: serieName,
      name: safeName,
      coverImage: '',
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
}
