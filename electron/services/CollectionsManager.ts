import fse from 'fs-extra';

import FileSystem from './abstract/FileSystem.ts';
import {
  APIResponse,
  NormalizedSerieData,
} from '../../src/types/auxiliar.interfaces.ts';
import {
  Collection,
  SerieCollectionInfo,
} from '../../src/types/collections.interfaces.ts';
import ValidationManager from './ValidationManager.ts';

export default class CollectionsManager extends FileSystem {
  private readonly validationManager: ValidationManager =
    new ValidationManager();

  constructor() {
    super();
  }

  public async getCollections(): Promise<APIResponse<Collection[]>> {
    try {
      const data: Collection[] = await fse.readJson(this.appCollections);
      return { success: true, data: data };
    } catch (e) {
      console.error(`Falha em obter todas as coleções: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  public async createCollection(
    collectionName: string,
  ): Promise<APIResponse<void>> {
    try {
      const date = new Date();

      let collections: Collection[] = [];
      try {
        const data = await fse.readJson(this.appCollections);
        collections = Array.isArray(data) ? data : [];
      } catch (readError) {
        collections = [];
      }

      const canCreate =
        await this.validationManager.collectionExist(collectionName);

      if (!canCreate) {
        return { success: false };
      }

      const newCollection: Collection = {
        name: collectionName,
        description: '',
        series: [],
        comments: [],
        updatedAt: date.toISOString(),
      };

      collections.push(newCollection);
      await fse.writeJson(this.appCollections, collections, { spaces: 2 });
      return { success: true };
    } catch (e) {
      console.error(`Falha em criar nova coleção: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  public async serieToCollection(
    serieData: NormalizedSerieData,
  ): Promise<APIResponse<void>> {
    try {
      for (const collectionName of serieData.collections) {
        await this.createCollection(collectionName);
      }

      if (serieData.collections.includes('Favoritas')) {
        serieData.isFavorite = true;
      }

      const fileData: Collection[] = await fse.readJson(this.appCollections);

      if (!fileData) {
        return { success: false };
      }

      const updatedCollections = fileData.map((collection) => {
        if (serieData.collections.includes(collection.name)) {
          const seriesExists = collection.series.some(
            (serie) => serie.id === serieData.id,
          );

          if (collection.name === 'Favoritas') {
            serieData.isFavorite = true;
          }

          if (!seriesExists) {
            const dataAtual = Date.now();

            const newSerie: SerieCollectionInfo = {
              id: serieData.id,
              name: serieData.name,
              coverImage: serieData.coverImage,
              comic_path: serieData.chaptersPath,
              archivesPath: serieData.archivesPath,
              totalChapters: serieData.totalChapters,
              status: serieData.status,
              recommendedBy: serieData.recommendedBy || '',
              originalOwner: serieData.originalOwner || '',
              rating: serieData.rating ?? 0,
              addAt: dataAtual,
            };

            const date = new Date();
            return {
              ...collection,
              series: [...collection.series, newSerie],
              updatedAt: date.toISOString(),
            };
          }
        }
        return collection;
      });

      await fse.writeJson(this.appCollections, updatedCollections, {
        spaces: 2,
      });
      return { success: true };
    } catch (e) {
      console.error(`Falha em adicionar a série na coleção: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  public async getFavorites(): Promise<APIResponse<Collection>> {
    try {
      const response = await this.getCollections();
      const collection = response.data;

      if (!collection) {
        throw new Error('Coleção de favorias não encontrada.');
      }

      const favorites = collection.find(
        (collect) => collect.name === 'Favoritas',
      );

      return { success: true, data: favorites };
    } catch (e) {
      console.error(`Erro ao recuperar a coleção de favoritas: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  public async updateRecCollection(
    collectionData: Collection[],
    collectionPath: string,
  ): Promise<APIResponse<void>> {
    try {
      await fse.writeJson(collectionPath, collectionData, { spaces: 2 });
      return { success: true };
    } catch (e) {
      console.error('Erro ao atualizar a coleção de séries recentes:', e);
      return { success: false, error: String(e) };
    }
  }

  public async updateFavCollection(
    collectionData: Collection[],
    collectionPath: string,
  ): Promise<APIResponse<void>> {
    try {
      await fse.writeJson(collectionPath, collectionData, { spaces: 2 });
      return { success: true };
    } catch (e) {
      console.error('Erro ao atualizar coleção de favoritas:', e);
      return { success: false, error: String(e) };
    }
  }

  public async updateSerieInAllCollections(
    serieId: number,
    updatedData: Partial<SerieCollectionInfo>,
  ): Promise<APIResponse<void>> {
    try {
      const fileData: Collection[] = await fse.readJson(this.appCollections);

      if (!fileData) {
        return { success: false };
      }

      const updatedCollections = fileData.map((collection) => {
        const hasSerie = collection.series.some(
          (serie) => serie.id === serieId,
        );

        if (!hasSerie) {
          return collection;
        }

        const updatedSeries = collection.series.map((serie) => {
          if (serie.id !== serieId) {
            return serie;
          }

          return {
            ...serie,
            ...updatedData,
          };
        });

        const date = new Date();
        return {
          ...collection,
          series: updatedSeries,
          updatedAt: date.toISOString(),
        };
      });

      await this.saveCollections(updatedCollections);
      return { success: true };
    } catch (e) {
      console.error(`Falha em atualizar série em todas as coleções: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  private async saveCollections(collections: Collection[]): Promise<void> {
    await fse.writeJson(this.appCollections, collections, { spaces: 2 });
  }
}
