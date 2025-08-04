import path from 'path';
import fse from 'fs-extra';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Comic } from '../types/comic.interfaces';
import { Manga } from '../types/manga.interfaces';
import {
  Literatures,
  LiteratureChapter,
  NormalizedSerieData,
  SerieData,
  viewData,
} from '../../src/types/series.interfaces';
import FileManager from './FileManager';
import FileSystem from './abstract/FileSystem';
import { randomUUID } from 'crypto';

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
      console.error(
        `Erro ao atualizar arquivo da série "${data.name}":`,
        error,
      );
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

  public async fixComicDir(
    brokenPath: string,
    correctPath: string,
  ): Promise<void> {
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
      console.error(
        `[fixComicDir] Falha ao corrigir "${brokenPath}" → "${correctPath}"`,
        error,
      );
      throw error;
    }
  }

  public async seriesData(): Promise<viewData[]> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const seriesData: Literatures[] = await Promise.all(
        dataPaths.map(async (dataPath) => {
          return await fse.readJson(dataPath, { encoding: 'utf-8' });
        }),
      );

      const exhibData = seriesData.map((serie) => ({
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

  public async selectMangaData(serieName: string): Promise<Manga> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);

      const serieData = seriesData.find(
        (serie) => path.basename(serie, path.extname(serie)) === serieName,
      );

      if (!serieData) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return await fse.readJson(serieData, { encoding: 'utf-8' });
    } catch (e) {
      console.error('Erro ao selecionar dados do Manga:', e);
      throw e;
    }
  }

  public async deleteSerieChapter(
    serieData: Literatures,
    chapter: LiteratureChapter,
    literatureForm: string,
  ) {
    try {
      if (literatureForm === 'Mangas') {
        await fse.remove(chapter.chapterPath);
      } else if (literatureForm === 'Comics') {
        const pages = await fse.readdir(chapter.chapterPath, {
          withFileTypes: true,
        });
        const pagePaths = pages.map((page) =>
          path.join(chapter.chapterPath, page.name),
        );
        await Promise.all(pagePaths.map((filePath) => fse.remove(filePath)));
      }

      chapter.isDownload = false;
      chapter.chapterPath = '';
      await this.updateSerieData(serieData);
    } catch (e) {
      console.error('Falha em deletar capítulos', e);
      throw e;
    }
  }

  public async selectComicData(serieName: string): Promise<Comic> {
    try {
      let seriesData = await this.fileManager.foundFiles(this.comicsData);
      let seriePath = seriesData.find(
        (serie) => path.basename(serie, path.extname(serie)) === serieName,
      );

      if (!seriePath) {
        const childSeriesData = await this.fileManager.foundFiles(
          this.childSeriesData,
        );
        seriePath = childSeriesData.find(
          (serie) => path.basename(serie, path.extname(serie)) === serieName,
        );
      }

      if (!seriePath) {
        throw new Error(
          `Série "${serieName}" não encontrada em nenhuma fonte.`,
        );
      }

      return await fse.readJson(seriePath, { encoding: 'utf-8' });
    } catch (e) {
      console.error(`Erro ao selecionar dados do Comic "${serieName}":`, e);
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

      console.log(`✅ Capa extraída: ${finalName}`);
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
