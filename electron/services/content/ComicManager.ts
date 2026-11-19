import path from 'path';
import fse from 'fs-extra';

import FileManager from '../FileManager.ts';
import storageManager from '../StorageManager.ts';
import ImageManager from '../processing/ImageManager.ts';
import CollectionManager from './CollectionManager.ts';
import PdfManager from '../processing/PdfManager.ts';
import ArchiveManager from '../processing/ArchiveManager.ts';
import TieInManager from './TieInManager.ts';
import { SerieForm } from '../../../src/shared/types/series.interfaces.ts';

import { Comic, ComicEdition } from '../../types/comic.interfaces.ts';
import { ComicTieIn } from '../../types/tieIn.interfaces.ts';
import GraphSerie from '../abstract/GraphSerie.ts';
import { ComicCoverRegenerationProgress } from '../../types/electron-auxiliar.interfaces.ts';

export default class ComicManager extends GraphSerie<Comic, ComicEdition> {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly collectionManager: CollectionManager = new CollectionManager();
  protected readonly storageManager = storageManager;
  protected readonly pdfManager: PdfManager = new PdfManager();
  protected readonly archiveManager: ArchiveManager = new ArchiveManager();
  protected readonly tieInManager: TieInManager = new TieInManager();

  async createEditions(
    serieName: string,
    chaptersPath: string,
    archivesPath: string,
  ): Promise<ComicEdition[]> {
    const [comicEntries] = await this.fileManager.searchChapters(archivesPath);
    if (!comicEntries || comicEntries.length === 0) return [];

    const ordered = await this.orderChapters(comicEntries);

    return Promise.all(
      ordered.map(
        (comicPath, idx) =>
          this.createChapter(
            serieName,
            chaptersPath,
            comicPath,
            idx,
          ) as Promise<ComicEdition>,
      ),
    );
  }

  async createEditionCovers(comicEdition: ComicEdition[]) {
    try {
      await Promise.all(
        comicEdition.map(async (chap) => {
          const safeDirName = this.fileManager
            .sanitizeDirName(chap.name)
            .replaceAll('_', '')
            .replaceAll('-', '');

          const outputPath = path.join(this.showcaseImages, chap.name, safeDirName);

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

    const outputPath = path.join(this.showcaseImages, chapter.serieName, chapter.name);

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
      if (a.readingIndex !== b.readingIndex) return a.readingIndex - b.readingIndex;

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
      dataPath: path.join(this.childSeriesData, `${path.basename(subPath)}.json`),
      coverImage: '',
    };
  }

  async processSerieData(serie: SerieForm): Promise<Comic> {
    const comic = await this.mountEmptyComic(serie);
    const chapters = await this.createEditions(
      comic.name,
      comic.chaptersPath,
      serie.oldPath,
    );
    const childSeries = await this.createChilds(comic.name, comic.id, serie.oldPath);

    return { ...comic, chapters, childSeries };
  }

  async createSerie(serie: SerieForm): Promise<void> {
    const serieData = await this.processSerieData(serie);

    if (serieData.chapters?.length) {
      await this.createEditionCovers(serieData.chapters);
    }

    if (serieData.childSeries?.length) {
      await this.tieInManager.processTieInData(serie.oldPath, serieData.childSeries);
      await this.tieInManager.generateChildCovers(serieData.childSeries, serie.oldPath);
    }

    await this.processCovers(serieData);
    await this.processBackground(serieData);
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
      chaptersPath: path.join(this.imagesFolder, serie.literatureForm, serie.name),
      dataPath: path.join(this.comicsData, `${serie.name}.json`),
      serieGallery: path.join(this.gallery, `${serie.name}`),
      coverGallery: path.join(this.gallery, `${serie.name}`, `covers`),
      pagesGallery: path.join(this.gallery, `${serie.name}`, `pages`),
      backgroundGallery: path.join(this.gallery, `${serie.name}`, `pages`),
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
        viewMode: serie.viewMode,
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
      order: 0,
      chapterNumber: {
        label: '',
        value: 0,
      },
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

  private async regenerateSingleCover(
    input: {
      owner: string;
      label: string;
      currentCover: string;
      sourceArchive: string;
      outputDir: string;
    },
    progress: ComicCoverRegenerationProgress,
    failures: Array<{ comic: string; reason: string }>,
  ): Promise<string> {
    const isInvalid = await this.isCoverInvalid(input.currentCover);

    if (!isInvalid) {
      progress.skipped += 1;
      return input.currentCover;
    }

    if (!input.sourceArchive) {
      progress.failed += 1;
      failures.push({
        comic: input.owner,
        reason: `${input.label}: sem arquivo de origem para regenerar capa`,
      });
      return input.currentCover;
    }

    try {
      const generatedCover = await this.withRetry(
        () => this.imageManager.generateCover(input.sourceArchive, input.outputDir),
        3,
        300,
      );

      if (!generatedCover || (await this.isCoverInvalid(generatedCover))) {
        throw new Error('capa gerada inválida');
      }

      progress.regenerated += 1;
      return generatedCover;
    } catch (error) {
      progress.failed += 1;
      failures.push({
        comic: input.owner,
        reason: `${input.label}: ${error instanceof Error ? error.message : String(error)}`,
      });
      return input.currentCover;
    }
  }

  private async isCoverInvalid(coverPath: string): Promise<boolean> {
    if (!coverPath || typeof coverPath !== 'string') {
      return true;
    }

    const normalizedPath = path.resolve(coverPath);

    if (!(await fse.pathExists(normalizedPath))) {
      return true;
    }

    const stats = await fse.stat(normalizedPath);
    if (!stats.isFile() || stats.size === 0) {
      return true;
    }

    return !(await this.imageManager.isImageHealthy(normalizedPath));
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    attempts = 3,
    delayMs = 250,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === attempts) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Falha desconhecida ao executar operação com retry');
  }
}
