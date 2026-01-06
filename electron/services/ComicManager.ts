import path from 'path';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import TieInManager from './TieInManager';
import SystemManager from './SystemManager';
import FileManager from './FileManager';
import ImageManager from './ImageManager';
import StorageManager from './StorageManager';

import {
  Comic,
  unComic,
  ComicEdition,
  ComicTieIn,
} from '../types/comic.interfaces';
import { SerieForm } from '../../src/types/series.interfaces';

export default class ComicManager extends LibrarySystem {
  private readonly systemManager = new SystemManager();
  private readonly tieInManager = new TieInManager();
  private readonly fileManager = new FileManager();
  private readonly imageManager = new ImageManager();
  private readonly storageManager = new StorageManager();

  public async processComic(serie: SerieForm): Promise<Comic> {
    const nextId = await this.systemManager.getGlobalId().then((id) => id + 1);
    const archivePath = path.join(this.userLibrary, serie.name);
    const totalChapters = await this.searchComics(serie.oldPath);
    const childSeries = await this.mountChilds(nextId, archivePath);

    const newSerie: unComic = {
      ...serie,
      nextId,
      totalChapters,
      childSeries,
    };

    const createdSerie = await this.mountComic(newSerie);

    return createdSerie;
  }

  public async processEdition(
    serieName: string,
    archivePath: string,
  ): Promise<ComicEdition[]> {
    const entries = await fse.readdir(archivePath, { withFileTypes: true });
    const comicEntries = entries
      .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar)$/i.test(e.name))
      .map((e) => path.join(archivePath, e.name));

    if (comicEntries.length === 0) return [];

    const orderComics = await this.fileManager.orderComic(comicEntries);
    const chapters = await Promise.all(
      orderComics.map(async (orderedPath, idx) => {
        return this.mountEdition(serieName, orderedPath, idx);
      }),
    );

    return chapters;
  }

  public async processChild(
    child: ComicTieIn,
    archivePath: string,
  ): Promise<boolean> {
    try {
      const data = await this.tieInManager.createTieInData(child, archivePath);
      // Create Child Covers
      await this.imageManager;
      await this.storageManager.writeSerieData(data);
      return true;
    } catch (e) {
      console.error('Falha em gerar as Tie-Ins: ', e);
      return false;
    }
  }

  public async getComic(
    dataPath: string,
    chapter_id: number,
  ): Promise<string[] | string> {
    try {
      const comic = await this.storageManager.readSerieData(dataPath);
      if (!comic.chapters || comic.chapters.length === 0) {
        throw new Error('Nenhum capítulo encontrado.');
      }
      const chapter = comic.chapters.find((chap) => chap.id === chapter_id);
      if (!chapter || !chapter.chapterPath) {
        throw new Error('Capítulo não encontrado ou caminho inválido.');
      }
      const chapterDirents = await fse.readdir(chapter.chapterPath, {
        withFileTypes: true,
      });
      const imageFiles = chapterDirents
        .filter(
          (dirent) =>
            dirent.isFile() && /\.(jpeg|png|webp|tiff|jpg)$/i.test(dirent.name),
        )
        .map((dirent) => path.join(chapter.chapterPath, dirent.name));
      if (imageFiles.length === 0) {
        throw new Error('Nenhuma imagem encontrada no capítulo.');
      }
      const processedImages =
        await this.imageManager.encodeImageToBase64(imageFiles);
      return processedImages;
    } catch (error) {
      console.error('Não foi possível encontrar a edição do quadrinho:', error);
      throw error;
    }
  }

  public async createEditionById(
    dataPath: string,
    chapter_id: number,
  ): Promise<boolean> {
    try {
      const comicData = (await this.storageManager.readSerieData(
        dataPath,
      )) as Comic;

      if (!comicData.chapters) {
        throw new Error('Chapters data is undefined.');
      }
      const chapterToProcess = comicData.chapters.find(
        (chapter) => chapter.id === chapter_id,
      );
      if (!chapterToProcess) {
        throw new Error(`Chapter with id ${chapter_id} not found.`);
      }

      const extName = path.extname(chapterToProcess.archivesPath);
      const rawName = this.fileManager.sanitizeFilename(chapterToProcess.name);
      const chapSafe = rawName.replaceAll('.', '_');
      const chapterOut = path.join(this.comicsImages, comicData.name, chapSafe);

      if (extName === '.pdf') {
        // imageManager.generatePdf
      } else {
        // imageManager.extract
      }

      chapterToProcess.isDownloaded = 'downloaded';
      chapterToProcess.chapterPath = chapterOut;
      comicData.metadata.lastDownload = chapterToProcess.id;
      await this.storageManager.updateSerieData(comicData);

      return true;
    } catch (e) {
      console.error('Falha em criar edicao: ', e);
      return false;
    }
  }

  public async uploadChapters(
    filesPath: string[],
    dataPath: string,
  ): Promise<ComicEdition[]> {
    try {
      // Reescrever para buscar por id
      const serieData = await this.storageManager.readSerieData(dataPath);

      if (!serieData.chapters) {
        throw new Error('Dados do capítulo não encontrandos.');
      }

      const updatedChapters = await this.processChapter(
        filesPath,
        serieData.chapters,
      );

      serieData.chapters = updatedChapters;
      serieData.totalChapters = updatedChapters.length;
      await this.storageManager.updateSerieData(serieData);

      // EncodeChapter vai virar uma função inteiramente do ImageManager

      return [];
      // return encodeChapter || []
    } catch (e) {
      console.log('Falha em criar novos capítulos: ', e);
      return [];
    }
  }

  private async processChapter(
    filesPath: string[],
    chapters: ComicEdition[],
  ): Promise<ComicEdition[]> {
    const chapterMap = new Map(chapters.map((ch) => [ch.archivesPath, ch]));
    const existingPaths = chapters.map((ch) => ch.archivesPath);
    const allPaths = [...existingPaths, ...filesPath];
    const orderedPaths = await this.fileManager.orderByChapters(allPaths);
    const date = new Date().toISOString();

    const newChapters: ComicEdition[] = await Promise.all(
      orderedPaths.map(async (chapterPath, idx) => {
        const existing = chapterMap.get(chapterPath);

        if (existing) {
          return existing;
        }

        const name = path.basename(chapterPath, path.extname(chapterPath));
        const sanitizedName = this.fileManager.sanitizeFilename(name);
        const emptyEdition = await this.mountEdition(
          chapters[0].serieName,
          chapterPath,
          idx,
        );

        const archivesPath = path.join(
          this.userLibrary,
          chapters[0].serieName,
          path.basename(chapterPath),
        );

        // Movido para o ImageManager
        // const [outputPath, coverImage] = await this.processCoverImage(
        //   chapterPath,
        //   chapters[0].serieName,
        //   name,
        // );

        await fse.move(chapterPath, archivesPath);

        return {
          ...emptyEdition,
          sanitizedName,
          archivesPath: archivesPath,
          chapterPath: path.join(this.dinamicImages, chapters[0].serieName),
        };
      }),
    );

    return newChapters;
  }

  private async searchSubDir(archivePath: string) {
    try {
      const entries = await fse.readdir(archivePath, { withFileTypes: true });
      const directories: string[] = [];
      const dirEntries = entries.filter((e) => e.isDirectory());
      const dirPaths = dirEntries.map((e) => path.join(archivePath, e.name));
      const subDirsArrays = await Promise.all(
        dirPaths.map((dir) => this.searchSubDir(dir)),
      );
      for (const dir of dirPaths) directories.push(dir);
      for (const subDirs of subDirsArrays) directories.push(...subDirs);
      return directories;
    } catch (e) {
      console.error(`Falha em encontrar sub diretórios em ${archivePath}`, e);
      throw e;
    }
  }

  private async searchComics(archivePath: string): Promise<string[]> {
    const subDir = await this.searchSubDir(archivePath);
    const directories = [archivePath, ...subDir];

    const comicsPathsArrays = await Promise.all(
      directories.map(async (dir) =>
        (await fse.readdir(dir, { withFileTypes: true }))
          .filter((e) => e.isFile())
          .map((e) => path.join(dir, e.name)),
      ),
    );

    return comicsPathsArrays.flat();
  }

  private mountEdition(
    serieName: string,
    orderPath: string,
    idx: number,
  ): ComicEdition {
    const createdAt = new Date().toISOString();
    const fileName = path.basename(orderPath);
    const rawName = fileName.replace('#', '');
    const safeName = this.fileManager.sanitizeFilename(
      this.fileManager.shortenName(rawName),
    );

    return {
      id: idx + 1,
      serieName: serieName,
      name: path.basename(fileName, path.extname(fileName)),
      coverImage: '',
      sanitizedName: path.basename(safeName, path.extname(safeName)),
      archivesPath: path.join(this.userLibrary, serieName, fileName),
      chapterPath: '',
      createdAt: createdAt,
      isRead: false,
      isDownloaded: 'not_downloaded' as
        | 'not_downloaded'
        | 'downloading'
        | 'downloaded',
      page: {
        lastPageRead: 0,
        favoritePage: 0,
      },
    };
  }

  private mountComic(serie: unComic): Comic {
    return {
      id: serie.nextId,
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
      totalChapters: serie.totalChapters.length,
      genre: serie.genre,
      author: serie.author,
      language: serie.language,
      literatureForm: serie.literatureForm,
      chaptersRead: 0,
      readingData: { lastChapterId: 1, lastReadAt: '' },
      chapters: [],
      childSeries: serie.childSeries,
      metadata: {
        status: serie.readingStatus,
        collections: serie.collections,
        recommendedBy: '',
        originalOwner: '',
        lastDownload: 0,
        rating: 0,
        isFavorite: serie.collections.includes('Favoritos'),
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

  private async mountChilds(
    nextId: number,
    archivePath: string,
  ): Promise<ComicTieIn[]> {
    const subDir = await this.searchSubDir(archivePath);

    let childSeries: ComicTieIn[] = [];

    if (subDir.length !== 0) {
      childSeries = await Promise.all(
        subDir.map(
          async (sd, idx) =>
            await this.tieInManager.createChildSeries(
              archivePath,
              sd,
              idx,
              nextId,
            ),
        ),
      );
    }

    return childSeries;
  }
}

//   public async createComicSerie(serie: SerieForm): Promise<void> {
//     await this.storageManager.writeSerieData(comicData);
//     await this.fileManager.localUpload(serie.oldPath, comicData.archivesPath);
//   }
