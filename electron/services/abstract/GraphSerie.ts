import path from 'path';

import { SerieForm } from '../../../src/types/series.interfaces';
import {
  graphChapter,
  graphSerie,
} from '../../types/electron-auxiliar.interfaces';
import StorageManager from '../StorageManager';
import ImageManager from '../ImageManager';
import LibrarySystem from './LibrarySystem';
import FileManager from '../FileManager';
import CollectionManager from '../CollectionManager';
import ArchiveManager from '../ArchiveManager';
import PdfManager from '../PdfManager';

export default abstract class GraphSerie<
  T extends graphSerie<C>,
  C extends graphChapter,
> extends LibrarySystem {
  protected abstract storageManager: StorageManager;
  protected abstract imageManager: ImageManager;
  protected abstract fileManager: FileManager;
  protected abstract collectionManager: CollectionManager;
  protected abstract archiveManager: ArchiveManager;
  protected abstract pdfManager: PdfManager;

  protected async processCovers(serieData: T): Promise<void> {
    const isImg = await this.imageManager.isImage(serieData.coverImage);

    if (isImg) {
      serieData.coverImage = await this.imageManager.normalizeImage(
        serieData.coverImage,
        path.join(this.showcaseImages, serieData.name),
      );
    }
  }

  protected async generateChapter(chapter: graphChapter) {
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
        await this.pdfManager.convertPdf_overdrive(normalized, chapterOut);
      } else {
        await this.archiveManager.extractWith7zip(normalized, chapterOut);
      }

      chapter.chapterPath = chapterOut;
    } catch (e) {
      console.error(`Erro ao processar os capítulos em "${chapter.name}":`, e);
      throw e;
    } finally {
      await this.imageManager.normalizeChapter(chapterOut);
    }
  }

  protected async createNewChapter(filesPath: string[], chapters: C[]) {
    const chapterMap = new Map(chapters.map((ch) => [ch.archivesPath, ch]));
    const existingPaths = chapters.map((ch) => ch.archivesPath);
    const allPaths = [...existingPaths, ...filesPath];
    const orderedPaths = await this.orderChapters(allPaths);

    const result: graphChapter[] = await Promise.all(
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

        const newChapter = await this.createChapter(
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

  async createChapter(
    serieName: string,
    archivePath: string,
    id: number,
  ): Promise<graphChapter> {
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

  async getChapter(dataPath: string, chapter_id: number): Promise<string[]> {
    const serie = await this.storageManager.readSerieData<T>(dataPath);

    if (!serie) {
      throw new Error('Série não encontrada.');
    }

    if (!serie.chapters?.length) {
      throw new Error('Nenhum capítulo encontrado.');
    }

    const chapter = serie.chapters.find((chap) => chap.id === chapter_id);

    if (!chapter?.chapterPath) {
      throw new Error('Capítulo não encontrado ou caminho inválido.');
    }

    const imageFiles = await this.fileManager.searchImages(chapter.chapterPath);

    const validations = await Promise.all(
      imageFiles.map((f) => this.imageManager.isImage(f)),
    );

    if (validations.some((valid) => !valid)) {
      throw new Error('Arquivos inválidos encontrados no capítulo.');
    }

    return this.imageManager.encodeImages(imageFiles);
  }

  async updateChapters(
    filesPath: string[],
    dataPath: string,
  ): Promise<graphChapter[]> {
    const serie = await this.storageManager.readSerieData<T>(dataPath);

    if (!serie) {
      throw new Error('Série não encontrada.');
    }

    if (!serie.chapters) throw new Error('Dados do capítulo não encontrandos.');

    const rawChapters = await this.createNewChapter(filesPath, serie.chapters);
    const chapters = await Promise.all(
      rawChapters.map(async (chapter) => {
        return await this.postProcessChapters(chapter);
      }),
    );

    serie.chapters = chapters as C[];
    serie.totalChapters = chapters.length;
    await this.storageManager.writeData(serie);

    return await this.imageManager.encodeComic(chapters);
  }

  async createChapterById(dataPath: string, chapter_id: number) {
    const serie = await this.storageManager.readSerieData<T>(dataPath);

    if (!serie) {
      throw new Error('Série não encontrada.');
    }

    const chapterToProcess = serie.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );

    if (!chapterToProcess) {
      throw new Error(`Capitulo com id ${chapter_id} nao foi encontrado.`);
    }

    await this.generateChapter(chapterToProcess);

    chapterToProcess.isDownloaded = 'downloaded';
    serie.metadata.lastDownload = chapterToProcess.id;
    await this.storageManager.writeData(serie);
  }

  async createMultipleChapters(dataPath: string, quantity: number) {
    const serie = await this.storageManager.readSerieData<T>(dataPath);

    if (!serie) {
      throw new Error('Série não encontrada.');
    }

    if (!serie.chapters) {
      throw new Error('Serie não possui capitulos.');
    }

    const firstItem = serie.metadata.lastDownload;
    const lastItem = Math.min(firstItem + quantity, serie.chapters.length);

    const chaptersToProcess = serie.chapters.filter(
      (chapter) => chapter.id >= firstItem && chapter.id <= lastItem,
    );

    if (!chaptersToProcess) {
      throw new Error(`Intervalo de capitulos nao encontrado`);
    }

    await Promise.all(
      chaptersToProcess.map(async (chapter) => {
        await this.generateChapter(chapter);
        chapter.isDownloaded = 'downloaded';
        serie.metadata.lastDownload = chapter.id;
      }),
    );

    await this.storageManager.writeData(serie);
  }

  async save(serie: T): Promise<void> {
    await this.storageManager.writeData(serie);
  }

  async createSerie(serie: SerieForm): Promise<void> {
    const serieData = await this.processSerieData(serie);

    await this.processCovers(serieData);

    await this.collectionManager.initializeCollections(
      serieData,
      serieData.metadata.collections,
    );

    await this.updateSystem(serieData, serie.oldPath);
  }

  async updateSystem(serieData: T, oldPath: string) {
    await this.fileManager.localUpload(serieData, oldPath);
    await this.storageManager.writeData(serieData);
  }

  abstract mountEmptyChapter(serieName: string, fileName: string): graphChapter;

  abstract orderChapters(filesPath: string[]): Promise<string[]>;

  abstract postProcessChapters(chapter: graphChapter): Promise<graphChapter>;

  abstract processSerieData(serie: SerieForm): Promise<T>;
}
