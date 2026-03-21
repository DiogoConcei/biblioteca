import path from 'path';

import FileManager from './FileManager';
import StorageManager from './StorageManager';
import ImageManager from './ImageManager';
import TieInManager from './TieInManager';
import CollectionManager from './CollectionManager';
import { Comic, ComicEdition, ComicTieIn } from '../types/comic.interfaces';
import { SerieForm } from '../../src/types/series.interfaces';
import GraphSerie from './abstract/GraphSerie';

export default class ComicManager extends GraphSerie<Comic, ComicEdition> {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly tieManager: TieInManager = new TieInManager();
  protected readonly collManager: CollectionManager = new CollectionManager();
  protected readonly storageManager: StorageManager = new StorageManager();

  public async createComicSerie(serie: SerieForm) {
    const comicData = await this.processSerieData(serie);

    if (comicData.childSeries) {
      await this.processTieInData(serie.oldPath, comicData.childSeries);
    }

    await this.processCovers(comicData);

    await this.collManager.initializeCollections(
      comicData,
      comicData.metadata.collections,
    );

    await this.updateSytem(comicData, serie.oldPath);
  }

  public async createEditions(
    serieName: string,
    archivesPath: string,
  ): Promise<ComicEdition[]> {
    const [comicEntries] = await this.fileManager.searchChapters(archivesPath);
    const orderComics = await this.fileManager.orderComic(comicEntries);

    if (!comicEntries || comicEntries.length === 0) return [];

    const chapters: ComicEdition[] = await Promise.all(
      orderComics.map(async (comicPath, idx) => {
        const fileName = path
          .basename(comicPath, path.extname(comicPath))
          .replaceAll('#', '');
        const sanitizedName = this.fileManager.sanitizeFilename(fileName);

        return {
          ...this.mountEmptyEdition(serieName, fileName),
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

  public async createEdition(
    serieName: string,
    archivePath: string,
    id: number,
  ): Promise<ComicEdition> {
    const fileName = path
      .basename(archivePath, path.extname(archivePath))
      .replaceAll('#', '');
    const sanitizedName = this.fileManager.sanitizeFilename(fileName);

    return {
      ...this.mountEmptyEdition(serieName, fileName),
      id: id,
      sanitizedName,
      chapterPath: await this.fileManager.buildChapterPath(
        this.comicsImages,
        serieName,
        fileName,
      ),
      // preenche archivesPath com o caminho do arquivo de origem
      archivesPath: archivePath,
    };
  }

  public async createEditionCovers(
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

  public async processTieInData(basePath: string, childSeries: ComicTieIn[]) {
    if (!childSeries) return;

    for (let idx = 0; idx < childSeries.length; idx++) {
      const child = childSeries[idx];
      const oldPath = await this.fileManager.findPath(
        basePath,
        child.serieName,
      );

      if (!oldPath) {
        console.warn(
          `Não encontrado child ${child.serieName} em ${basePath}, pulando TieIn.`,
        );
        continue;
      }

      await this.tieManager.createTieIn(child, oldPath);
    }
  }

  // Trouxxe todos os capítulos porque preciso fazer um setState no front
  private async createNewEdition(
    filesPath: string[],
    chapters: ComicEdition[],
  ) {
    const chapterMap = new Map(chapters.map((ch) => [ch.archivesPath, ch]));
    const existingPaths = chapters.map((ch) => ch.archivesPath);
    const allPaths = [...existingPaths, ...filesPath];
    const orderedPaths = await this.fileManager.orderComic(allPaths);

    const result: ComicEdition[] = await Promise.all(
      orderedPaths.map(async (chapterPath, idx) => {
        const exits = chapterMap.get(chapterPath);

        if (exits) {
          return exits;
        }

        this.fileManager.moveChapter(
          chapterPath,
          path.join(
            this.userLibrary,
            chapters[0].serieName,
            path.basename(chapterPath),
          ),
        );

        const newChapter = await this.createEdition(
          chapters[0].serieName,
          chapterPath,
          idx,
        );
        return newChapter;
      }),
    );

    result.forEach((ch, idx) => {
      ch.id = idx + 1;
    });

    return result;
  }

  private async updateSytem(comicData: Comic, oldPath: string) {
    await this.fileManager.localUpload(comicData, oldPath);
    await this.storageManager.writeData(comicData);
  }

  private async processSerieData(serie: SerieForm): Promise<Comic> {
    const comic = await this.mountEmptyComic(serie);
    const chapters = await this.createEditions(serie.name, serie.oldPath);
    const childSeries = await this.tieManager.createChilds(
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

  private async mountEmptyComic(serie: SerieForm): Promise<Comic> {
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

  private mountEmptyEdition(serieName: string, fileName: string): ComicEdition {
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
