import fse from 'fs-extra';
import path from 'path';

import { SerieData, SerieEditForm } from '../../src/types/series.interfaces';
import { TieIn } from '../types/comic.interfaces';
import {
  graphSerie,
  LiteratureChapter,
  // Literatures,
  viewData,
  Literatures,
} from '../types/electron-auxiliar.interfaces';
import FileManager from './FileManager';
import LibrarySystem from './abstract/LibrarySystem';

export default class StorageManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private _viewDataCache: viewData[] | null = null;

  invalidateCache(): void {
    this._viewDataCache = null;
  }

  constructor() {
    super();
  }

  async writeData(serie: Literatures | TieIn): Promise<boolean> {
    try {
      this.invalidateCache();
      await fse.writeJSON(serie.dataPath, serie, { spaces: 2 });
      return true;
    } catch (e) {
      console.error(`Erro em escrever dados da serie: ${e}`);
      return false;
    }
  }

  async searchSerieById(serieId: number): Promise<Literatures | TieIn | null> {
    const viewData = await this.getViewData();

    if (viewData) {
      const targetSerie = viewData.find((serie) => serie.id === serieId);
      if (targetSerie) {
        return await this.readSerieData(targetSerie.dataPath);
      }
    }

    const dataPaths = await this.fileManager.getDataPaths();

    for (const dataPath of dataPaths) {
      const serieData = await this.readSerieData(dataPath);

      if (!serieData || serieData.id !== serieId) {
        continue;
      }

      return serieData;
    }

    return null;
  }

  async readSerieData<T extends graphSerie>(
    dataPath: string,
  ): Promise<T | null> {
    try {
      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as T;

      if (serieData === null) {
        return null;
      }

      return serieData;
    } catch (e) {
      throw new Error(`Falha ao ler dados da serie selecionada: ${e}`);
    }
  }

  async readTieInData(dataPath: string): Promise<TieIn | null> {
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

  async deleteChapter(chapter: LiteratureChapter): Promise<boolean> {
    try {
      this.invalidateCache();
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

  async selectSerieData<T extends Literatures | TieIn>(
    serieName: string,
    type?: 'Manga' | 'Quadrinho' | 'childSeries',
  ): Promise<T> {
    try {
      let targetFolder: string;

      if (type) {
        switch (type) {
          case 'Manga':
            targetFolder = this.mangasData;
            break;
          case 'Quadrinho':
            targetFolder = this.comicsData;
            break;
          case 'childSeries':
            targetFolder = this.childSeriesData;
            break;
          default:
            targetFolder = this.mangasData;
        }
      } else {
        // Se o tipo não for passado, tenta encontrar em todas as pastas
        const allFolders = [
          this.mangasData,
          this.comicsData,
          this.childSeriesData,
        ];
        for (const folder of allFolders) {
          const files = await this.fileManager.foundFiles(folder);
          const found = files.find((f) => path.parse(f).name === serieName);
          if (found) {
            return await fse.readJson(found, { encoding: 'utf-8' });
          }
        }
        throw new Error(`Série não encontrada: ${serieName}`);
      }

      const seriesData = await this.fileManager.foundFiles(targetFolder);
      const serieDataPath = seriesData.find(
        (filePath) => path.parse(filePath).name === serieName,
      );

      if (!serieDataPath) {
        throw new Error(
          `Nenhuma série encontrada com o nome: ${serieName} em ${type}`,
        );
      }

      return await fse.readJson(serieDataPath, { encoding: 'utf-8' });
    } catch (e) {
      console.error(`Erro ao selecionar dados da série (${serieName}):`, e);
      throw e;
    }
  }

  // Refeito durante a reformulação de ComicManager

  async getViewData(): Promise<viewData[] | null> {
    try {
      if (this._viewDataCache) {
        return this._viewDataCache;
      }

      const dataPaths = await this.fileManager.getDataPaths();

      const viewData: viewData[] = await Promise.all(
        dataPaths.map(async (dataPath) => {
          const serie = await this.readSerieData(dataPath);
          if (!serie) {
            throw new Error(
              `Erro ao trazer dados de visualização: serie invalida`,
            );
          }

          return await this.mountViewData(serie);
        }),
      );

      this._viewDataCache = viewData;
      return viewData;
    } catch (e) {
      console.error(`Erro ao trazer dados de visualização:${e}`);
      return null;
    }
  }

  async processData(seriePath: string): Promise<SerieData> {
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

  async patchSerie(data: SerieEditForm): Promise<Literatures | null> {
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

  async patchHelper(
    oldData: Literatures,
    updatedData: Literatures,
  ): Promise<void> {
    try {
      const dir = path.dirname(oldData.dataPath);
      const newPath = path.join(dir, `${updatedData.name}.json`);

      const nameChanged = oldData.name !== updatedData.name;

      if (nameChanged) {
        await fse.ensureDir(dir);

        if (await fse.pathExists(oldData.dataPath)) {
          await fse.remove(oldData.dataPath);
        }

        updatedData.dataPath = newPath;

        await fse.writeJson(newPath, updatedData, { spaces: 2 });
      } else {
        await fse.writeJson(oldData.dataPath, updatedData, { spaces: 2 });
      }
    } catch (e) {
      console.error(
        `Falha ao finalizar update da série: ${updatedData.name}`,
        e,
      );
      throw e;
    }
  }

  buildUpdatedSerie(
    oldData: Literatures,
    newData: SerieEditForm,
  ): { hasChanges: boolean; data: Literatures } {
    // any justificado: acesso dinâmico por chave não é inferível pelo TS
    const updated: any = { ...oldData };
    let hasChanges = false;

    for (const key of Object.keys(newData)) {
      const newValue = (newData as any)[key];
      const oldValue = (oldData as any)[key];

      if (!this.deepEqual(oldValue, newValue)) {
        updated[key] = newValue;
        hasChanges = true;
      }
    }

    return { hasChanges, data: updated };
  }

  // any justificado: comparação de valores arbitrários
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return a === b;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;

      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }

      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  async persistSerie(
    oldData: Literatures,
    updated: Literatures,
  ): Promise<string> {
    this.invalidateCache();
    const oldPath = oldData.dataPath;
    const dir = path.dirname(oldPath);

    const nameChanged = oldData.name !== updated.name;
    const newPath = nameChanged
      ? path.join(dir, `${updated.name}.json`)
      : oldPath;

    // Se mudou nome, remove antigo antes de escrever
    if (nameChanged && oldPath !== newPath) {
      if (await fse.pathExists(oldPath)) {
        await fse.remove(oldPath);
      }
    }

    updated.dataPath = newPath;

    await fse.ensureDir(dir);
    await fse.writeJson(newPath, updated, { spaces: 2 });

    return newPath;
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
