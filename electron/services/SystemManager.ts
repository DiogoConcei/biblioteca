import LibrarySystem from './abstract/LibrarySystem.ts';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';
import fse from 'fs-extra';
import path from 'path';
import {
  AppConfig,
  Literatures,
} from '../types/electron-auxiliar.interfaces.ts';
import { Comic, TieIn } from '../types/comic.interfaces.ts';

export default class SystemManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public async getFullScreenConfig(): Promise<boolean> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      return data.settings.full_screen;
    } catch (error) {
      console.error(`Erro em recuperar configurações: ${error}`);
      throw error;
    }
  }

  public async getThemeConfig(): Promise<boolean> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      return data.settings.ligth_mode;
    } catch (error) {
      console.error(`Erro em recuperar configurações: ${error}`);
      throw error;
    }
  }

  public async switchTheme(colorTheme: boolean): Promise<void> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      data.settings.ligth_mode = !colorTheme;
      await fse.writeFile(this.configFilePath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      console.error(`Erro em atualizar modelo de tela: ${error}`);
      throw error;
    }
  }

  public async setFullScreenConfig(isFullScreen: boolean): Promise<void> {
    try {
      const data: AppConfig = JSON.parse(
        await fse.readFile(this.configFilePath, 'utf-8'),
      );
      data.settings.full_screen = isFullScreen;
      await fse.writeFile(this.configFilePath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      console.error(`Erro em atualizar modelo de tela: ${error}`);
      throw error;
    }
  }

  public async fixId(): Promise<void> {
    const dataPaths = await this.fileManager.getDataPaths();

    const rawSeries = await Promise.all(
      dataPaths.map((rawData) => this.storageManager.readSerieData(rawData)),
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

        await this.storageManager.updateSerieData(item);
      }
    }

    await this.setSerieId(lastId);
  }

  public async fixChildSeriePaths(dataPath: string): Promise<void> {
    const serieData = (await this.storageManager.readSerieData(
      dataPath,
    )) as Comic;
    const childSeries = serieData.childSeries;

    if (!serieData.metadata.compiledComic || !childSeries) {
      console.log('Não é uma série compilada. (não possui Tie-Ins)');
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

    await this.storageManager.updateSerieData(serieData);
  }

  public async fixMangaOrder(serieData: Literatures | TieIn) {
    const entries = await fse.readdir(serieData.archivesPath, {
      withFileTypes: true,
    });

    const comicFiles = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
      .map((e) => path.join(serieData.archivesPath, e.name));

    if (!serieData.chapters) {
      throw new Error(
        'Número de arquivos de quadrinhos é menor que o número de capítulos',
      );
    }

    const orderComics = await this.fileManager.orderManga(comicFiles);

    serieData.chapters = serieData.chapters.map((chap, idx) => {
      const baseName = path.basename(
        orderComics[idx],
        path.extname(orderComics[idx]),
      );
      const archivesPath = orderComics[idx];

      return {
        ...chap,
        name: baseName,
        sanitizedName: this.fileManager.sanitizeFilename(baseName),
        archivesPath,
        chapterPath: path.join(
          this.comicsImages,
          serieData.name,
          this.fileManager.sanitizeFilename(baseName),
        ),
        isDownloaded: 'not_downloaded',
      };
    });

    await this.storageManager.updateSerieData(serieData);
  }

  public async fixComicOrder(serieData: Literatures | TieIn) {
    const entries = await fse.readdir(serieData.archivesPath, {
      withFileTypes: true,
    });

    const comicFiles = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
      .map((e) => path.join(serieData.archivesPath, e.name));

    if (!serieData.chapters) {
      throw new Error(
        'Número de arquivos de quadrinhos é menor que o número de capítulos',
      );
    }

    const orderComics = await this.fileManager.orderComic(comicFiles);

    serieData.chapters = serieData.chapters.map((chap, idx) => {
      const baseName = path.basename(
        orderComics[idx],
        path.extname(orderComics[idx]),
      );
      const archivesPath = orderComics[idx];

      return {
        ...chap,
        name: baseName,
        sanitizedName: this.fileManager.sanitizeFilename(baseName),
        archivesPath,
        chapterPath: path.join(
          this.comicsImages,
          serieData.name,
          this.fileManager.sanitizeFilename(baseName),
        ),
        isDownloaded: 'not_downloaded',
      };
    });

    await this.storageManager.updateSerieData(serieData);
  }
}

// (async () => {
//   const dataPath =
//     'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\json files\\Comics\\07 - Dinastia M - Completa ( + Tie-ins ).json';
//   const st = new StorageManager();
//   const serieD = (await st.readSerieData(dataPath)) as Comic;
//   const sM = new SystemManager();
//   await sM.fixComicOrder(serieD);
// })();
