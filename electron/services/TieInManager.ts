import path from 'path';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';

import { ComicTieIn, TieIn, ComicEdition } from '../types/comic.interfaces';
import { checkPrime } from 'crypto';

export default class TieInManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly storageManager: StorageManager = new StorageManager();

  public async createChildCover(
    serieName: string,
    basePath: string,
  ): Promise<string> {
    try {
      const firstChapter = await this.fileManager.findFirstChapter(basePath);
      const outputPath = path.join(this.dinamicImages, serieName);
      return await this.imageManager.generateCover(firstChapter, outputPath);
    } catch (e) {
      throw new Error('Falha em gerar capa da TieIn');
    }
  }

  public async createTieInSerie(tieIn: TieIn): Promise<void> {
    try {
      tieIn.chapters = await this.createEditions(
        tieIn.name,
        tieIn.archivesPath,
      );

      await this.createEditionCovers(tieIn.archivesPath, tieIn.chapters);

      tieIn.metadata.isCreated = true;

      await fse.writeJson(tieIn.dataPath, tieIn, { spaces: 2 });
    } catch (error) {
      console.error('Erro ao criar Tie-In:', error);
      throw error;
    }
  }

  public async createEditionCovers(
    archivesPath: string,
    comicEdition: ComicEdition[],
  ) {
    const dirName = path.basename(archivesPath);

    try {
      await Promise.all(
        comicEdition.map(async (chap, idx) => {
          const rawName = chap.name;
          const safeName = this.fileManager.sanitizeDirName(rawName);

          const outputPath = path.join(
            this.showcaseImages,
            chap.serieName,
            safeName,
          );

          chap.chapterPath = path.join(
            this.comicsImages,
            chap.serieName,
            safeName,
          );

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

  public async getTieIn(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[]> {
    try {
      const comic = await this.storageManager.readSerieData(dataPath);

      if (!comic) {
        return [];
      }

      if (!comic.chapters || comic.chapters.length === 0) {
        throw new Error('Nenhum capítulo encontrado.');
      }

      const chapter = comic.chapters.find((chap) => chap.id === chapter_id);

      if (!chapter || !chapter.chapterPath) {
        throw new Error('Capítulo não encontrado ou caminho inválido.');
      }

      const imageFiles = await this.fileManager.searchImages(
        chapter.chapterPath,
      );
      const validImages = [];

      for (const file of imageFiles) {
        if (!(await this.imageManager.isImage(file))) {
          validImages.push(file);
        }
      }

      const processedImages = await this.imageManager.encodeImages(imageFiles);

      return processedImages;
    } catch (error) {
      console.error('Não foi possível encontrar a edição do quadrinho:', error);
      throw error;
    }
  }

  public async createChapterById(dataPath: string, chapter_id: number) {
    const comicData = (await this.storageManager.readTieInData(
      dataPath,
    )) as TieIn;

    if (!comicData.chapters) {
      throw new Error('Serie não possui capitulos.');
    }

    const editionToProces = comicData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );

    if (!editionToProces) {
      throw new Error(`Capitulo com id ${chapter_id} nao foi encontrado.`);
    }

    await this.generateChapter(editionToProces);

    editionToProces.isDownloaded = 'downloaded';
    comicData.metadata.lastDownload = editionToProces.id;
    await this.storageManager.writeData(comicData);
  }

  private async generateChapter(chapter: ComicEdition) {
    const normalized = path.resolve(chapter.archivesPath);
    const ext = path.extname(normalized);

    const rawName = chapter.name;
    const safeName = this.fileManager.sanitizeDirName(rawName);

    const chapterOut = await this.fileManager.buildChapterPath(
      this.comicsImages,
      chapter.serieName,
      safeName,
    );

    try {
      if (ext === '.pdf') {
        await this.storageManager.convertPdf_overdrive(normalized, chapterOut);
      } else {
        await this.storageManager.extractWith7zip(normalized, chapterOut);
      }

      chapter.chapterPath = chapterOut;
      console.log(chapterOut);
    } catch (e) {
      console.error(`Erro ao processar os capítulos em "${chapter.name}":`, e);
      throw e;
    } finally {
      await this.imageManager.normalizeChapter(chapterOut);
    }
  }

  public async createEditions(
    serieName: string,
    archivesPath: string,
  ): Promise<ComicEdition[]> {
    const [comicEntries, total] =
      await this.fileManager.searchChapters(archivesPath);
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

  public async generateChildCovers(childs: ComicTieIn[], basePath: string) {
    await Promise.all(
      childs.map(async (child) => {
        const oldPath = await this.fileManager.findPath(
          basePath,
          child.serieName,
        );

        child.coverImage = await this.createChildCover(
          child.serieName,
          oldPath,
        );
      }),
    );
  }

  public async createTieCovers(dataPath: string): Promise<void> {
    if (!(await this.isCreated(dataPath))) return;

    const tieInData = (await this.storageManager.readTieInData(
      dataPath,
    )) as TieIn;

    const tieChapters = tieInData.chapters;

    if (!tieChapters || tieChapters.length === 0) {
      console.warn(`Nenhum capítulo encontrado para Tie-In em ${dataPath}`);
      return;
    }

    const safeName = this.fileManager.sanitizeFilename(tieInData.name);
    const outputPath = path.join(this.dinamicImages, tieInData.name);

    await Promise.all(
      tieChapters.map(async (chap) => {
        const chapSafe = this.fileManager.sanitizeFilename(chap.name);
        chap.chapterPath = path.join(
          this.comicsImages,
          tieInData.name,
          chapSafe,
        );
        chap.coverImage = await this.imageManager.generateCover(
          chap.archivesPath,
          outputPath,
        );
      }),
    );
    tieInData.metadata.isCreated = true;
    await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
  }

  public async createTieIn(child: ComicTieIn, basePath: string): Promise<void> {
    const totalChapters = await this.fileManager.singleCountChapter(basePath);
    const safeName = this.fileManager.sanitizeFilename(child.serieName);
    const emptyTie = await this.mountEmptyTieIn();

    const tieIn: TieIn = {
      ...emptyTie,
      name: child.serieName,
      sanitizedName: safeName,
      archivesPath: child.archivesPath,
      chaptersPath: path.join(this.imagesFolder, 'Quadrinho', child.serieName),
      totalChapters,
      dataPath: child.dataPath,
    };

    await this.storageManager.writeData(tieIn);
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

  private async mountEmptyTieIn(): Promise<TieIn> {
    const id = (await this.getSerieId()) + 1;
    const createdAt = new Date().toISOString();

    return {
      id,
      name: '',
      sanitizedName: '',
      archivesPath: '',
      chaptersPath: '',
      totalChapters: 0,
      chaptersRead: 0,
      dataPath: '',
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
      createdAt,
      deletedAt: '',
      comments: [],
    };
  }

  private async isCreated(dataPath: string): Promise<boolean> {
    try {
      const tieInData = (await this.storageManager.readSerieData(
        dataPath,
      )) as unknown as TieIn;

      if (tieInData.metadata.isCreated) {
        return true;
      }

      return false;
    } catch (e) {
      console.error(`Falha em verificar existência da TieIn`);
      throw e;
    }
  }

  private mountEmptyEdition(serieName: string, fileName: string): ComicEdition {
    const createdAt = new Date().toISOString();

    return {
      id: 0,
      serieName: serieName,
      name: fileName,
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

  // public async createEditionCover(chap: ComicEdition) {
  //   try {
  //     const rawName = chap.name;
  //     const safeName = this.fileManager.sanitizeDirName(rawName);

  //     const outputPath = path.join(
  //       this.showcaseImages,
  //       chap.serieName,
  //       safeName,
  //     );

  //     chap.chapterPath = path.join(
  //       this.comicsImages,
  //       chap.serieName,
  //       chap.name,
  //     );

  //     if (!chap.archivesPath) {
  //       console.warn(
  //         `Arquivo de origem não informado para a edição ${chap.name}. Pulando geração de capa.`,
  //       );
  //       return;
  //     }

  //     chap.coverImage = await this.imageManager.generateCover(
  //       chap.archivesPath,
  //       outputPath,
  //     );
  //   } catch (e) {
  //     console.error(`Falha em gerar capa para as edicoes`);
  //     throw e;
  //   }
  // }
}

// (async () => {
//   const tM = new TieInManager();
//   const sT = new StorageManager();
//   const dP =
//     'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\json files\\childSeries\\00 - Versão em CBR - Longa - 134 Edições.json';
//   const tD = (await sT.readSerieData(dP)) as TieIn;

//   if (!tD.chapters) return;

//   const tC = tD.chapters.find((s) => s.id === 27);

//   if (!tC) return;

//   console.log(await tM.createChapterById(dP, 0));
// })();
