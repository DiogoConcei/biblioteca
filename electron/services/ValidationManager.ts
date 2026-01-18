import path from 'path';
import fse from 'fs-extra';

import StorageManager from './StorageManager';
import FileSystem from './abstract/LibrarySystem.ts';
import { Collection } from '../../src/types/collections.interfaces.ts';
import { Literatures } from '../../src/types/auxiliar.interfaces.ts';
import { Comic, TieIn } from '../types/comic.interfaces.ts';

import FileManager from './FileManager';
import ImageManager from './ImageManager';
import { Manga } from '../types/manga.interfaces.ts';

export default class ValidationManager extends FileSystem {
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly fileManager: FileManager = new FileManager();
  private readonly imageManager: ImageManager = new ImageManager();

  constructor() {
    super();
  }

  public async serieExist(file: string): Promise<boolean> {
    const newSerieName = path.basename(file).toLocaleLowerCase();
    const seriesDir = await fse.readdir(this.userLibrary, {
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
        const data = await fse.readFile(this.appCollections, 'utf-8');
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

      if (!chapter) return false;

      if (chapter.isDownloaded === 'downloaded') {
        return true;
      } else {
        return false;
      }
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
        await fse.readdir(dinamicDir, { withFileTypes: true })
      ).map((contentPath) => path.join(dinamicDir, contentPath.name));
      const findImage = content.find(
        (contentPath) =>
          path.basename(contentPath) === path.basename(imagePath),
      );

      if (findImage && fse.existsSync(findImage)) {
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
}

// (async () => {
//   const serieName = 'Batman - Cavaleiro Branco';
//   const chapterId = 1;
//   const fileManager = new FileManager();
//   const storageManager = new StorageManager();
//   const validationManager = new ValidationManager();
//   const dataPath = await fileManager.getDataPath(serieName);

//   const LiteratureForm = await fileManager.foundLiteratureForm(dataPath);
//   console.log(LiteratureForm);

//   function isTieIn(data: Literatures | TieIn): data is TieIn {
//     return (data as TieIn).metadata.isCreated !== undefined;
//   }

//   function isManga(data: Literatures | TieIn): data is Manga {
//     return (data as Manga).literatureForm !== undefined;
//   }

//   const serieData = await storageManager.readSerieData(dataPath);

//   if (isTieIn(serieData)) {
//     console.log(await validationManager.checkDownload(serieData, chapterId));
//   } else if (isManga(serieData)) {
//     console.log(await validationManager.checkDownload(serieData, chapterId));
//   } else {
//     console.log(await validationManager.checkDownload(serieData, chapterId));
//   }

//   // if (!serieData?.chapters) {
//   //   throw new Error('Erro ao recuperar os dados da série.');
//   // }
// })();
