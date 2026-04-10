import path from 'path';
import fse from 'fs-extra';

import ComicManager from './ComicManager';
import FileManager from './FileManager';
import ImageManager from './ImageManager';
import PdfManager from './PdfManager';
import ArchiveManager from './ArchiveManager';
import storageManager from './StorageManager';
import {
  LiteratureForm,
  ReadingStatus,
} from '../../src/types/series.interfaces';
import { ComicTieIn, TieIn, ComicEdition } from '../types/comic.interfaces';

export default class TieInManager extends ComicManager {
  protected readonly fileManager: FileManager = new FileManager();
  protected readonly storageManager = storageManager;
  protected readonly imageManager: ImageManager = new ImageManager();
  protected readonly pdfManager: PdfManager = new PdfManager();
  protected readonly archiveManager: ArchiveManager = new ArchiveManager();

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

      await this.createTieIn(child, oldPath);
    }
  }

  private async mountEmptyTieIn(): Promise<TieIn> {
    const id = await this.consumeNextSerieId();
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
      literatureForm: LiteratureForm.COMIC,
      chapters: [],
      readingData: {
        lastChapterId: 0,
        lastReadAt: '',
      },
      metadata: {
        lastDownload: 0,
        isFavorite: false,
        isCreated: false,
        status: ReadingStatus.PENDING,
        originalOwner: '',
        recommendedBy: '',
        rating: 0,
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

  public async createEditionCover(chap: ComicEdition) {
    try {
      const rawName = chap.name;
      const safeDirName = this.fileManager
        .sanitizeDirName(rawName)
        .replaceAll('_', '')
        .replaceAll('-', '');

      const outputPath = path.join(
        this.showcaseImages,
        chap.serieName,
        safeDirName,
      );

      chap.chapterPath = path.join(
        this.comicsImages,
        chap.serieName,
        chap.name,
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
    } catch (e) {
      console.error(`Falha em gerar capa para as edicoes`);
      throw e;
    }
  }
}
