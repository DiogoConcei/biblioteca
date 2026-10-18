import path from 'path';
import fse from 'fs-extra';
import { SerieForm } from '../../../src/shared/types/series.interfaces.ts';
import {
  graphChapter,
  graphSerie,
  Literatures,
} from '../../types/electron-auxiliar.interfaces';
import type { StorageManager } from '../StorageManager';
import ImageManager from '../processing/ImageManager.ts';
import LibrarySystem from './LibrarySystem';
import FileManager from '../FileManager';
import CollectionManager from '../content/CollectionManager.ts';
import ArchiveManager from '../processing/ArchiveManager.ts';
import PdfManager from '../processing/PdfManager.ts';
import { LiteratureForm } from '../../types/comic.interfaces.ts';
import {
  ChapterUploadPayload,
  FailedItem,
  ProcessedChapterResult,
} from '../../types/upload.interfaces.ts';

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

    let nextId = chapters.reduce((max, ch) => Math.max(max, ch.id), 0) + 1;

    const result: graphChapter[] = await Promise.all(
      orderedPaths.map(async (chapterPath) => {
        const exits = chapterMap.get(chapterPath);

        if (exits) {
          return exits;
        }

        this.fileManager.moveChapter(
          chapterPath,
          path.join(this.userLibrary, chapters[0].serieName, path.basename(chapterPath)),
        );

        const newChapter = await this.createChapter(
          chapters[0].serieName,
          chapterPath,
          nextId++,
        );
        return newChapter;
      }),
    );

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
    serie: Literatures,
    payload: ChapterUploadPayload,
  ): Promise<ProcessedChapterResult> {
    const existing = serie.chapters as C[];
    let tempId = existing.reduce((max, c) => Math.max(max, c.id), 0) + 1;

    const created: { chapter: C; sourcePath: string }[] = [];
    const failed: FailedItem[] = [];

    for (const item of payload.chapters) {
      const dest = path.join(
        this.userLibrary,
        serie.name,
        path.basename(item.sourcePath),
      );
      try {
        await this.fileManager.moveChapter(item.sourcePath, dest);

        const raw = (await this.createChapter(serie.name, dest, tempId++)) as C;
        raw.name = item.label;
        raw.order = item.order;

        const processed = (await this.postProcessChapters(raw)) as C;
        created.push({ chapter: processed, sourcePath: item.sourcePath });
      } catch (e) {
        console.error(`Falha ao processar "${item.sourcePath}":`, e);
        failed.push({
          path: item.sourcePath,
          reason: e instanceof Error ? e.message : String(e),
        });
        await this.fileManager.moveChapter(dest, item.sourcePath);
      }
    }

    if (created.length === 0) return { succeeded: [], failed };

    const merged = [...existing, ...created.map((c) => c.chapter)].sort(
      (a, b) => a.order - b.order,
    );
    const idMap = new Map(merged.map((c, i) => [c.id, i + 1]));
    merged.forEach((c, i) => {
      c.id = i + 1;
      c.order = i + 1;
    });
    serie.readingData.lastChapterId =
      idMap.get(serie.readingData.lastChapterId) ?? serie.readingData.lastChapterId;
    serie.metadata.lastDownload =
      idMap.get(serie.metadata.lastDownload) ?? serie.metadata.lastDownload;

    serie.chapters = merged;
    serie.totalChapters = merged.length;
    await this.storageManager.writeData(serie);

    return { succeeded: created.map((c) => c.sourcePath), failed };
  }
  async deleteChapterById(dataPath: string, chapter_id: number) {
    const serie = await this.storageManager.readSerieData<T>(dataPath);

    if (!serie) {
      throw new Error('Série não encontrada.');
    }

    const chapterToProcess = serie.chapters.find((chapter) => chapter.id === chapter_id);

    if (!chapterToProcess) {
      throw new Error(`Capitulo com id ${chapter_id} nao foi encontrado.`);
    }

    if (await fse.pathExists(chapterToProcess.chapterPath)) {
      await fse.remove(chapterToProcess.chapterPath);
    }

    chapterToProcess.isDownloaded = 'not_downloaded';
    await this.storageManager.writeData(serie);
  }

  async createChapterById(dataPath: string, chapter_id: number) {
    const serie = await this.storageManager.readSerieData<T>(dataPath);

    if (!serie) {
      throw new Error('Série não encontrada.');
    }

    const chapterToProcess = serie.chapters.find((chapter) => chapter.id === chapter_id);

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
