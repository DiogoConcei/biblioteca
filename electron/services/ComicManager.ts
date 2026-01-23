import path from "path";

import LibrarySystem from "./abstract/LibrarySystem";
import FileManager from "./FileManager";
import StorageManager from "./StorageManager";
import ImageManager from "./ImageManager";
import TieInManager from "./TieInManager";
import CollectionManager from "./CollectionManager";

import { Comic, ComicEdition, ComicTieIn } from "../types/comic.interfaces";

import { SerieData, SerieForm } from "../../src/types/series.interfaces";

export default class ComicManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly tieManager: TieInManager = new TieInManager();
  private readonly collManager: CollectionManager = new CollectionManager();
  private readonly storageManager: StorageManager = new StorageManager();

  public async createComicSerie(serie: SerieForm) {
    const comicData = await this.processSerieData(serie);

    if (comicData.childSeries) {
      await this.processTieInData(serie.oldPath, comicData.childSeries);
    }

    await this.processCovers(serie.oldPath, comicData);

    await this.collManager.initializeCollections(
      comicData,
      comicData.metadata.collections,
    );

    await this.updateSytem(comicData, serie.oldPath);
  }

  public async processCovers(oldPath: string, comicData: Comic) {
    if (comicData.childSeries) {
      const childSeries = comicData.childSeries;
      await this.tieManager.generateChildCovers(childSeries, oldPath);
    }

    if (comicData.chapters) {
      await this.createEditionCovers(oldPath, comicData.chapters);
    }

    const isImg = await this.imageManager.isImage(comicData.coverImage);

    if (isImg) {
      comicData.coverImage = await this.imageManager.normalizeImage(
        comicData.coverImage,
        path.join(this.showcaseImages, comicData.name),
      );
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
          .replaceAll("#", "");
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
      .replaceAll("#", "");
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
        comicEdition.map(async (chap, idx) => {
          const outputPath = path.join(
            this.showcaseImages,
            chap.serieName,
            chap.name,
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

  public async createChapterById(dataPath: string, chapter_id: number) {
    const comicData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Comic;

    if (!comicData.chapters) {
      throw new Error("Serie não possui capitulos.");
    }

    const editionToProces = comicData.chapters.find(
      (chapter) => chapter.id === chapter_id,
    );

    if (!editionToProces) {
      throw new Error(`Capitulo com id ${chapter_id} nao foi encontrado.`);
    }

    await this.generateChapter(editionToProces);

    editionToProces.isDownloaded = "downloaded";
    comicData.metadata.lastDownload = editionToProces.id;
    await this.storageManager.updateSerieData(comicData);
  }

  public async getComic(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[]> {
    try {
      const comic = await this.storageManager.readSerieData(dataPath);

      if (!comic.chapters || comic.chapters.length === 0) {
        throw new Error("Nenhum capítulo encontrado.");
      }

      const chapter = comic.chapters.find((chap) => chap.id === chapter_id);

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

  // Atualizar a quantidade de capítulos
  public async updateEditions(
    filesPath: string[],
    dataPath: string,
  ): Promise<ComicEdition[]> {
    const serieData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Comic;

    if (!serieData.chapters)
      throw new Error("Dados do capítulo não encontrandos.");

    const rawChapters = await this.createNewEdition(
      filesPath,
      serieData.chapters,
    );

    const updatedChapters = await Promise.all(
      rawChapters.map(async (edition: ComicEdition) => {
        if (edition.coverImage) {
          return edition;
        }

        const outputPath = path.join(
          this.showcaseImages,
          edition.serieName,
          edition.name,
        );

        // usa archivesPath
        if (!edition.archivesPath) {
          console.warn(
            `Arquivo de origem não informado para a edição ${edition.name}. Pulando geração de capa.`,
          );
          return edition;
        }

        edition.coverImage = await this.imageManager.generateCover(
          edition.archivesPath,
          outputPath,
        );

        return edition;
      }),
    );

    serieData.chapters = updatedChapters;
    serieData.totalChapters = updatedChapters.length;
    await this.storageManager.updateSerieData(serieData);

    return await this.imageManager.encodeComic(updatedChapters);
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

  private async generateChapter(chapter: ComicEdition) {
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

  private async updateSytem(comicData: Comic, oldPath: string) {
    await this.fileManager.localUpload(comicData, oldPath);
    await this.storageManager.writeSerieData(comicData);
    await this.setSerieId(comicData.id + 1);
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
    const nextId = (await this.getSerieId()) + 1;
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
      readingData: { lastChapterId: 1, lastReadAt: "" },
      chapters: [],
      childSeries: [],
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

    return {
      id: 0,
      serieName: serieName,
      name: fileName,
      coverImage: "",
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

(async () => {
  const name = "14 Poderosos Vingadores";
  const fManager = new FileManager();
  const cManager = new ComicManager();

  const preData: SerieData = {
    name,
    newPath:
      "C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\user library",
    oldPath: "C:\\Users\\diogo\\Downloads\\Arquivos\\14 Poderosos Vingadores",
    sanitizedName: fManager.sanitizeFilename(name),
    createdAt: new Date().toISOString(),
  };

  const data: SerieForm = {
    autoBackup: "Sim",
    chaptersPath: "",
    collections: ["Marvel"],
    cover_path: "C:\\Users\\diogo\\Downloads\\Imagens\\migt.jpg",
    createdAt: preData.createdAt,
    deletedAt: "",
    literatureForm: "Quadrinho",
    name,
    oldPath: preData.oldPath,
    privacy: "Publica",
    readingStatus: "Pendente",
    sanitizedName: preData.sanitizedName,
    tags: [],
    author: "Desconhecido",
    genre: "Super Herói",
    language: "Português",
    archivesPath: path.join(preData.newPath, preData.name),
  };

  await cManager.createComicSerie(data);
})();
