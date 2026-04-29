import fse from 'fs-extra';
import path from 'path';
import LibrarySystem from './abstract/LibrarySystem.ts';
import storageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';
import { Literatures } from '../types/electron-auxiliar.interfaces.ts';
import { Comic } from '../types/comic.interfaces.ts';

export default class MigrationManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager = storageManager;

  constructor() {
    super();
  }

  /**
   * Padroniza o campo literatureForm para 'Books' em todos os arquivos JSON de livros existentes.
   */
  public async clearBookForm(): Promise<void> {
    try {
      const booksPath = this.booksData;
      if (!(await fse.pathExists(booksPath))) return;

      const files = await fse.readdir(booksPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(booksPath, file);
          const data = await fse.readJson(filePath);
          if (data.literatureForm !== 'Books') {
            data.literatureForm = 'Books';
            await fse.writeJson(filePath, data, { spaces: 2 });
            console.log(
              `[MigrationManager] Padronizado literatureForm para 'Books' em: ${file}`,
            );
          }
        }
      }
    } catch (e) {
      console.error('Erro ao limpar literatureForm dos livros:', e);
    }
  }

  public async fixId(): Promise<boolean> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const rawSeries = await Promise.all(
        dataPaths.map(async (rawData) => {
          const response = await this.storageManager.readSerieData(rawData);

          if (!response) return { id: -1 } as Literatures;

          return response;
        }),
      );

      rawSeries.sort((a, b) => {
        if (a.id == null) return 1;
        if (b.id == null) return -1;
        return a.id - b.id;
      });

      let lastId = -1;
      const usedIds = new Set<number>();

      for (let i = 0; i < rawSeries.length; i++) {
        const item = rawSeries[i];

        const isValidNumber =
          typeof item.id === 'number' &&
          Number.isFinite(item.id) &&
          !usedIds.has(item.id);

        if (isValidNumber) {
          usedIds.add(item.id);
          lastId = Math.max(lastId, item.id);
        } else {
          lastId += 1;
          item.id = lastId;
          usedIds.add(item.id);

          await this.storageManager.writeData(item);
        }
      }

      await this.setSerieId(lastId);
      return true;
    } catch (e) {
      console.error('Falha em organizar os identificadores');
      return false;
    }
  }

  public async fixChildSeriePaths(dataPath: string): Promise<void> {
    const serieData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Comic;
    const childSeries = serieData.childSeries;

    if (!serieData.metadata.compiledComic || !childSeries) {
      return;
    }

    const archivesPath = serieData.archivesPath;

    for (const child of childSeries) {
      const result = await this.fileManager.findPath(
        archivesPath,
        child.serieName,
      );

      if (result) {
        child.archivesPath = result;
      }
    }

    await this.storageManager.writeData(serieData);
  }
}
