import path from 'path';
import fse from 'fs-extra';

import FileSystem from '../abstract/LibrarySystem.ts';
import { Literatures, APIResponse } from '../../types/electron-auxiliar.interfaces.ts';
import { TieIn } from '../../types/comic.interfaces.ts';

export default class ValidationManager extends FileSystem {
  constructor() {
    super();
  }

  public async serieExist(file: string): Promise<boolean> {
    try {
      const newSerieName = path.basename(file).toLowerCase();
      const entries = await fse.readdir(this.userLibrary, { withFileTypes: true });

      return entries.some((entry) => entry.name.toLowerCase() === newSerieName);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false;
      console.error(`Falha em checar se a série existe: ${e}`);
      throw e;
    }
  }

  /** true se já existe uma coleção com esse nome. */
  public async collectionExist(collectionName: string): Promise<boolean> {
    try {
      let collections: Array<{ name: string }> = [];

      try {
        const data = await fse.readFile(this.appCollections, 'utf-8');
        const parsed = JSON.parse(data);
        collections = Array.isArray(parsed) ? parsed : [];
      } catch {
        collections = [];
      }

      return collections.some((collection) => collection.name === collectionName);
    } catch (e) {
      console.error(`Falha em checar se a coleção existe: ${e}`);
      throw e;
    }
  }

  /** Confere a flag do JSON E se a pasta do capítulo existe no disco. */
  public async checkDownload(
    serieData: Literatures | TieIn,
    chapterId: number,
  ): Promise<APIResponse<void>> {
    try {
      const chapter = serieData.chapters?.find(
        (ch) => Number(ch.id) === Number(chapterId),
      );

      if (!chapter) {
        return { success: false, error: `Capítulo ${chapterId} não encontrado` };
      }

      if (chapter.isDownloaded !== 'downloaded') {
        return { success: false };
      }

      if (!chapter.chapterPath || !(await fse.pathExists(chapter.chapterPath))) {
        return {
          success: false,
          error: `Capítulo marcado como baixado, mas ausente no disco: ${chapter.chapterPath}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error(`Erro ao verificar estado do capítulo ${chapterId}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  public async isDinamicImage(imagePath: string): Promise<boolean> {
    try {
      if (this.isWebp(imagePath)) return false;

      const dinamicDir = path.join(this.imagesFolder, 'dinamic images');

      let names: string[] = [];
      try {
        names = await fse.readdir(dinamicDir);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }

      const alreadyProcessed = names.includes(path.basename(imagePath));
      return !alreadyProcessed;
    } catch (e) {
      console.error(`Falha em verificar se é uma imagem dinamica: ${e}`);
      throw e;
    }
  }

  public isWebp(imagePath: string): boolean {
    return path.extname(imagePath).toLowerCase() === '.webp';
  }
}
