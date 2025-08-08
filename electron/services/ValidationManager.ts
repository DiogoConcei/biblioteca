import path from 'path';
import fs from 'fs-extra';

import StorageManager from './StorageManager';
import FileSystem from './abstract/FileSystem.ts';
import { Collection } from '../../src/types/collections.interfaces.ts';
import { Literatures } from '../../src/types/auxiliar.interfaces.ts';
import { TieIn } from '../types/comic.interfaces.ts';

// import jsonfile from 'jsonfile';
// import FileManager from './FileManager';
// import ImageManager from "./ImageManager";

export default class ValidationManager extends FileSystem {
  private readonly storageManager: StorageManager = new StorageManager();
  // private readonly fileManager: FileManager = new FileManager();
  // private readonly imageManager: ImageManager = new ImageManager();

  constructor() {
    super();
  }

  public async serieExist(file: string): Promise<boolean> {
    const newSerieName = path.basename(file).toLocaleLowerCase();
    const seriesDir = await fs.readdir(this.userLibrary, {
      withFileTypes: true,
    });
    const seriesName = seriesDir.map((seriesDir) =>
      seriesDir.name.toLowerCase(),
    );

    for (const serieName of seriesName) {
      if (serieName === newSerieName) {
        return true;
      }
    }

    return true;
  }

  public async collectionExist(collectionName: string): Promise<boolean> {
    try {
      let collections: Collection[] = [];

      try {
        const data = await fs.readFile(this.appCollections, 'utf-8');
        collections = JSON.parse(data);
        collections = Array.isArray(collections) ? collections : [];
      } catch (readError) {
        collections = [];
      }

      if (
        collections.some((collection) => collection.name === collectionName)
      ) {
        return false;
      }

      return true;
    } catch (e) {
      console.error(`Falha em checar se a coleção existe: ${e}`);
      throw e;
    }
  }

  // public async serieExistsInCollection(collectionName: string, serieId: number): Promise<boolean> {
  //   try {
  //     const collections: Collection[] = await jsonfile.readFile(this.appCollections, 'utf-8');

  //     const collection = collections.find(c => c.name === collectionName);
  //     if (!collection) {
  //       console.warn(`Coleção "${collectionName}" não encontrada.`);
  //       return false;
  //     }

  //     return collection.series.some(serie => serie.id === serieId);
  //   } catch (error) {
  //     console.error(`Erro ao verificar se a série existe na coleção: ${error}`);
  //     throw error;
  //   }
  // }

  public async checkDownload(
    serieData: Literatures | TieIn,
    chapterId: number,
  ): Promise<boolean> {
    try {
      const chapters = serieData.chapters;

      if (!chapters || chapterId > chapters.length) {
        return false;
      }

      const chapter = chapters.find((ch) => ch.id === chapterId);
      return chapter?.isDownload ?? false;
    } catch (error) {
      console.error(
        `Erro ao verificar estado do capítulo ${chapterId}:`,
        error,
      );
      return false;
    }
  }

  public async isDinamicImage(imagePath: string): Promise<boolean> {
    try {
      if (await this.isWebp(imagePath)) return false;

      const dinamicDir = path.join(this.imagesFolder, 'dinamic images');
      const content = (
        await fs.readdir(dinamicDir, { withFileTypes: true })
      ).map((contentPath) => path.join(dinamicDir, contentPath.name));
      const findImage = content.find(
        (contentPath) =>
          path.basename(contentPath) === path.basename(imagePath),
      );

      if (findImage && fs.existsSync(findImage)) {
        return false;
      }

      return true;
    } catch (e) {
      console.error(`Falha em verificar se é uma imagem dinamica: ${e}`);
      throw e;
    }
  }

  public async isWebp(imagePath: string): Promise<boolean> {
    try {
      const extName = path.extname(imagePath).toLowerCase();

      if (extName == '.webp') {
        return true;
      }

      return false;
    } catch (e) {
      console.error(`Falha em checar extensão da imagem`);
      throw e;
    }
  }

  public async tieInCreated(dataPath: string): Promise<boolean> {
    try {
      const tieInData = (await this.storageManager.readSerieData(
        dataPath,
      )) as unknown as TieIn;

      if (tieInData.metadata.isCreated) {
        return true;
      }

      return false;
    } catch (e) {
      console.log(`Falha em verificar existência da TieIn`);
      throw e;
    }
  }
}
