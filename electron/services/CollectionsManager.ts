import fse from 'fs-extra';

import FileSystem from './abstract/FileSystem.ts';
import {
  APIResponse,
  Literatures,
  NormalizedSerieData,
} from '../../src/types/auxiliar.interfaces.ts';
import {
  Collection,
  SerieCollectionInfo,
} from '../../src/types/collections.interfaces.ts';
import ValidationManager from './ValidationManager.ts';
import { SerieEditForm } from '../../src/types/series.interfaces.ts';

export default class CollectionsManager extends FileSystem {
  private readonly validationManager: ValidationManager =
    new ValidationManager();

  constructor() {
    super();
  }

  public async getCollections(): Promise<Collection[] | null> {
    try {
      const data: Collection[] = await fse.readJson(this.appCollections);
      return data;
    } catch (e) {
      console.error(`Falha em obter todas as coleções: ${e}`);
      return null;
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

  public async removeFromCollection(
    id: number,
    collectionName: string,
  ): Promise<void> {
    const collections = await this.getCollections();
    if (!collections) return;

    const updatedAt = new Date().toISOString();

    const newColls = collections.map((col) => {
      if (collectionName === col.name) {
        const filtered = col.series.filter((serie) => serie.id !== id);

        if (filtered.length !== col.series.length) {
          return {
            ...col,
            series: filtered,
            updatedAt,
          };
        }
      }

      return col;
    });

    await this.saveCollections(newColls);
  }

  public async addToCollection(
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
      const data = await this.getCollections();

      const collection = data;

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
    rating: number,
  ): Promise<APIResponse<void>> {
    try {
      const collections = await this.getCollections();

      if (!collections) {
        return { success: false };
      }

      const updatedCollections = collections.map((collection) => {
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
            id: serie.id,
            rating: rating,
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

  private normalizeHelper(
    serie: Literatures,
    collections: string[],
  ): NormalizedSerieData {
    return {
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      chaptersPath: serie.chaptersPath,
      archivesPath: serie.archivesPath,
      totalChapters: serie.totalChapters,
      status: serie.metadata.status,
      recommendedBy: serie.metadata.recommendedBy,
      originalOwner: serie.metadata.originalOwner,
      rating: serie.metadata.rating,
      collections,
      isFavorite: collections.includes('Favoritas'),
    };
  }

  public async checkDifferences(
    oldData: Literatures,
    updatedData: Literatures,
  ) {
    const oldCollections = oldData.metadata.collections;
    const newCollections = updatedData.metadata.collections;

    const oldSet = new Set(oldCollections);
    const newSet = new Set(newCollections);

    const toAdd = newCollections.filter((c) => !oldSet.has(c));
    const toRemove = oldCollections.filter((c) => !newSet.has(c));

    if (toAdd.length > 0) {
      const normalizedData = this.normalizeHelper(
        updatedData,
        updatedData.metadata.collections,
      );

      await this.addToCollection(normalizedData);
    }

    for (const colName of toRemove) {
      await this.removeFromCollection(updatedData.id, colName);
    }
  }
}
