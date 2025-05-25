import path from 'path';
import fse from 'fs-extra';

export default abstract class FileSystem {
  protected readonly baseStorageFolder = 'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage';
  protected readonly dataStorage: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
  );
  protected readonly userLibrary: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'user library',
  );
  protected readonly imagesFolder: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'images files',
  );
  protected readonly dinamicImages: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'images files',
    'dinamic images',
  );

  protected readonly jsonFolder = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'json files',
  );
  protected readonly showcaseImages: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'images files',
    'showcase images',
  );
  protected readonly booksData: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'json files',
    'books',
  );
  protected readonly comicsData: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'json files',
    'comics',
  );
  protected readonly mangasData: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'json files',
    'mangas',
  );
  protected readonly booksImages: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'images files',
    'book',
  );
  protected readonly comicsImages: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'images files',
    'comic',
  );
  protected readonly mangasImages: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'data store',
    'images files',
    'manga',
  );
  protected readonly configFilePath: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'config',
    'app',
    'appConfig.json',
  );
  protected readonly comicConfig = path.join(
    this.baseStorageFolder,
    'config',
    'comic',
    'appConfig.json',
  );
  protected readonly mangaConfig = path.join(
    this.baseStorageFolder,
    'config',
    'manga',
    'mangasConfig.json',
  );
  protected readonly bookConfig = path.join(
    this.baseStorageFolder,
    'config',
    'books',
    'bookConfig.json',
  );
  protected readonly appCollections: string = path.join(
    'C:\\Users\\Diogo\\AppData\\Roaming\\biblioteca\\storage',
    'config',
    'app',
    'appCollections.json',
  );

  // readonly baseStorageFolder: string = global.storageFolder;

  // // ─── Pastas dentro de “storage” ────────────────────────────────────
  // protected readonly dataStorage: string = path.join(this.baseStorageFolder, 'data store');

  // protected readonly userLibrary: string = path.join(this.baseStorageFolder, 'user library');

  // protected readonly configFolder: string = path.join(this.baseStorageFolder, 'config');

  // protected readonly imagesFolder: string = path.join(this.dataStorage, 'images files');

  // protected readonly jsonFolder: string = path.join(this.dataStorage, 'json files');

  // // ─── Subpastas de “config” ─────────────────────────────────────────
  // protected readonly appConfigFolder: string = path.join(this.configFolder, 'app');

  // // ─── Subpastas de “images files” ───────────────────────────────────
  // protected readonly showcaseImages: string = path.join(this.imagesFolder, 'showcase images');

  // protected readonly dinamicImages: string = path.join(this.imagesFolder, 'dinamic images');

  // protected readonly booksImages: string = path.join(this.imagesFolder, 'book');

  // protected readonly comicsImages: string = path.join(this.imagesFolder, 'comic');

  // protected readonly mangasImages: string = path.join(this.imagesFolder, 'manga');

  // // ─── Subpastas de “json files” ─────────────────────────────────────
  // protected readonly booksData: string = path.join(this.jsonFolder, 'books');

  // protected readonly comicsData: string = path.join(this.jsonFolder, 'Comics');

  // protected readonly mangasData: string = path.join(this.jsonFolder, 'Mangas');

  // // ─── Arquivos de configuração dentro de “config/App” ─────────────────
  // protected readonly configFilePath: string = path.join(this.appConfigFolder, 'appConfig.json');

  // protected readonly appCollections: string = path.join(
  //   this.appConfigFolder,
  //   'appCollections.json',
  // );

  constructor() {}

  public async createFolder(path: string): Promise<void> {
    try {
      await fse.mkdir(path, { recursive: true });
    } catch (e) {
      console.error(`Erro ao criar diretório: ${path}`, e);
      throw e;
    }
  }

  public async deleteFolder(path: string): Promise<void> {
    try {
      await fse.rm(path, { force: true });
    } catch (e) {
      console.error(`Erro ao criar diretório: ${path}`, e);
      throw e;
    }
  }

  public async foundFiles(dirPath: string): Promise<string[]> {
    try {
      const contents = await fse.readdir(dirPath, { withFileTypes: true });
      const filter = /\.(jpe?g|png|gif|bmp|webp|tiff|pdf|cbz|cbr|md|markdown|json)$/i;
      const filePaths = contents
        .filter(content => content.isFile() && filter.test(content.name))
        .map(file => path.join(dirPath, file.name));

      return filePaths;
    } catch (e) {
      console.error(`erro encontrado: ${e}`);
      throw e;
    }
  }
}
