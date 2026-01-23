import path from "path";

import LibrarySystem from "./abstract/LibrarySystem";
import FileManager from "./FileManager";
import CollectionManager from "./CollectionManager";
import ImageManager from "./ImageManager";
import StorageManager from "./StorageManager";

import { Manga, MangaChapter } from "../types/manga.interfaces";

import { SerieForm } from "../../src/types/series.interfaces";

export default class MangaManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly collManager: CollectionManager = new CollectionManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public async createMangaSerie(serie: SerieForm) {
    const mangaData = await this.processSerieData(serie);

    await this.processCovers(serie.oldPath, mangaData);

    await this.collManager.initializeCollections(
      mangaData,
      mangaData.metadata.collections,
    );

    await this.updateSytem(mangaData, serie.oldPath);
  }

  public async processCovers(oldPath: string, mangaData: Manga) {
    const isImg = await this.imageManager.isImage(mangaData.coverImage);

    if (isImg) {
      mangaData.coverImage = await this.imageManager.normalizeImage(
        mangaData.coverImage,
        path.join(this.showcaseImages, mangaData.name),
      );
    }
  }

  public async getManga(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[]> {
    try {
      const manga = await this.storageManager.readSerieData(dataPath);

      if (!manga.chapters || manga.chapters.length === 0) {
        throw new Error("Nenhum capítulo encontrado.");
      }

      const chapter = manga.chapters.find((chap) => chap.id === chapter_id);

      if (!chapter || !chapter.chapterPath) {
        throw new Error("Capítulo não encontrado ou caminho inválido.");
      }

      const imageFiles = await this.fileManager.searchImages(
        chapter.chapterPath,
      );

      for (let idx = 0; idx < imageFiles.length; idx++) {
        const imageFile = imageFiles[idx];

        if (!(await this.imageManager.isImage(imageFile))) {
          return [];
        }
      }

      const processedImages = await this.imageManager.encodeImages(imageFiles);

      return processedImages;
    } catch (error) {
      console.error("Não foi possível encontrar a edição do quadrinho:", error);
      throw error;
    }
  }

  public async createChapterById(dataPath: string, chapter_id: number) {
    const mangaData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Manga;

    if (!mangaData.chapters) {
      throw new Error("Serie não possui capitulos.");
    }

    const chapterToProcess = mangaData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );

    if (!chapterToProcess) {
      throw new Error(`Capitulo com id ${chapter_id} nao foi encontrado.`);
    }

    await this.generateChapter(chapterToProcess);

    chapterToProcess.isDownloaded = "downloaded";
    mangaData.metadata.lastDownload = chapterToProcess.id;
    await this.storageManager.updateSerieData(mangaData);
  }

  public async createMultipleChapters(dataPath: string, quantity: number) {
    const mangaData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Manga;

    if (!mangaData.chapters) {
      throw new Error("Serie não possui capitulos.");
    }

    const firstItem = mangaData.metadata.lastDownload;
    const lastItem = Math.min(firstItem + quantity, mangaData.chapters.length);

    const chaptersToProcess = mangaData.chapters.filter(
      (chapter) => chapter.id >= firstItem && chapter.id <= lastItem,
    );

    if (!chaptersToProcess) {
      throw new Error(`Intervalo de capitulos nao encontrado`);
    }

    await Promise.all(
      chaptersToProcess.map(async (chapter) => {
        await this.generateChapter(chapter);
        chapter.isDownloaded = "downloaded";
        mangaData.metadata.lastDownload = chapter.id;
      }),
    );

    await this.storageManager.updateSerieData(mangaData);
  }

  public async updateChapters(
    filesPath: string[],
    dataPath: string,
  ): Promise<MangaChapter[]> {
    const serieData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Manga;

    if (!serieData.chapters)
      throw new Error("Dados do capítulo não encontrandos.");

    const chapters = await this.createNewChapter(filesPath, serieData.chapters);

    serieData.chapters = chapters;
    serieData.totalChapters = chapters.length;
    await this.storageManager.updateSerieData(serieData);

    return await this.imageManager.encodeComic(chapters);
  }

  private async createNewChapter(
    filesPath: string[],
    chapters: MangaChapter[],
  ) {
    const chapterMap = new Map(chapters.map((ch) => [ch.archivesPath, ch]));
    const existingPaths = chapters.map((ch) => ch.archivesPath);
    const allPaths = [...existingPaths, ...filesPath];
    const orderedPaths = await this.fileManager.orderManga(allPaths);

    const result: MangaChapter[] = await Promise.all(
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

  public async createChapter(
    serieName: string,
    archivePath: string,
    id: number,
  ): Promise<MangaChapter> {
    const fileName = path
      .basename(archivePath, path.extname(archivePath))
      .replaceAll("#", "");
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

  private async generateChapter(chapter: MangaChapter) {
    const normalized = path.resolve(chapter.archivesPath);
    const ext = path.extname(normalized);

    const chapterOut = await this.fileManager.buildChapterPath(
      this.comicsImages,
      chapter.serieName,
      chapter.name,
    );

    try {
      if (ext === ".pdf") {
        await this.storageManager.convertPdf_overdrive(normalized, chapterOut);
      } else {
        await this.storageManager.extractWith7zip(normalized, chapterOut);
      }

      chapter.chapterPath = chapterOut;
    } catch (e) {
      console.error(`Erro ao processar os capítulos em "${chapter.name}":`, e);
      throw e;
    } finally {
      await this.imageManager.normalizeChapter(chapterOut);
    }
  }

  private async updateSytem(mangaData: Manga, oldPath: string) {
    await this.fileManager.localUpload(mangaData, oldPath);
    await this.storageManager.writeSerieData(mangaData);
    await this.setSerieId(mangaData.id + 1);
  }

  private async createChapters(
    serieName: string,
    archivesPath: string,
  ): Promise<MangaChapter[]> {
    const [mangaEntries, total] =
      await this.fileManager.searchChapters(archivesPath);
    const orderChapters = await this.fileManager.orderManga(mangaEntries);

    if (!mangaEntries || mangaEntries.length === 0) return [];

    const chapters: MangaChapter[] = await Promise.all(
      orderChapters.map(async (mangaPath, idx) => {
        const fileName = path
          .basename(mangaPath, path.extname(mangaPath))
          .replaceAll("#", "");
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

  private async processSerieData(serie: SerieForm): Promise<Manga> {
    const manga = await this.mountEmptyManga(serie);
    const chapters = await this.createChapters(serie.name, serie.oldPath);

    return {
      ...manga,
      chapters,
    };
  }

  private async mountEmptyManga(serie: SerieForm): Promise<Manga> {
    const nextId = (await this.getSerieId()) + 1;
    const [dirEntries, totalChapters] = await this.fileManager.searchChapters(
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
      readingData: { lastChapterId: 1, lastReadAt: "" },
      chapters: [],
      metadata: {
        status: serie.readingStatus,
        collections: serie.collections,
        recommendedBy: "",
        originalOwner: "",
        lastDownload: 0,
        rating: 0,
        isFavorite: serie.collections.includes("Favoritas"),
        privacy: serie.privacy,
        autoBackup: serie.autoBackup,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }

  private mountEmptyChapter(serieName: string, fileName: string): MangaChapter {
    const createdAt = new Date().toISOString();

    return {
      id: 0,
      serieName: serieName,
      name: fileName,
      sanitizedName: "",
      archivesPath: "",
      chapterPath: "",
      createdAt,
      isRead: false,
      isDownloaded: "not_downloaded",
      page: {
        lastPageRead: 0,
        favoritePage: 0,
      },
    };
  }
}
