import path from 'path';
import fse from 'fs-extra';
import pLimit from 'p-limit';

import LibrarySystem from './abstract/LibrarySystem';
import SystemManager from './SystemManager';

import { Comic, ComicTieIn } from '../types/comic.interfaces';

import { SerieForm } from '../../src/types/series.interfaces';

export default class ComicManager extends LibrarySystem {
  // ==============================================================================

  // public async createComicData(serie: SerieForm): Promise<Comic> {

  //   const [comics, childSeries] = await Promise.all([
  //     this.searchComics([serie.oldPath, ...subDir]),
  //     subDir.length
  //       ? Promise.all(
  //           subDir.map((sd, idx) =>
  //             this.createChildSeries(rightPath, sd, idx, nextId),
  //           ),
  //         )
  //       : Promise.resolve([]),
  //   ]);
  //
  // }

  // ==============================================================================

  // Deve ser adaptado para o FileManager
  // ======================================
  private async countComics(directories: string[]): Promise<number> {
    const concurrency = 8;
    const rawExts = ['.cbz', '.cbr', '.zip'];

    const extSet = new Set(
      rawExts.map((e) =>
        e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`,
      ),
    );

    const limit = pLimit(concurrency);

    const tasks = directories.map((dir) =>
      limit(async (): Promise<number> => {
        try {
          const entries = await fse.readdir(dir, { withFileTypes: true });

          if (entries.length === 0) return 0;

          let count = 0;
          for (const e of entries) {
            if (!e.isFile()) continue;
            const ext = path.extname(e.name).toLowerCase();
            if (extSet.has(ext)) count++;
          }
          return count;
        } catch {
          return 0;
        }
      }),
    );

    const results = await Promise.all(tasks);
    return results.reduce((s, v) => s + v, 0);
  }

  // Deve ser adaptado para o FileManager
  // ======================================
  private async searchDirectories(dirPath: string): Promise<string[]> {
    const entries = (
      await fse.readdir(dirPath, { withFileTypes: true })
    ).filter((e) => e.isDirectory());
    const dirPaths = entries.map((e) => path.join(dirPath, e.name));

    try {
      const directories: string[] = [];
      const subDirsArrays = await Promise.all(
        dirPaths.map((dir) => this.searchDirectories(dir)),
      );
      for (const dir of dirPaths) directories.push(dir);
      for (const subDirs of subDirsArrays) directories.push(...subDirs);
      return directories;
    } catch (e) {
      console.error('Falha em verificar todos os sub diretorios: ', e);
      return [];
    }
  }

  private async mountEmptyComic(serie: SerieForm): Promise<Comic> {
    const nextId = (await this.getSerieId()) + 1;
    return {
      id: nextId,
      name: serie.name,
      sanitizedName: serie.sanitizedName,
      archivesPath: path.join(this.userLibrary, serie.name),
      chaptersPath: path.join(
        this.imagesFolder,
        serie.literatureForm,
        serie.name,
      ),
      dataPath: path.join(this.comicsData, `${serie.name}.json`),
      coverImage: serie.cover_path,
      totalChapters: 0,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: serie.literatureForm,
      chaptersRead: 0,
      readingData: { lastChapterId: 1, lastReadAt: '' },
      chapters: [],
      childSeries: [],
      metadata: {
        status: serie.readingStatus,
        collections: serie.collections,
        recommendedBy: '',
        originalOwner: '',
        lastDownload: 0,
        rating: 0,
        isFavorite: serie.collections.includes('Favoritas'),
        privacy: serie.privacy,
        autoBackup: serie.autoBackup,
        compiledComic: false,
      },
      createdAt: serie.createdAt,
      deletedAt: serie.deletedAt,
      tags: serie.tags,
      comments: [],
    };
  }

  // private async mountEmpyChilds();
}
