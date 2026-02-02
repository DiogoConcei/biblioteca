import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';

import {
  LiteratureChapter,
  Literatures,
  viewData,
} from '../types/electron-auxiliar.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
import { Manga } from '../types/manga.interfaces';
import { SerieData, SerieEditForm } from '../../src/types/series.interfaces';

import fse from 'fs-extra';
import path from 'path';
import { randomBytes } from 'crypto';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { promisify } from 'util';
import { exec } from 'child_process';

export default class StorageManager extends LibrarySystem {
  private readonly SEVEN_ZIP_PATH = 'C:\\Program Files\\7-Zip\\7z';
  private readonly execAsync = promisify(exec);
  private readonly fileManager: FileManager = new FileManager();

  constructor() {
    super();
  }

  public async writeData(serie: Literatures | TieIn): Promise<boolean> {
    try {
      await fse.writeJSON(serie.dataPath, serie, { spaces: 2 });
      return true;
    } catch (e) {
      console.error(`Erro em escrever dados da serie: ${e}`);
      return false;
    }
  }

  // Gambiarra genérica para ler todos os dados (temporária)
  public async readData(dataPath: string): Promise<Literatures | TieIn | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as Literatures;

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (e) {
      console.error(`Erro ao ler dados da série: ${e}`);
      return null;
    }
  }

  public async readSerieData(dataPath: string): Promise<Literatures | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as Literatures;

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (e) {
      console.error(`Erro ao ler dados da série: ${e}`);
      return null;
    }
  }

  public async readTieInData(dataPath: string): Promise<TieIn | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as TieIn;

      if (!serieData) {
        throw new Error('Arquivo lido, mas vazio ou inválido.');
      }

      return serieData;
    } catch (e) {
      console.error(`Erro ao ler dados da série: ${e}`);
      return null;
    }
  }

  public async deleteChapter(chapter: LiteratureChapter): Promise<boolean> {
    try {
      if (await fse.pathExists(chapter.chapterPath)) {
        await fse.remove(chapter.chapterPath);
        chapter.isDownloaded = 'not_downloaded';
        chapter.chapterPath = '';

        return true;
      }

      return false;
    } catch (e) {
      console.error('Falha e deletar capitulos: ', e);
      return false;
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
      console.error('Erro ao selecionar dados do Quadrinho:', e);
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
      console.error('Erro ao selecionar dados da TieIn:', e);
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

  // Refeito durante a reformulação de ComicManager
  public async fixComicDir(
    brokenPath: string,
    correctPath: string,
  ): Promise<string[]> {
    const moved: string[] = [];

    async function walk(dir: string) {
      const entries = await fse.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const src = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(src);
          continue;
        }

        const dest = path.join(correctPath, entry.name);

        if (await fse.pathExists(dest)) {
          await fse.remove(dest);
        }

        await fse.move(src, dest, { overwrite: true });

        if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
          moved.push(dest);
        }
      }
    }

    await walk(brokenPath);
    await fse.remove(brokenPath);

    return moved;
  }

  public async getViewData(): Promise<viewData[] | null> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const viewData: viewData[] = await Promise.all(
        dataPaths.map(async (dataPath) => {
          const serie = await this.readSerieData(dataPath);
          if (!serie) {
            throw new Error(
              `Erro ao trazer dados de visualização: serie invalida`,
            );
          }

          return this.mountViewData(serie);
        }),
      );

      return viewData;
    } catch (e) {
      console.error(`Erro ao trazer dados de visualização:${e}`);
      return null;
    }
  }

  public async processData(seriePath: string): Promise<SerieData> {
    const serieName = path.basename(seriePath);
    const newPath = path.join(this.userLibrary, serieName);

    if (!(await fse.pathExists(seriePath))) {
      throw new Error(`Caminho invalido: ${seriePath} não existe.`);
    }

    return {
      name: serieName,
      sanitizedName: this.fileManager.sanitizeFilename(serieName),
      newPath: newPath,
      oldPath: seriePath,
      createdAt: new Date().toISOString(),
    };
  }

  public async extractCoverFromPdf(
    inputFile: string,
    outputDir: string,
  ): Promise<string> {
    try {
      await fse.ensureDir(outputDir);

      const data = await fse.readFile(inputFile);

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(data),
        // @ts-ignore
        disableWorker: true,
      });

      const pdf = await loadingTask.promise;

      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const suffix = randomBytes(3).toString('hex');
      const finalPath = this.fileManager.buildImagePath(
        outputDir,
        `cover_${suffix}`,
        '.jpg',
      );

      const buffer = canvas.toBuffer('image/jpeg', 0.85);
      await fse.writeFile(finalPath, buffer);

      return finalPath;
    } catch (e) {
      console.error('Falha na conversão de PDF -> Imagem', e);
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

      try {
        await this.execAsync(extractCmd);
      } catch (err: any) {
        if (
          err?.code === 2 &&
          typeof err.stderr === 'string' &&
          err.stderr.includes('CRC Failed')
        ) {
          console.warn(
            '⚠️ Extração concluída com erros de CRC. Alguns arquivos podem estar corrompidos.',
          );
        } else {
          throw err;
        }
      }
    } catch (e) {
      console.error(`Falha em descompactar arquivos: ${e}`);
      throw e;
    }
  }

  public async extractCoverWith7zip(
    inputFile: string,
    outputDir: string,
  ): Promise<string> {
    try {
      await fse.mkdir(outputDir, { recursive: true });

      const { stdout } = await this.execAsync(
        `"${this.SEVEN_ZIP_PATH}" l "${inputFile}"`,
      );

      const filesInArchive = this.parse7zList(stdout);

      if (filesInArchive.length === 0) {
        throw new Error('Arquivo compactado está vazio.');
      }

      const candidateName = this.fileManager.findFirstCoverFile(
        filesInArchive.map((f) => path.basename(f)),
      );

      if (!candidateName) {
        return '';
      }

      const candidatePath = filesInArchive.find(
        (f) => path.basename(f) === candidateName,
      );

      if (!candidatePath) {
        throw new Error(
          'Candidato encontrado, mas path interno não localizado.',
        );
      }

      const normalizedCandidate = path.normalize(candidatePath);

      if (normalizedCandidate.startsWith('..')) {
        throw new Error('Path interno inválido no arquivo compactado.');
      }

      const ext = path.extname(normalizedCandidate);
      const baseName = path.basename(normalizedCandidate, ext);
      const safeBase = baseName.replace(/[. ]+$/, '');
      const suffix = randomBytes(3).toString('hex');

      const finalPath = this.fileManager.buildImagePath(
        outputDir,
        `${safeBase}_${suffix}`,
        ext,
      );

      try {
        await this.execAsync(
          `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" "${normalizedCandidate}" -o"${outputDir}" -y`,
        );
      } catch (err: any) {
        if (
          err?.code !== 2 ||
          typeof err.stderr !== 'string' ||
          !err.stderr.includes('CRC Failed')
        ) {
          throw err;
        }
      }

      const extractedPath = path.join(outputDir, normalizedCandidate);

      await fse.move(extractedPath, finalPath, { overwrite: true });

      const extractedDir = path.dirname(extractedPath);

      if (extractedDir !== outputDir) {
        const remaining = await fse.readdir(extractedDir);
        if (remaining.length === 0) {
          await fse.remove(extractedDir);
        }
      }

      return finalPath;
    } catch (e) {
      console.error('❌ Falha ao extrair capa:', e);
      throw e;
    }
  }

  public async patchSerie(data: SerieEditForm): Promise<Literatures | null> {
    const oldData = await this.readSerieData(data.dataPath);

    if (!oldData) return null;

    const changedFields = Object.fromEntries(
      (Object.keys(data) as (keyof SerieEditForm)[])
        .filter((k) => data[k] !== oldData[k])
        .map((k) => [k, data[k]]),
    ) as Partial<SerieEditForm>;

    const updated: Literatures = {
      ...oldData,
      ...changedFields,
    } as Literatures;

    if (updated.name !== oldData.name) {
      await this.fileManager.moveFiles(oldData, updated);
    }

    return updated;
  }

  public async patchHelper(updatedData: Literatures, newData: SerieEditForm) {
    try {
      const dir = path.dirname(updatedData.dataPath);
      const newPath = path.join(dir, `${newData.name}.json`);
      updatedData.dataPath = newPath;

      if (newData.name !== updatedData.name) {
        await fse.ensureDir(dir);
        await fse.writeJson(newPath, updatedData, { spaces: 2 });
      } else {
        this.writeData(updatedData);
      }
    } catch (e) {
      console.error(`Falha ao finalizar update da série: ${newData.name}`, e);
    }
  }

  public async convertPdf_overdrive(
    inputFile: string,
    outputDir: string,
  ): Promise<void> {
    await fse.ensureDir(outputDir);

    const data = await fse.readFile(inputFile);
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(data),
      // @ts-ignore
      disableWorker: true,
    }).promise;

    const scale = 1;
    const totalPages = pdf.numPages;

    const tasks = Array.from({ length: totalPages }, (_, i) =>
      this.processPdfPage(pdf, i + 1, outputDir, scale),
    );

    await Promise.all(tasks);
  }

  private async processPdfPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    outputDir: string,
    scale: number,
  ): Promise<void> {
    const buffer = await this.renderPdfPageToBuffer(pdf, pageNum, scale);
    const fileName = this.buildPageFileName(pageNum);

    await fse.writeFile(path.join(outputDir, fileName), buffer);
  }

  private async renderPdfPageToBuffer(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
    scale: number,
  ): Promise<Buffer> {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    return canvas.toBuffer('image/jpeg', 0.85);
  }

  private buildPageFileName(pageNum: number): string {
    return `${String(pageNum).padStart(4, '0')}.jpeg`;
  }

  private parse7zList(output: string): string[] {
    const lines = output.split('\n');
    const files: string[] = [];
    let parsing = false;

    for (const line of lines) {
      if (line.startsWith('----')) {
        parsing = !parsing;
        continue;
      }

      if (!parsing) continue;

      const parts = line.trim().split(/\s+/);
      const filePath = parts.slice(5).join(' ');

      if (filePath && !filePath.endsWith('/')) {
        files.push(filePath);
      }
    }

    return files;
  }

  private mountViewData(serie: Literatures): viewData {
    return {
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      chaptersRead: serie.chaptersRead,
      dataPath: serie.dataPath,
      totalChapters: serie.totalChapters,
      literatureForm: serie.literatureForm,
    };
  }
}

// 01 - Mulher-Hulk 15
// Vingadores - Os Maiores Herois da Terra 1 de 8 (BR)
(async () => {
  const inputFile =
    'c:\\Users\\diogo\\Downloads\\Case\\01 - Mulher-Hulk 15.cbr';
  const outputDir = 'C:\\Users\\diogo\\Downloads\\Case';
  const storage = new StorageManager();
  await storage.extractCoverWith7zip(inputFile, outputDir);
})();
