import path from 'path';
import fse from 'fs-extra';
import { app } from 'electron';

import { AppConfig } from '../../types/settings.interfaces';

export default abstract class LibrarySystem {
  // O app.getPath só funciona se o app estiver pronto.
  // Em alguns casos de teste ou instanciamento precoce, pode falhar.
  // Usamos um getter para garantir que pegamos o caminho correto sempre.

  get baseStorageFolder(): string {
    return path.join(app.getPath('userData'), 'storage');
  }

  protected get backupFolder(): string {
    return path.join(this.baseStorageFolder, 'backups');
  }

  protected get logsFolder(): string {
    return path.join(this.baseStorageFolder, 'logs');
  }

  protected get dataStorage(): string {
    return path.join(this.baseStorageFolder, 'data store');
  }

  protected get userLibrary(): string {
    return path.join(this.baseStorageFolder, 'user library');
  }

  protected get configFolder(): string {
    return path.join(this.baseStorageFolder, 'config');
  }

  protected get imagesFolder(): string {
    return path.join(this.dataStorage, 'images files');
  }

  protected get backgroundImages(): string {
    return path.join(this.imagesFolder, 'background images');
  }

  protected get jsonFolder(): string {
    return path.join(this.dataStorage, 'json files');
  }

  protected get appConfigFolder(): string {
    return path.join(this.configFolder, 'app');
  }

  protected get showcaseImages(): string {
    return path.join(this.imagesFolder, 'showcase images');
  }

  protected get dinamicImages(): string {
    return path.join(this.imagesFolder, 'dinamic images');
  }

  protected get booksImages(): string {
    return path.join(this.imagesFolder, 'book');
  }

  protected get comicsImages(): string {
    return path.join(this.imagesFolder, 'comic');
  }

  protected get mangasImages(): string {
    return path.join(this.imagesFolder, 'manga');
  }

  protected get booksData(): string {
    return path.join(this.jsonFolder, 'books');
  }

  protected get comicsData(): string {
    return path.join(this.jsonFolder, 'Comics');
  }

  protected get childSeriesData(): string {
    return path.join(this.jsonFolder, 'childSeries');
  }

  protected get mangasData(): string {
    return path.join(this.jsonFolder, 'Mangas');
  }

  protected get configFilePath(): string {
    return path.join(this.appConfigFolder, 'config.json');
  }

  protected get appCollections(): string {
    return path.join(this.appConfigFolder, 'appCollections.json');
  }

  constructor() {}

  public async createFolder(folderPath: string): Promise<void> {
    try {
      await fse.mkdir(folderPath, { recursive: true });
    } catch (e) {
      console.error(`Erro ao criar diretório: ${folderPath}`, e);
      throw e;
    }
  }

  public async deleteFolder(folderPath: string): Promise<void> {
    try {
      await fse.rm(folderPath, { force: true, recursive: true });
    } catch (e) {
      console.error(`Erro ao deletar diretório: ${folderPath}`, e);
      throw e;
    }
  }

  public async foundFiles(dirPath: string): Promise<string[]> {
    try {
      if (!(await fse.pathExists(dirPath))) return [];

      const contents = await fse.readdir(dirPath, { withFileTypes: true });
      const filter =
        /\.(jpe?g|png|gif|bmp|webp|tiff|pdf|cbz|cbr|md|markdown|json)$/i;
      const filePaths = contents
        .filter((content) => content.isFile() && filter.test(content.name))
        .map((file) => path.join(dirPath, file.name));

      return filePaths;
    } catch (e) {
      console.error(`Erro ao buscar arquivos em ${dirPath}: ${e}`);
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
      return 0; // Fallback para 0 se não existir
    }
  }
}
