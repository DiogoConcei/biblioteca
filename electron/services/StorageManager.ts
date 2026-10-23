import fse from 'fs-extra';
import path from 'path';

import { SerieData, SerieEditForm } from '../../src/shared/types/series.interfaces';
import { TieIn } from '../types/comic.interfaces';
import { ProcessedUploadResult, ChapterData } from '../types/upload.interfaces';
import {
  graphSerie,
  LiteratureChapter,
  viewData,
  Literatures,
} from '../types/electron-auxiliar.interfaces';
import AtomicJsonStore from '../services/AtomicJsonStore';
import FileManager from './FileManager';
import LibrarySystem from './abstract/LibrarySystem';

export class StorageManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly writer: AtomicJsonStore = new AtomicJsonStore();
  private _seriesCache: Map<string, Literatures | TieIn> = new Map();
  private _viewDataCache: Map<string, viewData> | null = null;
  private static instance: StorageManager;

  constructor() {
    super();
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) StorageManager.instance = new StorageManager();
    return StorageManager.instance;
  }

  async processUpload(paths: string[]): Promise<ProcessedUploadResult> {
    const result: ProcessedUploadResult = {
      series: [],
      chapters: [],
      failed: [],
    };

    const classified = await Promise.all(
      paths.map(async (p) => ({ path: p, kind: await this.fileManager.classifyPath(p) })),
    );

    await Promise.allSettled(
      classified.map(async ({ path: itemPath, kind }) => {
        try {
          switch (kind) {
            case 'serie':
              result.series.push(await this.procesSerieData(itemPath));
              break;
            case 'chapter':
              result.chapters.push(await this.processChapterData(itemPath)); // nova, mais simples que processData
              break;
            case 'invalid':
              result.failed.push({ path: itemPath, reason: 'Caminho não existe.' });
          }
        } catch (err) {
          result.failed.push({ path: itemPath, reason: (err as Error).message });
        }
      }),
    );

    return result;
  }

  async procesSerieData(seriePath: string): Promise<SerieData> {
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

  async processChapterData(chapterPath: string): Promise<ChapterData> {
    const serieName = path.basename(chapterPath);
    const newPath = path.join(this.userLibrary, serieName);

    if (!(await fse.pathExists(chapterPath))) {
      throw new Error(`Caminho invalido: ${chapterPath} não existe.`);
    }

    return {
      name: serieName,
      sanitizedName: this.fileManager.sanitizeFilename(serieName),
      oldPath: chapterPath,
      createdAt: new Date().toISOString(),
    };
  }

  async readSerieData<T extends graphSerie>(dataPath: string): Promise<T | null> {
    if (this._seriesCache.has(dataPath)) {
      return this._seriesCache.get(dataPath) as T;
    }

    try {
      if (!(await fse.pathExists(dataPath))) return null;

      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as T;

      if (serieData) {
        this.updateCache(serieData);
      }

      return serieData;
    } catch (e) {
      console.error(`Falha ao ler dados da serie em ${dataPath}: ${e}`);
      return null;
    }
  }

  async selectSerieData<T extends Literatures | TieIn>(
    serieName: string,
    type?: string,
  ): Promise<T> {
    for (const serie of this._seriesCache.values()) {
      if (serie.name === serieName) return serie as T;
    }

    const viewDataList = await this.getViewData();

    const targetView = viewDataList?.find(
      (view) => view.name === serieName && (!type || view.literatureForm === type),
    );

    if (!targetView) {
      throw new Error(`Série não encontrada no catálogo: ${serieName}`);
    }

    const data = await this.readSerieData<T>(targetView.dataPath);

    if (!data) {
      throw new Error(`Falha ao ler os dados do arquivo da série: ${serieName}`);
    }

    return data;
  }
  async getViewData(): Promise<viewData[] | null> {
    try {
      if (this._viewDataCache !== null) {
        return Array.from(this._viewDataCache.values());
      }

      this._viewDataCache = new Map<string, viewData>();
      const dataPaths = await this.fileManager.getDataPaths();

      for (const dataPath of dataPaths) {
        const serie = await this.readSerieData(dataPath);
        if (serie) {
          const resumo = this.mountViewData(serie);
          this._viewDataCache.set(dataPath, resumo);
        }
      }

      return Array.from(this._viewDataCache.values());
    } catch (e) {
      console.error(`Erro ao trazer dados de visualização: ${e}`);
      return null;
    }
  }

  async writeData(serie: Literatures | TieIn): Promise<boolean> {
    try {
      await this.writer.write(serie.dataPath, serie);

      this.updateCache(serie);

      return true;
    } catch (error) {
      console.error(`Erro em escrever dados da serie (${serie.name}): ${error}`);
      return false;
    }
  }

  private updateCache(serie: graphSerie): void {
    this._seriesCache.set(serie.dataPath, serie as Literatures | TieIn);

    if (this._viewDataCache !== null) {
      const resumo = this.mountViewData(serie);
      this._viewDataCache.set(serie.dataPath, resumo);
    }
  }

  private mountViewData(serie: graphSerie): viewData {
    return {
      id: serie.id,
      name: serie.name,
      description: serie.description,
      coverImage: serie.coverImage,
      chaptersRead: serie.chaptersRead,
      dataPath: serie.dataPath,
      totalChapters: serie.totalChapters,
      literatureForm: serie.literatureForm,
    };
  }
}

export default StorageManager.getInstance();

// async persistSerie(oldData: Literatures, updated: Literatures): Promise<string> {
//     try {
//       const oldPath = oldData.dataPath;
//       const dir = path.dirname(oldPath);
//       const nameChanged = oldData.name !== updated.name;
//       const newPath = nameChanged ? path.join(dir, `${updated.name}.json`) : oldPath;

//       if (nameChanged && oldPath !== newPath) {
//         // Move o arquivo físico no HD (assumo que fileManager.moveFiles faça isso)
//         await this.fileManager.moveFiles(oldData, updated);

//         if (await fse.pathExists(oldPath)) {
//           await fse.remove(oldPath);
//         }

//         // LIMPEZA DO CACHE: Tira o lixo antigo
//         this._seriesCache.delete(oldPath);
//         if (this._viewDataCache !== null) {
//           this._viewDataCache.delete(oldPath);
//         }
//       }

//       updated.dataPath = newPath;

//       // Escreve o arquivo novo
//       await this.writer.write(newPath, updated);

//       // Popula os caches com a chave nova
//       this.updateCache(updated);

//       return newPath;
//     } catch (error) {
//       console.error(`Erro ao persistir a série (${updated.name}):`, error);
//       throw error;
//     }
//   }
