import fse from 'fs-extra';
import path from 'path';

import {
  Collection,
  SerieInCollection,
  CreateCollectionDTO,
} from '../../src/types/collections.interfaces';
import LibrarySystem from './abstract/LibrarySystem';
import storageManager from './StorageManager';
import FileManager from './FileManager';
import { Literatures } from '../types/electron-auxiliar.interfaces';
import { TieIn } from '../types/comic.interfaces';

export default class CollectionManager extends LibrarySystem {
  private readonly storageManager = storageManager;
  private readonly fileManager = new FileManager();
  private static readonly MAX_COLLECTION_ITEMS = 10000;

  constructor() {
    super();
  }

  public async getCollections(): Promise<Collection[] | null> {
    try {
      const data = (await fse.readJson(this.appCollections)) as Collection[];
      return data;
    } catch (e) {
      console.error('Erro ao obter coleções: ', e);
      return null;
    }
  }

  public async reorderCollectionSeries(
    collectionName: string,
    orderedSeriesIds: number[],
  ): Promise<boolean> {
    try {
      const collection = await this.getCollection(collectionName);
      if (!collection) return false;

      if (orderedSeriesIds.length !== collection.series.length) return false;

      const currentMap = new Map(
        collection.series.map((serie) => [serie.id, serie]),
      );
      const reordered = orderedSeriesIds
        .map((id, index) => {
          const found = currentMap.get(id);
          if (!found) return null;

          return {
            ...found,
            position: index + 1,
          };
        })
        .filter(Boolean) as SerieInCollection[];

      if (reordered.length !== collection.series.length) return false;

      await this.updateCollection({
        ...collection,
        series: reordered,
      });

      return true;
    } catch (error) {
      console.error('Falha ao reordenar coleção:', error);
      return false;
    }
  }

  public async getCollection(name: string): Promise<Collection | null> {
    try {
      return await this.findCollectionByName(name);
    } catch (e) {
      console.error(`Erro ao obter a coleção ${name}: `, e);
      return null;
    }
  }

  //   Avaliar a necessidade
  public async getDefaultCollections(): Promise<Collection[] | null> {
    try {
      const favorites = await this.findCollectionByName('favoritos');
      const recentes = await this.findCollectionByName('recentes');

      if (!favorites || !recentes) return null;

      return [favorites, recentes];
    } catch (e) {
      console.error('Erro ao obter coleções padrão: ', e);
      return null;
    }
  }

  public async getFavorites(): Promise<Collection | null> {
    try {
      return await this.findCollectionByName('favoritos');
    } catch (e) {
      console.error('Erro ao obter a coleção de favoritos: ', e);
      return null;
    }
  }

  public async addLastRead(serie: Literatures | TieIn): Promise<boolean> {
    try {
      const collection = await this.getLastRead();
      if (!collection) return false;

      const newSerieInfo = await this.mountSerieInfo(serie.dataPath);
      if (!newSerieInfo) return false;

      // Remove se já existir para reinserir no topo (LIFO)
      const otherSeries = collection.series.filter(s => s.id !== newSerieInfo.id);
      
      // Adiciona no topo e limita a 8 itens para manter a Home limpa
      const updatedSeries = [
        { ...newSerieInfo, position: 1 },
        ...otherSeries.map((s, i) => ({ ...s, position: i + 2 }))
      ].slice(0, 8);

      const update = {
        ...collection,
        series: updatedSeries,
      };

      await this.updateCollection(update);
      return true;
    } catch (e) {
      console.error('Erro ao adicionar aos recentes:', e);
      return false;
    }
  }

  public async getLastRead(): Promise<Collection | null> {
    try {
      return await this.findCollectionByName('recentes');
    } catch (e) {
      console.error('Erro ao obter a coleção de recentes: ', e);
      return null;
    }
  }

  private async findCollectionByName(name: string): Promise<Collection | null> {
    const collections = await this.getCollections();
    if (!collections) return null;

    const normalizedSearch = name.toLocaleLowerCase().trim();
    return (
      collections.find(
        (col) => col.name.toLocaleLowerCase().trim() === normalizedSearch,
      ) || null
    );
  }

  public async quicklyCreate(name: string): Promise<boolean> {
    try {
      const data = await this.getCollections();

      if (!data) return false;

      const rawName = name.toLocaleLowerCase().trim();
      const exist = data.some(
        (col) => col.name.toLocaleLowerCase().trim() == rawName,
      );

      if (exist) {
        return false;
      }

      const newCollection = this.mountEmptyCollection(name);
      data.push(newCollection);

      await fse.writeJson(this.appCollections, data, { spaces: 2 });
      return true;
    } catch (e) {
      console.error('Erro ao criar nova coleção: ', e);
      return false;
    }
  }

  public async updateSerieBackground(
    collectionName: string,
    serieId: number,
    backgroundImage: string | null,
  ): Promise<boolean> {
    try {
      const collection = await this.getCollection(collectionName);
      if (!collection) return false;

      const serieExists = collection.series.some(
        (serie) => serie.id === serieId,
      );

      if (!serieExists) return false;

      const updatedCollection: Collection = {
        ...collection,
        series: collection.series.map((serie) =>
          serie.id === serieId ? { ...serie, backgroundImage } : serie,
        ),
      };

      return this.updateCollection(updatedCollection);
    } catch (error) {
      console.error('Falha ao atualizar background da série:', error);
      return false;
    }
  }

  public async createCollection(
    collection: CreateCollectionDTO,
  ): Promise<boolean> {
    try {
      const data = await this.getCollections();
      if (!data) return false;

      const rawName = collection.name.toLocaleLowerCase().trim();

      const exist = data.some(
        (col) => col.name.toLocaleLowerCase().trim() === rawName,
      );

      if (exist || !rawName) {
        return false;
      }

      // 🔹 Monta as séries primeiro
      collection.series = await Promise.all(
        collection.series.map((s) => this.mountSerieInCollection(s)),
      );

      // 🔹 Resolve coverImage se for baseada em série
      if (collection.seriesCoverId) {
        const serieForCover = collection.series.find(
          (s) => s.id === collection.seriesCoverId,
        );

        if (!serieForCover) {
          console.error('seriesCoverId inválido');
          return false;
        }

        collection.coverImage = serieForCover.coverImage;
      }

      // 🔹 Remove campo auxiliar (se não fizer parte do model)
      delete collection.seriesCoverId;

      const newCollection = this.mountCollection(collection);
      data.push(newCollection);

      await fse.writeJson(this.appCollections, data, { spaces: 2 });

      return true;
    } catch (e) {
      console.error('Erro ao criar nova coleção: ', e);
      return false;
    }
  }

  // Cria a partir das diferenças
  public async diffCreate(serieCollections: string[]): Promise<boolean> {
    try {
      const notExist = await this.notExist(serieCollections);

      if (!notExist) return false;

      for (const collectionName of notExist) {
        await this.quicklyCreate(collectionName);
      }

      return true;
    } catch (e) {
      console.error('Falha em criar novas coleções: ', e);
      return false;
    }
  }

  // Apagar coleção
  public async removeCollection(name: string): Promise<boolean> {
    try {
      const data = await this.getCollections();

      if (!data) return false;

      const updatedData = data.filter((col) => col.name !== name);

      await fse.writeJson(this.appCollections, updatedData, { spaces: 2 });
      return true;
    } catch (e) {
      console.error('Falha ao remover a coleção: ', e);
      return false;
    }
  }

  // remove a série de uma coleção
  public async removeInCollection(
    collectionName: string,
    serieId: number,
  ): Promise<boolean> {
    try {
      const collection = await this.getCollection(collectionName);

      if (!collection) return false;

      const updatedCollection = {
        ...collection,
        series: collection.series
          .filter((serie) => serie.id !== serieId)
          .map((serie, index) => ({ ...serie, position: index + 1 })),
      };

      await this.updateCollection(updatedCollection);
      return true;
    } catch (e) {
      console.error('Falha em retirar série da coleção: ', e);
      return false;
    }
  }

  public async updateCollectionInfo(
    collectionName: string,
    payload: Partial<Pick<Collection, 'description' | 'coverImage' | 'name'>>,
  ): Promise<boolean> {
    try {
      const collection = await this.getCollection(collectionName);

      if (!collection) return false;

      const nextName = payload.name?.trim();
      if (nextName) {
        const collections = await this.getCollections();
        const normalizedName = nextName.toLocaleLowerCase();
        const hasDuplicate = collections?.some(
          (col) =>
            col.name.toLocaleLowerCase() === normalizedName &&
            col.name !== collectionName,
        );

        if (hasDuplicate) return false;
      }

      const updatedCollection: Collection = {
        ...collection,
        ...payload,
        name: nextName || collection.name,
      };

      const collections = await this.getCollections();
      if (!collections) return false;

      const updatedData = collections.map((col) =>
        col.name === collectionName
          ? { ...updatedCollection, updatedAt: new Date().toISOString() }
          : col,
      );

      await fse.writeJson(this.appCollections, updatedData, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Falha em atualizar coleção:', error);
      return false;
    }
  }

  // remove a série de uma ou mais coleções
  public async removeInCollections(
    serieName: string,
    serieCollections: string[],
  ): Promise<boolean> {
    try {
      const data = await this.getCollections();
      if (!data || data.length === 0) return false;

      const collectionSet = new Set(serieCollections);

      const collectionsToUpdate = data.filter(
        (col) =>
          collectionSet.has(col.name) &&
          col.series.some((serie) => serie.name === serieName),
      );

      if (collectionsToUpdate.length === 0) {
        console.warn(
          'A série não existe em nenhuma das coleções selecionadas.',
        );
        return false;
      }

      const updates = collectionsToUpdate.map((col) => {
        const updatedCol = {
          ...col,
          series: col.series.filter((serie) => serie.name !== serieName),
        };

        return this.updateCollection(updatedCol);
      });

      await Promise.all(updates);
      return true;
    } catch (e) {
      console.error('Falha em retirar série da coleção: ', e);
      return false;
    }
  }

  // adiciona em uma coleção
  public async addInCollection(
    dataPath: string,
    collectionName: string,
  ): Promise<boolean> {
    try {
      const collection = await this.getCollection(collectionName);

      if (!collection) {
        return false;
      }

      const serie = await this.mountSerieInfo(dataPath);

      if (!serie) {
        return false;
      }

      const alreadyExists = collection.series.some((s) => {
        const match = s.id === serie.id;
        return match;
      });

      if (alreadyExists) {
        return false;
      }

      if (collection.series.length >= CollectionManager.MAX_COLLECTION_ITEMS) {
        return false;
      }

      const description =
        serie.description || `Série ${serie.name} sem descrição local.`;

      const positionedSerie = {
        ...serie,
        description,
        position: collection.series.length + 1,
      };

      const update = {
        ...collection,
        series: [...collection.series, positionedSerie],
      };

      await this.updateCollection(update);

      return true;
    } catch (e) {
      console.error('Error while adding serie to collection:', e);
      console.groupEnd();
      return false;
    }
  }

  // adiciona a série em uma ou mais coleções
  public async addInCollections(dataPath: string, serieCollections: string[]) {
    try {
      const allExist = await this.diffCreate(serieCollections);

      if (!allExist) return false;

      const data = await this.getCollections();
      if (!data || data.length === 0) return false;

      const serie = await this.mountSerieInfo(dataPath);
      const collectionSet = new Set(serieCollections);

      const targetCollections = data.filter(
        (col) =>
          collectionSet.has(col.name) &&
          !col.series.some((s) => s.id === serie.id),
      );

      if (targetCollections.length === 0) {
        return false;
      }

      const updates = targetCollections.map((col) => {
        const updatedCol = {
          ...col,
          series: [
            ...col.series,
            { ...serie, position: col.series.length + 1 },
          ],
          updatedAt: new Date().toISOString(),
        };

        return this.updateCollection(updatedCol);
      });

      await Promise.all(updates);

      return true;
    } catch (e) {
      console.error('Falha em adicionar a serie à coleção: ', e);
      return false;
    }
  }

  public async initializeCollections(
    serie: Literatures,
    serieCollections: string[],
  ) {
    try {
      const allExist = await this.diffCreate(serieCollections);

      if (!allExist) return false;

      const data = await this.getCollections();
      if (!data || data.length === 0) return false;

      const collectionSet = new Set(serieCollections);

      const targetCollections = data.filter(
        (col) =>
          collectionSet.has(col.name) &&
          !col.series.some((s) => s.id === serie.id),
      );

      if (targetCollections.length === 0) {
        return false;
      }

      const updates = targetCollections.map((col) => {
        const updatedCol = {
          ...col,
          series: [...col.series, serie],
          updatedAt: new Date().toISOString(),
        };

        return updatedCol;
      });

      await Promise.all(updates);

      return true;
    } catch (e) {
      console.error('Falha em adicionar a serie à coleção: ', e);
      return false;
    }
  }

  // Retorna as que não existem
  public async notExist(collections: string[]): Promise<string[] | []> {
    try {
      const data = await this.getCollections();

      if (!data) return [];

      const collectionsName = data.map((col) => col.name);
      const existSet = new Set(collectionsName);

      const notExist = collections.filter((c) => !existSet.has(c));

      return notExist;
    } catch (e) {
      console.error('Falha em verificar quais colecoes ainda nao existem: ', e);
      return [];
    }
  }

  public async collectionControl(
    dataPath: string,
    oldCollections: string[],
    newCollection: string[],
  ) {
    try {
      const serieName = path.basename(dataPath, path.extname(dataPath));
      const oldSet = new Set(oldCollections);
      const newSet = new Set(newCollection);

      const toAdd = newCollection.filter((c) => !oldSet.has(c));
      const toRemove = oldCollections.filter((c) => !newSet.has(c));

      if (toAdd.length > 0) {
        await this.addInCollections(dataPath, toAdd);
      }

      if (toRemove.length > 0) {
        await this.removeInCollections(serieName, toRemove);
      }

      return true;
    } catch (e) {
      console.error('Falha em gerenciar as coleções: ', e);
      return false;
    }
  }

  public async mountSerieInfo(dataPath: string): Promise<SerieInCollection> {
    try {
      const serie = (await this.storageManager.readSerieData(
        dataPath,
      )) as Literatures;

      return this.toSerieInCollection(serie);
    } catch (e) {
      console.error('Erro ao montar informações da série:', e);
      throw e;
    }
  }

  private toSerieInCollection(serie: Literatures | TieIn): SerieInCollection {
    return {
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      archivesPath: serie.archivesPath,
      description: serie.description || '',
      backgroundImage: null,
      status: serie.metadata.status,
      rating: serie.metadata.rating || 0,
      totalChapters: serie.totalChapters,
      recommendedBy: serie.metadata.recommendedBy || '',
      originalOwner: serie.metadata.originalOwner || '',
      addAt: new Date().toISOString(),
      position: 0,
    };
  }

  public async clearCollection(collectionName: string): Promise<boolean> {
    try {
      const emptyCollection = this.mountEmptyCollection(collectionName);
      return await this.updateCollection(emptyCollection);
    } catch (e) {
      console.error('Falha em resetar a coleção: ', e);
      return false;
    }
  }

  public async hasSerie(
    serieId: number,
    collectionName: string,
  ): Promise<boolean> {
    try {
      const collection = await this.getCollection(collectionName);
      return collection?.series.some((serie) => serie.id === serieId) ?? false;
    } catch (e) {
      console.error('Falha em verificar se a coleção já possui a série: ', e);
      return false;
    }
  }

  public async updateSerie(dataPath: string): Promise<boolean> {
    try {
      const collections = await this.getCollections();
      if (!collections) return false;

      const updatedSerieInfo = await this.mountSerieInfo(dataPath);
      const now = new Date().toISOString();

      const updatedData = collections.map((col) => {
        const serieIndex = col.series.findIndex((s) => s.id === updatedSerieInfo.id);
        if (serieIndex === -1) return col;

        const updatedSeries = [...col.series];
        updatedSeries[serieIndex] = {
          ...updatedSerieInfo,
          backgroundImage: col.series[serieIndex].backgroundImage ?? null,
        };

        return { ...col, series: updatedSeries, updatedAt: now };
      });

      await fse.writeJson(this.appCollections, updatedData, { spaces: 2 });
      return true;
    } catch (e) {
      console.error('Falha em atualizar dados da série nas coleções: ', e);
      return false;
    }
  }

  private mountCollection(
    collection: Omit<Collection, 'createdAt' | 'updatedAt'>,
  ): Collection {
    const date = new Date().toISOString();
    return {
      name: collection.name.trim(),
      description: collection.description || '',
      coverImage: collection.coverImage || '',
      series: collection.series || [],
      createdAt: date,
      updatedAt: date,
    };
  }

  private mountEmptyCollection(name: string): Collection {
    const date = new Date().toISOString();
    return {
      name,
      description: '',
      coverImage: '',
      series: [],
      updatedAt: date,
      createdAt: date,
    };
  }

  private async mountSerieInCollection(
    serie: SerieInCollection,
  ): Promise<SerieInCollection> {
    const dataPath = await this.fileManager.getDataPath(serie.name);
    const serieData = await this.storageManager.readSerieData(dataPath);

    if (!serieData) throw new Error(`Dados não encontrados para a série: ${serie.name}`);

    return {
      ...serie,
      coverImage: serieData.coverImage,
    };
  }

  private async updateCollection(collection: Collection): Promise<boolean> {
    try {
      const collections = await this.getCollections();
      if (!collections) return false;

      const now = new Date().toISOString();
      const updatedData = collections.map((col) =>
        col.name === collection.name ? { ...collection, updatedAt: now } : col,
      );

      await fse.writeJson(this.appCollections, updatedData, { spaces: 2 });
      return true;
    } catch (e) {
      console.error('Falha em atualizar a coleção: ', e);
      return false;
    }
  }
}
