import path from 'path';
import fse from 'fs-extra';

import FileManager from './FileManager';
import storageManager from './StorageManager';
import ImageManager from './ImageManager';
import CollectionManager from './CollectionManager';
import PdfManager from './PdfManager';
import ArchiveManager from './ArchiveManager';
import { Comic, ComicEdition, ComicTieIn } from '../types/comic.interfaces';
import { SerieForm } from '../../src/types/series.interfaces';
import GraphSerie from './abstract/GraphSerie';
import {
  ComicCoverRegenerationProgress,
  ComicCoverRegenerationResult,
} from '../types/electron-auxiliar.interfaces.ts';

interface ITieInManager {
  processTieInData(basePath: string, childSeries: ComicTieIn[]): Promise<void>;
  resolveCoverSourceArchive(candidatePath: string): Promise<string>;
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
    tieInManager?: ITieInManager & { generateChildCovers: (childs: ComicTieIn[], basePath: string) => Promise<void> },
  ): Promise<void> {
    const serieData = await this.processSerieData(serie);

    // Gera as capas para cada edição (capítulo) do quadrinho principal
    if (serieData.chapters && serieData.chapters.length > 0) {
      await this.createEditionCovers(serie.oldPath, serieData.chapters);
    }

    if (
      tieInManager &&
      serieData.childSeries &&
      serieData.childSeries.length > 0
    ) {
      await tieInManager.processTieInData(serie.oldPath, serieData.childSeries);
      // Extrai as capas para as child series (Tie-ins)
      await tieInManager.generateChildCovers(serieData.childSeries, serie.oldPath);
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

  public async regenerateComicCovers(
    tieInManager: ITieInManager,
    onProgress?: (progress: ComicCoverRegenerationProgress) => void,
  ): Promise<ComicCoverRegenerationResult> {
    const jsonFiles = (await this.foundFiles(this.comicsData)).filter((file) =>
      file.toLowerCase().endsWith('.json'),
    );

    const progress: ComicCoverRegenerationProgress = {
      total: jsonFiles.length,
      processed: 0,
      regenerated: 0,
      skipped: 0,
      failed: 0,
    };

    const failures: Array<{ comic: string; reason: string }> = [];

    const emitProgress = (comicName?: string) => {
      onProgress?.({
        ...progress,
        currentComic: comicName,
      });
    };

    emitProgress();

    for (const dataPath of jsonFiles) {
      let comicName = path.basename(dataPath, path.extname(dataPath));

      try {
        const serieData = (await this.storageManager.readSerieData(
          dataPath,
        )) as Comic | null;

        if (!serieData) {
          throw new Error('JSON inválido ou inacessível');
        }

        comicName = serieData.name;

        let hasSerieChanges = false;

        const archiveFromChapters = serieData.chapters?.find(
          (chapter) => chapter.archivesPath && chapter.archivesPath.length > 0,
        )?.archivesPath;

        const mainSourceArchive = await tieInManager.resolveCoverSourceArchive(
          archiveFromChapters || serieData.archivesPath,
        );

        const updatedMainCover = await this.regenerateSingleCover(
          {
            owner: comicName,
            label: 'capa principal',
            currentCover: serieData.coverImage,
            sourceArchive: mainSourceArchive,
            outputDir: path.join(this.showcaseImages, serieData.name),
          },
          progress,
          failures,
        );

        if (updatedMainCover !== serieData.coverImage) {
          serieData.coverImage = updatedMainCover;
          hasSerieChanges = true;
        }

        if (serieData.chapters?.length) {
          for (const chapter of serieData.chapters) {
            const chapterSourceArchive =
              await tieInManager.resolveCoverSourceArchive(
                chapter.archivesPath,
              );

            const updatedChapterCover = await this.regenerateSingleCover(
              {
                owner: comicName,
                label: `edição ${chapter.name}`,
                currentCover: chapter.coverImage ?? '',
                sourceArchive: chapterSourceArchive,
                outputDir: path.join(
                  this.showcaseImages,
                  chapter.serieName,
                  chapter.name,
                ),
              },
              progress,
              failures,
            );

            if (updatedChapterCover !== (chapter.coverImage ?? '')) {
              chapter.coverImage = updatedChapterCover;
              hasSerieChanges = true;
            }
          }
        }

        if (serieData.childSeries?.length) {
          for (const child of serieData.childSeries) {
            const tieInSourceArchive =
              await tieInManager.resolveCoverSourceArchive(
                child.archivesPath,
              );

            const updatedTieInCover = await this.regenerateSingleCover(
              {
                owner: comicName,
                label: `tie-in ${child.serieName}`,
                currentCover: child.coverImage,
                sourceArchive: tieInSourceArchive,
                outputDir: path.join(this.showcaseImages, child.serieName),
              },
              progress,
              failures,
            );

            if (updatedTieInCover !== child.coverImage) {
              child.coverImage = updatedTieInCover;
              hasSerieChanges = true;
            }

            if (child.dataPath) {
              const tieInData = await this.storageManager.readTieInData(
                child.dataPath,
              );

              if (tieInData) {
                let hasTieInChanges = false;

                const tieInDataSource =
                  await tieInManager.resolveCoverSourceArchive(
                    tieInData.archivesPath,
                  );

                const updatedTieInMainCover = await this.regenerateSingleCover(
                  {
                    owner: comicName,
                    label: `tie-in ${tieInData.name} (principal)`,
                    currentCover: tieInData.coverImage,
                    sourceArchive: tieInDataSource,
                    outputDir: path.join(this.showcaseImages, tieInData.name),
                  },
                  progress,
                  failures,
                );

                if (updatedTieInMainCover !== tieInData.coverImage) {
                  tieInData.coverImage = updatedTieInMainCover;
                  hasTieInChanges = true;
                }

                if (tieInData.chapters?.length) {
                  for (const tieChapter of tieInData.chapters) {
                    const tieChapterSource =
                      await tieInManager.resolveCoverSourceArchive(
                        tieChapter.archivesPath,
                      );

                    const updatedTieChapterCover =
                      await this.regenerateSingleCover(
                        {
                          owner: comicName,
                          label: `tie-in ${tieInData.name} / edição ${tieChapter.name}`,
                          currentCover: tieChapter.coverImage ?? '',
                          sourceArchive: tieChapterSource,
                          outputDir: path.join(
                            this.showcaseImages,
                            tieChapter.serieName,
                            tieChapter.name,
                          ),
                        },
                        progress,
                        failures,
                      );

                    if (
                      updatedTieChapterCover !== (tieChapter.coverImage ?? '')
                    ) {
                      tieChapter.coverImage = updatedTieChapterCover;
                      hasTieInChanges = true;
                    }
                  }
                }

                if (hasTieInChanges) {
                  const tiePersisted =
                    await this.storageManager.writeData(tieInData);

                  if (!tiePersisted) {
                    throw new Error(
                      `Falha ao persistir alterações do tie-in ${tieInData.name}`,
                    );
                  }
                }
              }
            }
          }
        }

        if (hasSerieChanges) {
          const persisted = await this.storageManager.writeData(serieData);

          if (!persisted) {
            throw new Error('Falha ao persistir JSON atualizado da série');
          }
        }
      } catch (error) {
        failures.push({
          comic: comicName,
          reason: error instanceof Error ? error.message : String(error),
        });
      } finally {
        progress.processed += 1;
        emitProgress(comicName);
      }
    }

    return {
      total: progress.total,
      processed: progress.processed,
      regenerated: progress.regenerated,
      skipped: progress.skipped,
      failed: progress.failed,
      failures,
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
        () =>
          this.imageManager.generateCover(input.sourceArchive, input.outputDir),
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
