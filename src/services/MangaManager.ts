import { Manga, MangaChapter } from "../types/manga.interfaces";
import { SerieForm } from "../types/series.interfaces";
import FileSystem from "./abstract/FileSystem";
import fse from "fs-extra";
import path from "path";
import FileManager from "./FileManager";
import StorageManager from "./StorageManager";
import ImageManager from "./ImageManager";
import SystemManager from "./SystemManager";
import CollectionsManager from "./CollectionsManager";
import ValidationManager from "./ValidationManager";

export default class MangaManager extends FileSystem {
  private global_id: number;
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private readonly systemManager: SystemManager = new SystemManager();
  private readonly validationManager: ValidationManager =
    new ValidationManager();

  constructor() {
    super();
  }

  public async createMangaSerie(serie: SerieForm): Promise<void> {
    try {
      const mangaData = await this.createMangaData(serie);
      const mangaChapters = await this.createMangaChapters(mangaData);
      mangaData.chapters = mangaChapters;

      if (await this.validationManager.isDinamicImage(mangaData.coverImage)) {
        const mangaCover = await this.imageManager.normalizeImage(
          mangaData.coverImage
        );
        mangaData.coverImage = mangaCover;
      }

      await this.fileManager.uploadCover(mangaData.coverImage);
      const normalizedMangaData =
        this.storageManager.createNormalizedData(mangaData);
      await this.collectionsManager.serieToCollection(normalizedMangaData);

      await this.storageManager.writeSerieData(mangaData);
      await this.systemManager.setMangaId(this.global_id);
    } catch (error) {
      console.error(`Erro ao gerar conteúdo para o manga: ${error}`);
      throw error;
    }
  }

  private async createMangaData(serie: SerieForm): Promise<Manga> {
    try {
      this.global_id = (await this.systemManager.getMangaId()) + 1;
      const totalChapters = (
        await fse.readdir(serie.archivesPath, { withFileTypes: true })
      ).length;

      return {
        id: this.global_id,
        name: serie.name,
        sanitizedName: serie.sanitizedName,
        archivesPath: serie.archivesPath,
        chaptersPath: path.join(
          serie.chaptersPath,
          serie.literatureForm,
          serie.name
        ),
        dataPath: path.join(this.mangasData, `${serie.name}.json`),
        coverImage: serie.cover_path,
        totalChapters: totalChapters,
        genre: serie.genre,
        author: serie.author,
        language: serie.language,
        literatureForm: serie.literatureForm,
        chaptersRead: 0,
        readingData: {
          lastChapterId: 1,
          lastReadAt: "",
        },
        chapters: [],
        metadata: {
          status: serie.readingStatus,
          collections: serie.collections,
          recommendedBy: "",
          originalOwner: "",
          lastDownload: 0,
          rating: 0,
          isFavorite: false,
          privacy: serie.privacy,
          autoBackup: serie.autoBackup,
        },

        deletedAt: serie.deletedAt,
        createdAt: serie.createdAt,
        tags: serie.tags,
        comments: [],
      };
    } catch (e) {
      console.error(`erro ao criar dados para o manga: ${e}`);
      throw e;
    }
  }

  private async createMangaChapters(serie: Manga): Promise<MangaChapter[]> {
    try {
      const unPaths = (
        await fse.readdir(serie.archivesPath, { withFileTypes: true })
      ).map((direntPath) => path.join(direntPath.parentPath, direntPath.name));
      const chaptersPath = await this.fileManager.orderByChapters(unPaths);

      const chapters = await Promise.all(
        chaptersPath.map(async (chapterPath, index) => {
          const name = path.basename(chapterPath, path.extname(chapterPath));
          const sanitizedName = this.fileManager.sanitizeFilename(name);

          return {
            id: index + 1,
            name: name,
            sanitizedName: sanitizedName,
            archivesPath: path.resolve(chapterPath),
            chapterPath: "",
            createdAt: serie.createdAt,
            isRead: false,
            isDownload: false,
            page: {
              lastPageRead: 0,
              favoritePage: 0,
            },
          };
        })
      );

      return chapters;
    } catch (e) {
      console.error(`erro em criar capitulos do Manga: ${e}`);
      throw e;
    }
  }

  public async createMangaCovers(archivesPath: string): Promise<string[]> {
    try {
      const serieName = path.basename(archivesPath);

      const entries = await fse.readdir(archivesPath, { withFileTypes: true });
      const fullPaths = entries.map((entry) =>
        path.join(archivesPath, entry.name)
      );

      const orderedChapters = await this.fileManager.orderByChapters(fullPaths);
      const selectedChapters = orderedChapters.slice(0, 3);

      const covers: string[] = [];

      for (const chapter of selectedChapters) {
        const baseName = path.basename(chapter);
        const chapterName = this.fileManager
          .sanitizeFilename(baseName)
          .slice(0, 32);
        const outputDir = path.join(this.mangasImages, serieName, chapterName);

        await this.storageManager.extractWith7zip(chapter, outputDir);
        await this.imageManager.normalizeChapter(outputDir);

        const imagesEntries = await fse.readdir(outputDir, {
          withFileTypes: true,
        });
        const chapterImages = imagesEntries
          .slice(0, 2)
          .map((entry) => path.join(outputDir, entry.name));

        covers.push(...chapterImages);
      }

      return covers;
    } catch (error) {
      console.error(`Erro em extrair a showcaseImage: ${error}`);
      throw error;
    }
  }

  public async getChapter(
    dataPath: string,
    chapter_id: number
  ): Promise<string[] | string> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);
      const chaptersData = serieData.chapters;
      const chapter = chaptersData.find((chap) => chap.id === chapter_id);
      const chapterDirents = await fse.readdir(chapter.chapterPath, {
        withFileTypes: true,
      });

      const imageFiles = chapterDirents
        .filter(
          (dirent) =>
            dirent.isFile() && /\.(jpeg|png|webp|tiff|jpg)$/i.test(dirent.name)
        )
        .map((dirent) => path.join(chapter.chapterPath, dirent.name));

      const processedImages = await this.imageManager.encodeImageToBase64(
        imageFiles
      );

      return processedImages;
    } catch (error) {
      console.error(`Erro ao obter conteúdo do capítulo: ${error.message}`);
      throw error;
    }
  }

  public async createEdition(dataPath: string, quantity: number) {
    const mangaData = await this.storageManager.readSerieData(dataPath);
    const lastDownload = await this.storageManager.foundLastDownload(mangaData);
    const firstItem = lastDownload;
    const lastItem = Math.min(
      lastDownload + quantity,
      mangaData.chapters.length
    );

    const chaptersToProcess = mangaData.chapters.filter(
      (chapter) => chapter.id >= firstItem && chapter.id <= lastItem
    );

    try {
      for await (const chapter of chaptersToProcess) {
        const outputDir = path.join(
          this.mangasImages,
          mangaData.name,
          chapter.name
        );

        await this.storageManager.extractWith7zip(
          chapter.archivesPath,
          outputDir
        );

        await this.imageManager.normalizeChapter(outputDir);
        chapter.isDownload = true;
        chapter.chapterPath = outputDir;
        mangaData.metadata.lastDownload = chapter.id;
      }

      await this.storageManager.updateSerieData(mangaData);
    } catch (e) {
      console.error(
        `Erro ao processar os capítulos em "${mangaData.name}": ${e}`
      );
      throw e;
    }
  }

  public async createEditionById(dataPath: string, chapter_id: number) {
    const mangaData = await this.storageManager.readSerieData(dataPath);

    const chapterToProcess = mangaData.chapters.find(
      (chapter) => chapter.id === chapter_id
    );
    try {
      const outputDir = path.join(
        this.mangasImages,
        mangaData.name,
        chapterToProcess.name
      );

      await this.storageManager.extractWith7zip(
        chapterToProcess.archivesPath,
        outputDir
      );
      await this.imageManager.normalizeChapter(outputDir);
      chapterToProcess.isDownload = true;
      chapterToProcess.chapterPath = outputDir;
      mangaData.metadata.lastDownload = chapterToProcess.id;

      await this.storageManager.updateSerieData(mangaData);
    } catch (e) {
      console.error(
        `Erro ao processar os capítulos em "${mangaData.name}": ${e}`
      );
      throw e;
    }
  }

  public async deleteMangaEditionById(
    dataPath: string,
    chapter_id: number
  ): Promise<void> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);
      const chapters = serieData.chapters;

      for (const chapter of chapters) {
        if (chapter.id === chapter_id) {
          if (chapter.chapterPath && fse.exists(chapter.chapterPath)) {
            await fse.rm(chapter.chapterPath, {
              recursive: true,
              force: true,
            });
            chapter.isDownload = false;
            chapter.chapterPath = "";
          }
        }
      }

      await this.storageManager.updateSerieData(serieData);
    } catch (e) {
      console.error(`Falha em excluir capítulo: ${e}`);
      throw e;
    }
  }
}

// (async () => {
//   const mangaManager = new MangaManager();
//   const testePath =
//     "C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\user library\\Dr. Stone";
//   console.log(await mangaManager.createMangaCovers(testePath));
// })();
