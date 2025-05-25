import FileSystem from './abstract/FileSystem.ts';
import FileManager from './FileManager.ts';
import path from 'path';

import {
  Literatures,
  NormalizedSerieData,
  SerieData,
  viewData,
} from '../../src/types/series.interfaces.ts';

import fse from 'fs-extra'; // Substituição do jsonfile
// import { Manga, MangaChapter } from '../types/manga.interfaces';
// import { Comic } from '../types/comic.interfaces';
// import { Book } from '../types/book.interfaces';
import { promisify } from 'util';
import { exec } from 'child_process';

export default class StorageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly SEVEN_ZIP_PATH = 'C:\\Program Files\\7-Zip\\7z';
  private readonly execAsync = promisify(exec);

  constructor() {
    super();
  }

  public async writeSerieData(serie: Literatures): Promise<void> {
    try {
      await fse.writeJson(serie.dataPath, serie, { spaces: 2 });
    } catch (e) {
      console.error(`Erro em criar dados da série: ${e}`);
      throw e;
    }
  }

  public async updateSerieData(data: Literatures): Promise<void> {
    try {
      await fse.writeJson(data.dataPath, data, { spaces: 2 });
    } catch (error) {
      console.error(`Erro ao atualizar arquivo da série "${data.name}":`, error);
      throw error;
    }
  }

  public async readSerieData(dataPath: string): Promise<Literatures> {
    try {
      const serieData = await fse.readJson(dataPath, { encoding: 'utf-8' });

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (error) {
      console.error(`[readSerieData] Falha ao ler: ${dataPath}`, error);
      throw error;
    }
  }

  public async preProcessData(seriePath: string): Promise<SerieData> {
    const serieName = path.basename(seriePath);
    const newPath = path.join(this.userLibrary, serieName);

    if (!(await fse.pathExists(seriePath))) {
      throw new Error(`Caminho invá­lido: ${seriePath} não existe.`);
    }

    return {
      name: serieName,
      sanitizedName: this.fileManager.sanitizeFilename(serieName),
      newPath: newPath,
      oldPath: seriePath,
      chaptersPath: '',
      createdAt: new Date().toISOString(),
      collections: [],
      deletedAt: '',
    };
  }

  public createNormalizedData(serie: Literatures): NormalizedSerieData {
    return {
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      archivesPath: serie.archivesPath,
      chaptersPath: serie.chaptersPath,
      isFavorite: false,
      totalChapters: serie.totalChapters,
      status: serie.metadata.status,
      collections: serie.metadata.collections,
      recommendedBy: serie.metadata.recommendedBy,
      originalOwner: serie.metadata.originalOwner,
      rating: serie.metadata.rating,
    };
  }

  public async fixComicDir(brokenPath: string, correctPath: string): Promise<void> {
    try {
      const entries = await fse.readdir(brokenPath, { withFileTypes: true });

      for (const entry of entries) {
        const src = path.join(brokenPath, entry.name);
        const dest = path.join(correctPath, entry.name);

        if (await fse.pathExists(dest)) {
          await fse.remove(dest);
        }

        await fse.move(src, dest, { overwrite: true });
      }

      await fse.remove(brokenPath);
    } catch (error) {
      console.error(`[fixComicDir] Falha ao corrigir "${brokenPath}" → "${correctPath}"`, error);
      throw error;
    }
  }

  public async extractWith7zip(inputFile: string, outputDir: string): Promise<void> {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${outputDir}" -y`;
      await this.execAsync(extractCmd);
    } catch (e) {
      console.error(`Falha em descompactar arquivos: ${e}`);
      throw e;
    }
  }

  public async extractCoverWith7zip(inputFile: string, outputDir: string) {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const listZip = `"${this.SEVEN_ZIP_PATH}" l "${inputFile}"`;
      const log = await this.execAsync(listZip);
      const filePath = this.fileManager.purifyOutput(log.stdout);

      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" "${filePath}" -o"${outputDir}" -y`;
      await this.execAsync(extractCmd);
    } catch (e) {
      console.error(`Falha em descompactar cover: ${e}`);
      throw e;
    }
  }

  public async seriesData(): Promise<viewData[]> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const seriesData: Literatures[] = await Promise.all(
        dataPaths.map(async dataPath => {
          return await fse.readJson(dataPath, { encoding: 'utf-8' });
        }),
      );

      const exhibData = seriesData.map(serie => ({
        id: serie.id,
        name: serie.name,
        coverImage: serie.coverImage,
        chaptersRead: serie.chaptersRead,
        dataPath: serie.dataPath,
        totalChapters: serie.totalChapters,
        literatureForm: serie.literatureForm,
      }));

      return exhibData;
    } catch (e) {
      console.error(`Erro ao ler todo o conteúdo: ${e}`);
      throw e;
    }
  }
}
