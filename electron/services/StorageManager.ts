import FileSystem from './abstract/FileSystem';
import FileManager from './FileManager';
import fse from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { randomUUID, randomBytes } from 'crypto';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { Manga } from '../types/manga.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
import { SerieData, SerieEditForm } from '../../src/types/series.interfaces';
import {
  Literatures,
  LiteratureChapter,
  NormalizedSerieData,
  viewData,
  APIResponse,
} from '../../src/types/auxiliar.interfaces';
// import { fileURLToPath, pathToFileURL } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
//   path.join(__dirname, 'pdf.worker.mjs'),
// ).href;

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
    } catch (e) {
      throw e;
    }
  }

  public async patchSerie(data: SerieEditForm): Promise<Literatures[]> {
    const oldData = (await this.readSerieData(data.dataPath)) as Literatures;

    const id = oldData.id;
    const updated: Literatures = { ...data, id };
    updated.id = id;
    const isBase64 = updated.coverImage.startsWith('data:image/');

    if (isBase64) {
      updated.coverImage = oldData.coverImage;
    }

    const rootPath = path.join(
      this.imagesFolder,
      data.literatureForm,
      data.name,
    );

    if (updated.name !== oldData.name) {
      await fse.move(oldData.chaptersPath, rootPath);

      oldData.chapters = updated.chapters;

      for (let idx = 0; idx < oldData.chapters.length; idx++) {
        oldData.chapters[idx].id = idx;

        const newChapterRoot = path.join(rootPath, oldData.chapters[idx].name);
        const oldChapterPath = oldData.chapters[idx].chapterPath;

        updated.chapters[idx].chapterPath = path.join(
          rootPath,
          oldData.chapters[idx].name,
        );

        if (await fse.pathExists(oldChapterPath)) {
          await fse.move(oldChapterPath, newChapterRoot);
        }
      }
    }

    updated.totalChapters = updated.chapters.length;

    return [oldData, updated];
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

  public async deleteSerieChapter(
    serieData: Literatures | TieIn,
    chapter: LiteratureChapter,
  ) {
    try {
      if (chapter.chapterPath && (await fse.pathExists(chapter.chapterPath))) {
        await fse.remove(chapter.chapterPath);
        chapter.isDownloaded = 'not_downloaded';
        chapter.chapterPath = '';
        await this.updateSerieData(serieData);
      }
    } catch (e) {
      console.error('Falha em deletar capítulos', e);
      throw e;
    }
  }

  public async extractCoverFromPdf(
    inputFile: string,
    outputDir: string,
  ): Promise<string> {
    try {
      const data = await fse.readFile(inputFile);
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(data),
      });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const scale = 2;

      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const tempDir = path.join(
        path.dirname(outputDir),
        `temp_${randomUUID()}`,
      );
      await fse.mkdir(tempDir, { recursive: true });
      const buffer = canvas.toBuffer('image/jpeg');

      const fileName = 'cover.jpeg';
      const tempFilePath = path.join(tempDir, fileName);

      await fse.writeFile(tempFilePath, buffer);
      const safePath =
        await this.fileManager.ensureSafeSourcePath(tempFilePath);

      const name = path.basename(tempFilePath, path.extname(tempFilePath));
      const suffix = randomBytes(3).toString('hex');
      const safeName = name.replace(/[. ]+$/, '').concat(`_${suffix}`);
      const ext = path.extname(tempFilePath);

      const finalPath = this.fileManager.buildSafeImagePath(
        outputDir,
        safeName,
        ext,
      );

      await fse.move(safePath, finalPath, { overwrite: true });

      await fse.remove(tempDir);
      return finalPath;
    } catch (e) {
      console.error('Falha na conversão de PDF -> Imagem');
      throw new Error(String(e));
    }
  }

  public async convertPdf_overdrive(inputFile: string, outputDir: string) {
    await fse.ensureDir(outputDir);

    const data = await fse.readFile(inputFile);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) })
      .promise;

    const totalPages = pdf.numPages;
    const scale = 1;

    const tasks: Promise<void>[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      tasks.push(
        (async () => {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext('2d');

          await page.render({
            canvas: canvas as unknown as HTMLCanvasElement,
            canvasContext: context as unknown as CanvasRenderingContext2D,
            viewport,
          }).promise;

          const buffer = canvas.toBuffer('image/jpeg');
          const fileName = `${String(pageNum).padStart(4, '0')}.jpeg`;

          await fse.writeFile(path.join(outputDir, fileName), buffer);
        })(),
      );
    }

    await Promise.all(tasks);
  }

  public async extractCoverWith7zip(inputFile: string, outputDir: string) {
    console.log(`📂 Iniciando extração da capa`);
    console.log(`   Arquivo de entrada: ${inputFile}`);
    console.log(`   Diretório de saída: ${path.resolve(outputDir)}`);

    try {
      const tempDir = path.join(
        path.dirname(outputDir),
        `temp_${randomUUID()}`,
      );
      console.log(`📁 Criado diretório temporário: ${tempDir}`);

      await fse.mkdir(tempDir, { recursive: true });

      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${tempDir}" -y`;
      console.log(`⚡ Executando comando: ${extractCmd}`);

      try {
        await this.execAsync(extractCmd);
      } catch (err: any) {
        // ✅ Aceita erro de CRC como WARNING
        if (
          err?.code === 2 &&
          typeof err.stderr === 'string' &&
          err.stderr.includes('CRC Failed')
        ) {
          console.warn(
            '⚠️ Aviso: CBZ contém arquivos corrompidos (CRC Failed). Continuando com arquivos extraídos...',
          );
        } else {
          throw err; // ❌ erro real → explode
        }
      }

      let allFiles = await this.fileManager.getAllFilesRecursively(tempDir);
      console.log(`🔎 Total de arquivos extraídos: ${allFiles.length}`);

      if (allFiles.length === 0) {
        throw new Error(
          '❌ Extração concluída, mas nenhum arquivo foi gerado.',
        );
      }

      // 🔐 PASSO CRÍTICO: encurtar paths extraídos ANTES de usar
      const safeFiles: string[] = [];

      for (const filePath of allFiles) {
        const safePath = await this.fileManager.ensureSafeSourcePath(filePath);
        safeFiles.push(safePath);
      }

      const bestCandidate = this.fileManager.findFirstCoverFile(
        safeFiles.map((f) => path.basename(f)),
      );

      if (!bestCandidate) {
        console.log(
          `🚨 Nenhum candidato válido encontrado para: ${path.basename(inputFile)}`,
        );
        return '';
      }

      const realPath = safeFiles.find(
        (p) => path.basename(p) === bestCandidate,
      )!;

      const ext = path.extname(bestCandidate);
      const baseName = path.basename(
        bestCandidate,
        path.extname(bestCandidate),
      );
      const suffix = randomBytes(3).toString('hex');
      const safeName = baseName.replace(/[. ]+$/, '').concat(`_${suffix}`);

      const finalPath = this.fileManager.buildSafeImagePath(
        outputDir,
        safeName,
        ext,
      );

      console.log(`✅ Candidato escolhido: ${bestCandidate}`);
      console.log(`➡️ Origem: ${realPath}`);
      console.log(`➡️ Destino: ${finalPath}`);

      await fse.move(realPath, finalPath, { overwrite: true });

      await fse.remove(tempDir);
      console.log(`🧹 Diretório temporário removido: ${tempDir}`);
      console.log(`🎉 Extração concluída com sucesso!`);
      return finalPath;
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
        `[fixComicDir] Falha ao corrigir "${brokenPath}" → "${correctPath}"`,
        error,
      );
      throw error;
    }
  }

  public async getSerieData(
    serieName: string,
  ): Promise<APIResponse<Literatures | TieIn>> {
    try {
      const allDataPaths = await this.fileManager.getDataPaths();
      const serie = allDataPaths.find(
        (pValue) => serieName === path.basename(pValue, path.extname(pValue)),
      );

      if (!serie) {
        return { success: false, error: 'Série não encontrada' };
      }

      const serieData = await this.readSerieData(serie);

      if (!serieData) {
        return {
          success: false,
          data: undefined,
          error: 'Falha ao ler dados da série',
        };
      }

      return { success: true, data: serieData };
    } catch (e) {
      console.error('Erro ao obter dados da série:', e);
      return { success: false, error: 'Erro ao obter dados da série' };
    }
  }

  public async patchHelper(updatedData: Literatures, newData: SerieEditForm) {
    try {
      const dir = path.dirname(updatedData.dataPath);

      const newPath = path.join(dir, `${newData.name}.json`);

      updatedData.dataPath = newPath;

      if (newData.name !== updatedData.name) {
        await fse.writeJson(newPath, updatedData, { spaces: 2 });
        await fse.move(newPath, updatedData.dataPath, { overwrite: true });
      } else {
        this.updateSerieData(updatedData);
      }
    } catch (e) {
      console.error(`Falha ao finalizar update da serie: ${newData.name}`);
    }
  }
}

// (async () => {
//   const storageManager = new StorageManager();
//   const serieData = (await storageManager.readSerieData(
//     'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\json files\\Mangas\\Dr. Stone.json',
//   )) as Manga;

//   const testData: SerieEditForm = {
//     name: 'Doutor Stone',
//     sanitizedName: serieData.sanitizedName,
//     genre: serieData.genre,
//     author: serieData.author,
//     language: serieData.language,
//     coverImage: serieData.coverImage,
//     archivesPath: serieData.archivesPath,
//     chaptersPath: serieData.chaptersPath,
//     dataPath: serieData.dataPath,
//     chapters: serieData.chapters,
//     totalChapters: serieData.totalChapters,
//     chaptersRead: serieData.chaptersRead,
//     literatureForm: serieData.literatureForm,
//     readingData: {
//       lastChapterId: serieData.readingData.lastChapterId,
//       lastReadAt: serieData.readingData.lastReadAt,
//     },
//     metadata: {
//       status: serieData.metadata.status,
//       collections: serieData.metadata.collections,
//       recommendedBy: serieData.metadata.recommendedBy,
//       originalOwner: serieData.metadata.originalOwner,
//       lastDownload: serieData.metadata.lastDownload,
//       privacy: serieData.metadata.privacy,
//       rating: serieData.metadata.rating,
//       isFavorite: serieData.metadata.isFavorite,
//       autoBackup: serieData.metadata.autoBackup,
//     },
//     comments: serieData.comments,
//     tags: serieData.tags,
//     deletedAt: serieData.deletedAt,
//     createdAt: serieData.createdAt,
//   };

//   await storageManager.patchSerie(testData);
// })();
