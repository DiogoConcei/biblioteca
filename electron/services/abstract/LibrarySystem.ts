import path from 'path';
import fse from 'fs-extra';
import { AppConfig } from '../../types/settings.interfaces';

export default abstract class LibrarySystem {
  readonly baseStorageFolder: string =
    'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage';

  protected readonly backupFolder: string = path.join(
    this.baseStorageFolder,
    'backups',
  );

  protected readonly logsFolder: string = path.join(
    this.baseStorageFolder,
    'logs',
  );

  protected readonly dataStorage: string = path.join(
    this.baseStorageFolder,
    'data store',
  );

  protected readonly userLibrary: string = path.join(
    this.baseStorageFolder,
    'user library',
  );

  protected readonly configFolder: string = path.join(
    this.baseStorageFolder,
    'config',
  );

  protected readonly imagesFolder: string = path.join(
    this.dataStorage,
    'images files',
  );

  protected readonly backgroundImages: string = path.join(
    this.imagesFolder,
    'background images',
  );

  protected readonly jsonFolder: string = path.join(
    this.dataStorage,
    'json files',
  );

  protected readonly appConfigFolder: string = path.join(
    this.configFolder,
    'app',
  );

  protected readonly showcaseImages: string = path.join(
    this.imagesFolder,
    'showcase images',
  );

  protected readonly dinamicImages: string = path.join(
    this.imagesFolder,
    'dinamic images',
  );

  protected readonly booksImages: string = path.join(this.imagesFolder, 'book');

  protected readonly comicsImages: string = path.join(
    this.imagesFolder,
    'comic',
  );

  protected readonly mangasImages: string = path.join(
    this.imagesFolder,
    'manga',
  );

  protected readonly booksData: string = path.join(this.jsonFolder, 'books');

  protected readonly comicsData: string = path.join(this.jsonFolder, 'Comics');

  protected readonly childSeriesData: string = path.join(
    this.jsonFolder,
    'childSeries',
  );

  protected readonly mangasData: string = path.join(this.jsonFolder, 'Mangas');

  protected readonly configFilePath: string = path.join(
    this.appConfigFolder,
    'config.json',
  );

  protected readonly appCollections: string = path.join(
    this.appConfigFolder,
    'appCollections.json',
  );

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

  public async consumeNextSerieId(): Promise<number> {
    try {
      const currentId = await this.getSerieId();
      const nextId = currentId + 1;

      await this.setSerieId(nextId);

      return nextId;
    } catch (e) {
      console.error(`Erro ao consumir o próximo ID: ${e}`);
      throw e;
    }
  }

  public async setSerieId(newId: number): Promise<void> {
    try {
      let data: Partial<AppConfig>;
      try {
        const raw = await fse.readFile(this.configFilePath, 'utf-8');
        data = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Erro ao ler ou interpretar o JSON: ${err}`);
      }

      if (!data.metadata || typeof data.metadata !== 'object') {
        data.metadata = { global_id: newId };
      } else {
        data.metadata.global_id = newId;
      }

      await fse.writeFile(
        this.configFilePath,
        JSON.stringify(data, null, 2),
        'utf-8',
      );

      console.log(`✅ global_id atualizado para ${newId}`);
    } catch (err) {
      console.error(`❌ Erro ao atualizar global_id:`, err);
      throw err;
    }
  }

  public async getSerieId(): Promise<number> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );

      return data.metadata.global_id;
    } catch (e) {
      console.error(`Erro ao obter o ID atual: ${e}`);
      throw e;
    }
  }
}
