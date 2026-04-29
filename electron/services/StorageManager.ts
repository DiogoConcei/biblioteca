import fse from 'fs-extra';
import path from 'path';
import { isDeepStrictEqual } from 'node:util';

import { SerieData, SerieEditForm } from '../../src/types/series.interfaces';
import { TieIn } from '../types/comic.interfaces';
import {
  graphSerie,
  LiteratureChapter,
  viewData,
  Literatures,
} from '../types/electron-auxiliar.interfaces';
import FileManager from './FileManager';
import LibrarySystem from './abstract/LibrarySystem';

export class StorageManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();

  // Cache de visualização (Home)
  private _viewDataCache: viewData[] | null = null;

  // Cache completo de séries (indexado por dataPath)
  private _seriesCache: Map<string, Literatures | TieIn> = new Map();

  // Fila global de escrita para evitar corrupção
  private _writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    super();
  }

  /**
   * Enfileira uma operação de escrita para garantir que seja serializada globalmente.
   */
  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this._writeQueue.then(task);
    this._writeQueue = result.then(() => {}).catch(() => {});
    return result;
  }

  /**
   * Realiza uma escrita atômica usando um arquivo temporário.
   */
  private async atomicWrite(filePath: string, data: unknown): Promise<void> {
    const tmpPath = `${filePath}.tmp`;
    try {
      await fse.ensureDir(path.dirname(filePath));
      await fse.writeJSON(tmpPath, data, { spaces: 2 });
      await fse.move(tmpPath, filePath, { overwrite: true });
    } catch (error) {
      // Limpa o arquivo temporário em caso de erro
      if (await fse.pathExists(tmpPath)) {
        await fse.remove(tmpPath);
      }
      throw error;
    }
  }

  /**
   * Limpa o cache de visualização.
   */
  invalidateCache(): void {
    this._viewDataCache = null;
  }

  /**
   * Escreve dados de uma série ou TieIn (Write-Through).
   */
  async writeData(serie: Literatures | TieIn): Promise<boolean> {
    return this.enqueue(async () => {
      try {
        await this.atomicWrite(serie.dataPath, serie);

        // Atualiza Cache (Write-Through)
        this._seriesCache.set(serie.dataPath, serie);
        this.invalidateCache();

        return true;
      } catch (e) {
        console.error(`Erro em escrever dados da serie (${serie.name}): ${e}`);
        return false;
      }
    });
  }

  /**
   * Busca uma série pelo ID, consultando o cache primeiro.
   */
  async searchSerieById(serieId: number): Promise<Literatures | TieIn | null> {
    // Tenta encontrar no cache de séries completo primeiro
    for (const serie of this._seriesCache.values()) {
      if (serie.id === serieId) return serie;
    }

    const viewDataList = await this.getViewData();
    if (viewDataList) {
      const targetSerie = viewDataList.find((serie) => serie.id === serieId);
      if (targetSerie) {
        return await this.readSerieData(targetSerie.dataPath);
      }
    }

    const dataPaths = await this.fileManager.getDataPaths();
    for (const dataPath of dataPaths) {
      const serieData = await this.readSerieData(dataPath);
      if (serieData && serieData.id === serieId) {
        return serieData;
      }
    }

    return null;
  }

  /**
   * Lê dados da série do disco ou cache.
   */
  async readSerieData<T extends graphSerie>(
    dataPath: string,
  ): Promise<T | null> {
    // Consulta Cache
    if (this._seriesCache.has(dataPath)) {
      return this._seriesCache.get(dataPath) as T;
    }

    try {
      if (!(await fse.pathExists(dataPath))) return null;

      const serieData = (await fse.readJson(dataPath, {
        encoding: 'utf-8',
      })) as T;

      if (serieData) {
        this._seriesCache.set(dataPath, serieData);
      }

      return serieData;
    } catch (e) {
      console.error(`Falha ao ler dados da serie em ${dataPath}: ${e}`);
      return null;
    }
  }

  /**
   * Alias para ler TieIn com cache.
   */
  async readTieInData(dataPath: string): Promise<TieIn | null> {
    return this.readSerieData<TieIn>(dataPath);
  }

  /**
   * Deleta um capítulo e invalida o cache.
   */
  async deleteChapter(chapter: LiteratureChapter): Promise<boolean> {
    try {
      if (await fse.pathExists(chapter.chapterPath)) {
        // Se o caminho do capítulo for diferente do arquivo original (ex: cache de mangá), removemos do disco.
        // Se for igual (ex: livros PDF/EPUB), mantemos o arquivo original e apenas resetamos o status.
        if (chapter.chapterPath !== chapter.archivesPath) {
          await fse.remove(chapter.chapterPath);
        }

        chapter.isDownloaded = 'not_downloaded';
        chapter.chapterPath = '';

        // Invalida cache pois os dados da série (que contém o capítulo) mudaram
        this.invalidateCache();

        return true;
      }
      return false;
    } catch (e) {
      console.error('Falha ao deletar capitulo: ', e);
      return false;
    }
  }

  /**
   * Seleciona dados de uma série, priorizando o cache.
   */
  async selectSerieData<T extends Literatures | TieIn>(
    serieName: string,
    type?: 'Manga' | 'Quadrinho' | 'childSeries' | 'Books',
  ): Promise<T> {
    // Tenta encontrar no cache primeiro
    for (const serie of this._seriesCache.values()) {
      if (serie.name === serieName) return serie as T;
    }

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
          case 'Books':
            targetFolder = this.booksData;
            break;
          case 'childSeries':
            targetFolder = this.childSeriesData;
            break;
          default:
            targetFolder = this.mangasData;
        }
      } else {
        const allFolders = [
          this.mangasData,
          this.comicsData,
          this.booksData,
          this.childSeriesData,
        ];
        for (const folder of allFolders) {
          const files = await this.fileManager.foundFiles(folder);
          const found = files.find((f) => path.parse(f).name === serieName);
          if (found) {
            return await this.readSerieData<T>(found);
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

      return await this.readSerieData<T>(serieDataPath);
    } catch (e) {
      console.error(`Erro ao selecionar dados da série (${serieName}):`, e);
      throw e;
    }
  }

  /**
   * Retorna os dados simplificados para visualização (Home).
   */
  async getViewData(): Promise<viewData[] | null> {
    try {
      if (this._viewDataCache) {
        return this._viewDataCache;
      }

      const dataPaths = await this.fileManager.getDataPaths();
      const viewDataList: viewData[] = await Promise.all(
        dataPaths.map(async (dataPath) => {
          const serie = await this.readSerieData(dataPath);
          if (!serie) {
            throw new Error(
              `Erro ao carregar dados de visualização: serie em ${dataPath} é invalida`,
            );
          }
          return this.mountViewData(serie);
        }),
      );

      this._viewDataCache = viewDataList;
      return viewDataList;
    } catch (e) {
      console.error(`Erro ao trazer dados de visualização: ${e}`);
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

  /**
   * Atualiza campos de uma série (Write-Through).
   */
  async patchSerie(data: SerieEditForm): Promise<Literatures | null> {
    return this.enqueue(async () => {
      const oldData = await this.readSerieData(data.dataPath);
      if (!oldData) return null;

      const changedFields = Object.fromEntries(
        (Object.keys(data) as (keyof SerieEditForm)[])
          .filter((k) => data[k] !== (oldData as Record<string, unknown>)[k])
          .map((k) => [k, data[k]]),
      ) as Partial<SerieEditForm>;

      const updated: Literatures = {
        ...oldData,
        ...changedFields,
      } as Literatures;

      if (updated.name !== oldData.name) {
        await this.fileManager.moveFiles(oldData, updated);
      }

      await this.atomicWrite(updated.dataPath, updated);

      // Sincroniza Cache
      this._seriesCache.set(updated.dataPath, updated);
      this.invalidateCache();

      return updated;
    });
  }

  /**
   * Persiste uma série no disco com suporte a troca de nome (Write-Through).
   */
  async persistSerie(
    oldData: Literatures,
    updated: Literatures,
  ): Promise<string> {
    return this.enqueue(async () => {
      const oldPath = oldData.dataPath;
      const dir = path.dirname(oldPath);

      const nameChanged = oldData.name !== updated.name;
      const newPath = nameChanged
        ? path.join(dir, `${updated.name}.json`)
        : oldPath;

      if (nameChanged && oldPath !== newPath) {
        if (await fse.pathExists(oldPath)) {
          await fse.remove(oldPath);
          this._seriesCache.delete(oldPath); // Remove caminho antigo do cache
        }
      }

      updated.dataPath = newPath;
      await this.atomicWrite(newPath, updated);

      // Sincroniza Cache
      this._seriesCache.set(newPath, updated);
      this.invalidateCache();

      return newPath;
    });
  }

  private mountViewData(serie: Literatures): viewData {
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

  buildUpdatedSerie(
    oldData: Literatures,
    newData: SerieEditForm,
  ): { hasChanges: boolean; data: Literatures } {
    const updated = { ...oldData } as Record<string, unknown>;
    let hasChanges = false;

    for (const key of Object.keys(newData)) {
      const newValue = (newData as Record<string, unknown>)[key];
      const oldValue = (oldData as Record<string, unknown>)[key];

      if (!isDeepStrictEqual(oldValue, newValue)) {
        updated[key] = newValue;
        hasChanges = true;
      }
    }

    return { hasChanges, data: updated as unknown as Literatures };
  }
}

// Singleton: Instância única exportada
const storageManager = new StorageManager();
export default storageManager;
