import FileSystem from "./abstract/FileSystem";
import SystemManager from "./SystemManager";
import FileManager from "./FileManager";
import ValidationManager from "./ValidationManager";
import ImageManager from "./ImageManager";
import StorageManager from "./StorageManager";
import CollectionsManager from "./CollectionsManager";
import fse from "fs-extra";
import path from "path";
import { Comic, ComicEdition, ComicTieIn } from "../types/comic.interfaces";
import { SerieForm } from "../../src/types/series.interfaces";

export default class ComicManager extends FileSystem {
  private readonly systemManager: SystemManager = new SystemManager();
  private readonly fileManager: FileManager = new FileManager();
  private readonly validationManager: ValidationManager =
    new ValidationManager();
  private readonly imageManager: ImageManager = new ImageManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly collectionsManager: CollectionsManager =
    new CollectionsManager();
  private global_id: number;

  constructor() {
    super();
  }

  public async createComicSerie(serie: SerieForm): Promise<void> {
    try {
      const subDirectories = await this.searchDirectories(serie.archivesPath);
      const comicData = await this.createComicData(serie, subDirectories);

      const chapters = await this.createEditionData(
        comicData.archivesPath,
        comicData.createdAt
      );
      comicData.chapters = chapters;

      if (chapters.length === 0) {
        comicData.metadata.compiledComic = true;
      } else {
        await this.createCovers(comicData.name, comicData.chapters);
      }

      if (subDirectories.length > 0) {
        comicData.childSeries = await Promise.all(
          subDirectories.map((subSerie) =>
            this.createChildSeries(comicData.name, subSerie)
          )
        );
      }

      if (await this.validationManager.isDinamicImage(comicData.coverImage)) {
        comicData.coverImage = await this.imageManager.normalizeImage(
          comicData.coverImage
        );
      }

      comicData.coverImage = await this.fileManager.uploadCover(
        comicData.coverImage
      );
      const normalizedMangaData =
        this.storageManager.createNormalizedData(comicData);
      await this.collectionsManager.serieToCollection(normalizedMangaData);
      await this.storageManager.writeSerieData(comicData);
      await this.systemManager.setMangaId(this.global_id);
    } catch (error) {
      console.error("Erro ao criar o comic:", error);
      throw error;
    }
  }

  private async createComicData(
    serie: SerieForm,
    subDirectories: string[]
  ): Promise<Comic> {
    this.global_id = (await this.systemManager.getMangaId()) + 1;

    const allDirectories = [serie.archivesPath, ...subDirectories];
    const comics = await this.searchComics(allDirectories);
    const totalChapters = comics.length;

    return {
      id: this.global_id,
      name: serie.name,
      sanitizedName: serie.sanitizedName,
      archivesPath: serie.archivesPath,
      chaptersPath: path.join(
        this.imagesFilesPath,
        serie.literatureForm,
        serie.name
      ),
      dataPath: path.join(this.comicsData, `${serie.name}.json`),
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
      childSeries: [],
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
        compiledComic: false,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }

  public async createEditionData(
    archivePath: string,
    createdAt: string
  ): Promise<ComicEdition[]> {
    try {
      const dirEntries = await fse.readdir(archivePath, {
        withFileTypes: true,
      });

      const filePaths = dirEntries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(archivePath, entry.name));

      if (filePaths.length === 0) {
        return [];
      }

      const chapters: ComicEdition[] = await Promise.all(
        filePaths.map(async (filePath, index) => {
          const fileName = path.basename(filePath, path.extname(filePath));
          const sanitizedFileName = this.fileManager.sanitizeFilename(fileName);

          return {
            id: index + 1,
            name: fileName.replace("#", ""),
            coverPath: "",
            sanitizedName: sanitizedFileName,
            archivesPath: path.resolve(filePath),
            chapterPath: "",
            createdAt: createdAt,
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
    } catch (error) {
      console.error(`Erro ao criar os capítulos do comic: ${error}`);
      throw error;
    }
  }

  private createChildSeries(
    parentName: string,
    childSeries: string
  ): ComicTieIn {
    return {
      parentId: this.global_id,
      childSerieName: path.basename(childSeries),
      childSerieArchivesPath: path.join(
        this.basePath,
        parentName,
        path.basename(childSeries)
      ),
      childSerieDataPath: path.join(
        this.comicsData,
        `${path.basename(childSeries)}.json`
      ),
      childSerieCoverPath: "",
    };
  }

  private async createCovers(serieName: string, chapters: ComicEdition[]) {
    try {
      await Promise.all(
        chapters.map(async (chap) => {
          const chapterName = this.fileManager
            .sanitizeFilename(chap.name)
            .slice(0, 32)
            .concat(`${chap.id}`);

          chap.chapterPath = path.join(
            this.comicsImages,
            serieName,
            chapterName
          );

          await this.storageManager.extractCoverWith7zip(
            chap.archivesPath,
            chap.chapterPath
          );

          await this.imageManager.normalizeChapter(chap.chapterPath);
          chap.coverPath = await this.coverToComic(chap.chapterPath);
        })
      );
    } catch (e) {
      console.error(`Falha em criar covers para ${serieName}: `);
      throw e;
    }
  }

  private async coverToComic(chapterPath: string): Promise<string> {
    try {
      const dir = await fse.opendir(chapterPath);

      for await (const dirent of dir) {
        if (dirent.isFile()) {
          return path.join(dirent.parentPath, dirent.name);
        }
      }
    } catch (e) {
      console.error(`Falha em anexar cover: ${e}`);
      throw e;
    }
  }

  private async searchDirectories(directoryPath: string): Promise<string[]> {
    const directories: string[] = [];

    try {
      const entries = await fse.readdir(directoryPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(directoryPath, entry.name);
          directories.push(fullPath);

          const subDirs = await this.searchDirectories(fullPath);
          directories.push(...subDirs);
        }
      }

      return directories;
    } catch (error) {
      console.error(`Erro ao buscar diretórios em ${directoryPath}: ${error}`);
      throw error;
    }
  }

  private async searchComics(directories: string[]): Promise<string[]> {
    try {
      const comicsPathsArrays = await Promise.all(
        directories.map(async (dir) => {
          try {
            const entries = (
              await fse.readdir(dir, { withFileTypes: true })
            ).filter((entry) => entry.isFile());
            return entries.map((entry) => path.join(dir, entry.name));
          } catch (error) {
            console.error(`Erro ao ler o diretório ${dir}: ${error}`);
            return [];
          }
        })
      );

      return comicsPathsArrays.flat();
    } catch (error) {
      console.error(`Erro ao buscar comics: ${error}`);
      throw error;
    }
  }

  public async getComic(
    dataPath: string,
    chapter_id: number
  ): Promise<string[] | string> {
    try {
      const serieData = await this.storageManager.readSerieData(dataPath);
      const chaptersData: ComicEdition[] = serieData.chapters as ComicEdition[];

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

  public async createEditionById(
    dataPath: string,
    editionId: number
  ): Promise<void> {
    try {
      const comicData = await this.storageManager.readSerieData(dataPath);

      const chapter: ComicEdition = comicData.chapters.find(
        (chapter) => chapter.id === editionId
      ) as ComicEdition;

      const chapterName = this.fileManager
        .sanitizeFilename(chapter.name)
        .slice(0, 32)
        .concat(`${chapter.id}`);

      const outputDir = path.join(
        this.comicsImages,
        comicData.name,
        chapterName
      );

      await this.storageManager.extractWith7zip(
        chapter.archivesPath,
        outputDir
      );
      await this.imageManager.normalizeChapter(outputDir);

      chapter.isDownload = true;
      comicData.metadata.lastDownload = chapter.id;

      await this.storageManager.updateSerieData(comicData);
    } catch (error) {
      console.error(`Falha em criar a edição: ${error}`);
      throw error;
    }
  }
}
