import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';

import {
  APIResponse,
  LiteratureChapter,
  Literatures,
  viewData,
} from '../types/electron-auxiliar.interfaces';
import { Comic, TieIn } from '../types/comic.interfaces';
import { Manga } from '../types/manga.interfaces';
import fse from 'fs-extra';
import path from 'path';
import { SerieData } from '../../src/types/series.interfaces';

export default class StorageManager extends LibrarySystem {
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

// export default class StorageManager extends FileSystem {
//   private readonly fileManager: FileManager = new FileManager();
//   private readonly SEVEN_ZIP_PATH = 'C:\\Program Files\\7-Zip\\7z';
//   private readonly execAsync = promisify(exec);

//   public async patchSerie(data: SerieEditForm): Promise<Literatures[]> {
//     const oldData = (await this.readSerieData(data.dataPath)) as Literatures;

//     const id = oldData.id;
//     const updated: Literatures = { ...data, id };
//     updated.id = id;
//     const isBase64 = updated.coverImage.startsWith('data:image/');

//     if (isBase64) {
//       updated.coverImage = oldData.coverImage;
//     }

//     const rootPath = path.join(
//       this.imagesFolder,
//       data.literatureForm,
//       data.name,
//     );

//     if (updated.name !== oldData.name) {
//       await fse.move(oldData.chaptersPath, rootPath);

//       oldData.chapters = updated.chapters;

//       for (let idx = 0; idx < oldData.chapters.length; idx++) {
//         oldData.chapters[idx].id = idx;

//         const newChapterRoot = path.join(rootPath, oldData.chapters[idx].name);
//         const oldChapterPath = oldData.chapters[idx].chapterPath;

//         updated.chapters[idx].chapterPath = path.join(
//           rootPath,
//           oldData.chapters[idx].name,
//         );

//         if (await fse.pathExists(oldChapterPath)) {
//           await fse.move(oldChapterPath, newChapterRoot);
//         }
//       }
//     }

//     updated.totalChapters = updated.chapters.length;

//     return [oldData, updated];
//   }

//   public async extractCoverFromPdf(
//     inputFile: string,
//     outputDir: string,
//   ): Promise<string> {
//     try {
//       const data = await fse.readFile(inputFile);

//       const loadingTask = pdfjsLib.getDocument({
//         data: new Uint8Array(data),
//       });

//       const pdf = await loadingTask.promise;
//       const page = await pdf.getPage(1);

//       const scale = 2;
//       const viewport = page.getViewport({ scale });

//       const canvas = createCanvas(viewport.width, viewport.height);
//       const context = canvas.getContext('2d');

//       await page.render({
//         canvas: canvas as unknown as HTMLCanvasElement,
//         canvasContext: context as unknown as CanvasRenderingContext2D,
//         viewport,
//       }).promise;

//       // ✅ TEMP REALMENTE SEGURO
//       const tempDir = path.join(os.tmpdir(), `pdf_${randomUUID().slice(0, 8)}`);
//       await fse.ensureDir(tempDir);

//       const buffer = canvas.toBuffer('image/jpeg');
//       const tempFilePath = path.join(tempDir, 'cover.jpg');

//       await fse.writeFile(tempFilePath, buffer);

//       // 🔒 destino final
//       const suffix = randomBytes(3).toString('hex');
//       const finalPath = this.fileManager.buildImagePath(
//         outputDir,
//         `cover_${suffix}`,
//         '.jpg',
//       );

//       await fse.ensureDir(path.dirname(finalPath));
//       await fse.move(tempFilePath, finalPath, { overwrite: true });

//       await fse.remove(tempDir);
//       return finalPath;
//     } catch (e) {
//       console.error('Falha na conversão de PDF -> Imagem', e);
//       throw e;
//     }
//   }
//   public async convertPdf_overdrive(inputFile: string, outputDir: string) {
//     await fse.ensureDir(outputDir);

//     const data = await fse.readFile(inputFile);
//     const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) })
//       .promise;

//     const totalPages = pdf.numPages;
//     const scale = 1;

//     const tasks: Promise<void>[] = [];

//     for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
//       tasks.push(
//         (async () => {
//           const page = await pdf.getPage(pageNum);
//           const viewport = page.getViewport({ scale });

//           const canvas = createCanvas(viewport.width, viewport.height);
//           const context = canvas.getContext('2d');

//           await page.render({
//             canvas: canvas as unknown as HTMLCanvasElement,
//             canvasContext: context as unknown as CanvasRenderingContext2D,
//             viewport,
//           }).promise;

//           const buffer = canvas.toBuffer('image/jpeg');
//           const fileName = `${String(pageNum).padStart(4, '0')}.jpeg`;

//           await fse.writeFile(path.join(outputDir, fileName), buffer);
//         })(),
//       );
//     }

//     await Promise.all(tasks);
//   }

//   public async extractCoverWith7zip(inputFile: string, outputDir: string) {
//     console.log(`📂 Iniciando extração da capa`);
//     console.log(`   Arquivo de entrada: ${inputFile}`);
//     console.log(`   Diretório de saída: ${path.resolve(outputDir)}`);

//     try {
//       const tempDir = path.join(
//         path.dirname(outputDir),
//         `temp_${randomUUID()}`,
//       );
//       console.log(`📁 Criado diretório temporário: ${tempDir}`);

//       await fse.mkdir(tempDir, { recursive: true });

//       const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${tempDir}" -y`;
//       console.log(`⚡ Executando comando: ${extractCmd}`);

//       try {
//         await this.execAsync(extractCmd);
//       } catch (err: any) {
//         // ✅ Aceita erro de CRC como WARNING
//         if (
//           err?.code === 2 &&
//           typeof err.stderr === 'string' &&
//           err.stderr.includes('CRC Failed')
//         ) {
//           console.warn(
//             '⚠️ Aviso: CBZ contém arquivos corrompidos (CRC Failed). Continuando com arquivos extraídos...',
//           );
//         } else {
//           throw err; // ❌ erro real → explode
//         }
//       }

//       let allFiles = await this.fileManager.getAllFiles(tempDir);
//       console.log(`🔎 Total de arquivos extraídos: ${allFiles.length}`);

//       if (allFiles.length === 0) {
//         throw new Error(
//           '❌ Extração concluída, mas nenhum arquivo foi gerado.',
//         );
//       }

//       // 🔐 PASSO CRÍTICO: encurtar paths extraídos ANTES de usar
//       const safeFiles: string[] = [];

//       for (const filePath of allFiles) {
//         const safePath = await this.fileManager.ensurSourcePath(filePath);
//         safeFiles.push(safePath);
//       }

//       const bestCandidate = this.fileManager.findFirstCoverFile(
//         safeFiles.map((f) => path.basename(f)),
//       );

//       if (!bestCandidate) {
//         console.log(
//           `🚨 Nenhum candidato válido encontrado para: ${path.basename(inputFile)}`,
//         );
//         return '';
//       }

//       const realPath = safeFiles.find(
//         (p) => path.basename(p) === bestCandidate,
//       )!;

//       const ext = path.extname(bestCandidate);
//       const baseName = path.basename(
//         bestCandidate,
//         path.extname(bestCandidate),
//       );
//       const suffix = randomBytes(3).toString('hex');
//       const safeName = baseName.replace(/[. ]+$/, '').concat(`_${suffix}`);

//       const finalPath = this.fileManager.buildImagePath(
//         outputDir,
//         safeName,
//         ext,
//       );

//       console.log(`✅ Candidato escolhido: ${bestCandidate}`);
//       console.log(`➡️ Origem: ${realPath}`);
//       console.log(`➡️ Destino: ${finalPath}`);

//       await fse.move(realPath, finalPath, { overwrite: true });

//       await fse.remove(tempDir);
//       console.log(`🧹 Diretório temporário removido: ${tempDir}`);
//       console.log(`🎉 Extração concluída com sucesso!`);
//       return finalPath;
//     } catch (e) {
//       console.error(`❌ Falha em descompactar cover:`, e);
//       throw e;
//     }
//   }

//   public async extractWith7zip(
//     inputFile: string,
//     outputDir: string,
//   ): Promise<void> {
//     try {
//       await fse.mkdir(outputDir, { recursive: true });
//       const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${outputDir}" -y`;

//       try {
//         await this.execAsync(extractCmd);
//       } catch (err: any) {
//         if (
//           err?.code === 2 &&
//           typeof err.stderr === 'string' &&
//           err.stderr.includes('CRC Failed')
//         ) {
//           console.warn(
//             '⚠️ Extração concluída com erros de CRC. Alguns arquivos podem estar corrompidos.',
//           );
//         } else {
//           throw err;
//         }
//       }
//     } catch (e) {
//       console.error(`Falha em descompactar arquivos: ${e}`);
//       throw e;
//     }
//   }

//   public async patchHelper(updatedData: Literatures, newData: SerieEditForm) {
//     try {
//       const dir = path.dirname(updatedData.dataPath);

//       const newPath = path.join(dir, `${newData.name}.json`);

//       updatedData.dataPath = newPath;

//       if (newData.name !== updatedData.name) {
//         await fse.writeJson(newPath, updatedData, { spaces: 2 });
//         await fse.move(newPath, updatedData.dataPath, { overwrite: true });
//       } else {
//         this.updateSerieData(updatedData);
//       }
//     } catch (e) {
//       console.error(`Falha ao finalizar update da serie: ${newData.name}`);
//     }
//   }
// }
