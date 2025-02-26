import path from "path";
import fs from "fs/promises";

export default abstract class FileSystem {
  protected readonly absoluteBasePath: string = process.cwd();
  protected readonly storage: string;
  protected readonly basePath: string;
  protected readonly dataPath: string;
  protected readonly seriesPath: string;
  protected readonly imagesFilesPath: string;
  protected readonly showcaseImages: string;
  protected readonly jsonFilesPath: string;
  protected readonly configFilePath: string;

  protected readonly comicConfig: string;

  protected readonly mangaConfig: string;

  protected readonly bookConfig: string;

  protected readonly booksData: string;
  protected readonly mangasData: string;
  protected readonly comicsData: string;

  protected readonly booksImages: string;
  protected readonly comicsImages: string;
  protected readonly mangasImages: string;

  protected readonly appCollections: string;

  protected constructor() {
    this.storage = path.join(this.absoluteBasePath, "storage");
    this.basePath = path.join(this.storage, "user library");

    this.dataPath = path.join(this.storage, "data store");
    this.imagesFilesPath = path.join(this.dataPath, "images files");
    this.jsonFilesPath = path.join(this.dataPath, "json files");

    this.showcaseImages = path.join(this.imagesFilesPath, "showCaseImages");
    this.configFilePath = path.join(
      this.storage,
      "config",
      "app",
      "appConfig.json"
    );
    this.appCollections = path.join(
      this.storage,
      "config",
      "app",
      "appCollections.json"
    );

    this.comicConfig = path.join(
      this.storage,
      "config",
      "app",
      "appConfig.json"
    );
    this.mangaConfig = path.join(
      this.storage,
      "config",
      "manga",
      "mangasConfig.json"
    );
    this.bookConfig = path.join(
      this.storage,
      "config",
      "books",
      "bookConfig.json"
    );

    this.booksData = path.join(this.jsonFilesPath, "Books");
    this.comicsData = path.join(this.jsonFilesPath, "Comics");
    this.mangasData = path.join(this.jsonFilesPath, "Mangas");

    this.booksImages = path.join(this.imagesFilesPath, "Book");
    this.comicsImages = path.join(this.imagesFilesPath, "Comic");
    this.mangasImages = path.join(this.imagesFilesPath, "Manga");
  }

  public async createFolder(path: string): Promise<void> {
    try {
      await fs.mkdir(path, { recursive: true });
    } catch (e) {
      console.error(`Erro ao criar diretório: ${path}`, e);
      throw e;
    }
  }

  public async deleteFolder(path: string): Promise<void> {
    try {
      await fs.rm(path, { force: true });
    } catch (e) {
      console.error(`Erro ao criar diretório: ${path}`, e);
      throw e;
    }
  }

  public async foundFiles(dirPath: string): Promise<string[]> {
    try {
      const contents = await fs.readdir(dirPath, { withFileTypes: true });
      const filter =
        /\.(jpe?g|png|gif|bmp|webp|tiff|pdf|cbz|cbr|md|markdown|json)$/i;
      const filePaths = contents
        .filter((content) => content.isFile() && filter.test(content.name))
        .map((file) => path.join(dirPath, file.name));

      return filePaths;
    } catch (e) {
      console.error(`erro encontrado: ${e}`);
      throw e;
    }
  }
}
