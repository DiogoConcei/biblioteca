import FileSystem from './abstract/FileSystem';
import FileManager from './FileManager';
import fse from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';

import { Manga } from '../types/manga.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
import { SerieData } from '../../src/types/series.interfaces';
import {
  Literatures,
  LiteratureChapter,
  NormalizedSerieData,
  viewData,
} from '../../src/types/auxiliar.interfaces';

export default class StorageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly SEVEN_ZIP_PATH = 'C:\\Program Files\\7-Zip\\7z';
  private readonly execAsync = promisify(exec);

  constructor() {
    super();
  }

  public async writeSerieData(serie: Literatures | TieIn): Promise<void> {
    try {
      await fse.writeJson(serie.dataPath, serie, { spaces: 2 });
    } catch (e) {
      console.error(`Erro em criar dados da série: ${e}`);
      throw e;
    }
  }

  public async updateSerieData(data: Literatures | TieIn): Promise<void> {
    try {
      await fse.writeJson(data.dataPath, data, { spaces: 2 });
    } catch (error) {
      console.error(
        `Erro ao atualizar arquivo da série "${data.name}":`,
        error,
      );
      throw error;
    }
  }

  public async readSerieData(dataPath: string): Promise<Literatures | TieIn> {
    try {
      const serieData = await fse.readJson(dataPath, {
        encoding: 'utf-8',
      });

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (error) {
      console.error(`[readSerieData] Falha ao ler: ${dataPath}`, error);
      throw error;
    }
  }

  public async preProcessedData(seriePath: string): Promise<SerieData> {
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

  public async seriesData(): Promise<viewData[]> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      return await Promise.all(
        dataPaths.map(async (dataPath) => {
          const serie: Literatures = await fse.readJson(dataPath, {
            encoding: 'utf-8',
          });
          return {
            id: serie.id,
            name: serie.name,
            coverImage: serie.coverImage,
            chaptersRead: serie.chaptersRead,
            dataPath: serie.dataPath,
            totalChapters: serie.totalChapters,
            literatureForm: serie.literatureForm,
          };
        }),
      );
    } catch (e) {
      console.error(`Erro ao ler todo o conteúdo: ${e}`);
      throw e;
    }
  }

  public async selectMangaData(serieName: string): Promise<Manga> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);

      const serieDataPath = seriesData.find((filePath) => {
        return path.parse(filePath).name === serieName;
      });

      if (!serieDataPath) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return fse.readJson(serieDataPath, { encoding: 'utf-8' });
    } catch (e) {
      console.error('Erro ao selecionar dados do Manga:', e);
      throw e;
    }
  }

  public async selectComicData(serieName: string): Promise<Comic> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.comicsData);

      const serieDataPath = seriesData.find((filePath) => {
        return path.parse(filePath).name === serieName;
      });

      if (!serieDataPath) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return fse.readJson(serieDataPath, { encoding: 'utf-8' });
    } catch (e) {
      console.error('Erro ao selecionar dados do Manga:', e);
      throw e;
    }
  }

  public async selectTieInData(serieName: string): Promise<TieIn> {
    try {
      const seriesData = await this.fileManager.foundFiles(
        this.childSeriesData,
      );

      const serieDataPath = seriesData.find((filePath) => {
        return path.parse(filePath).name === serieName;
      });

      if (!serieDataPath) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return fse.readJson(serieDataPath, { encoding: 'utf-8' });
    } catch (e) {
      console.error('Erro ao selecionar dados do Manga:', e);
      throw e;
    }
  }

  public async deleteSerieChapter(
    serieData: Literatures | TieIn,
    chapter: LiteratureChapter,
  ) {
    try {
      await fse.remove(chapter.chapterPath);

      chapter.isDownload = false;
      chapter.chapterPath = '';

      await this.updateSerieData(serieData);
    } catch (e) {
      console.error('Falha em deletar capítulos', e);
      throw e;
    }
  }

  public async extractCoverWith7zip(inputFile: string, outputDir: string) {
    try {
      const tempDir = path.join(
        path.dirname(outputDir),
        `temp_${randomUUID()}`,
      );

      await fse.mkdir(tempDir, { recursive: true });

      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${tempDir}" -y`;
      await this.execAsync(extractCmd);

      const allFiles = await this.fileManager.getAllFilesRecursively(tempDir);

      if (allFiles.length === 0) {
        throw new Error(
          '❌ Extração concluída, mas nenhum arquivo foi gerado.',
        );
      }

      const bestCandidate = this.fileManager.findFirstCoverFile(
        allFiles.map((f) => path.basename(f)),
      );

      if (!bestCandidate) {
        throw new Error('❌ Nenhuma imagem de capa válida encontrada.');
      }

      const realPath = allFiles.find(
        (p) => path.basename(p) === bestCandidate,
      )!;
      const finalName = this.fileManager.sanitizeFilename(bestCandidate);
      const finalPath = path.join(outputDir, finalName);

      await fse.mkdir(outputDir, { recursive: true });
      await fse.move(realPath, finalPath);
      await fse.remove(tempDir);
    } catch (e) {
      console.error(`❌ Falha em descompactar cover:`, e);
      throw e;
    }
  }

  public async extractWith7zip(
    inputFile: string,
    outputDir: string,
  ): Promise<void> {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${outputDir}" -y`;
      await this.execAsync(extractCmd);
    } catch (e) {
      console.error(`Falha em descompactar arquivos: ${e}`);
      throw e;
    }
  }
}
