import { FileSystem } from "./abstract/FileSystem";
import { Manga } from "../types/manga.interfaces";
import { Book } from "../types/book.interfaces";
import { Comic } from "../types/comic.interfaces";
import path from "path";
import fse from 'fs-extra'

export default class FileManager extends FileSystem {
  constructor() {
    super();
  }

  public sanitizeFilename(fileName: string): string {
    return fileName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^-+|-+$/g, "")
      .replace(/\.{2,}/g, ".");
  }

  public extractSerieInfo(fileName: string): { volume: number; chapter: number } {
    const regex = /Vol\.\s*(\d+)|Ch\.\s*(\d+(\.\d+)?)|Chapter\s*(\d+(\.\d+)?)|Capítulo\s*(\d+(\.\d+)?)/gi;
    const matches = [...fileName.matchAll(regex)];

    let volume = 0;
    let chapter = 0;

    matches.forEach((match) => {
      if (match[1]) {
        volume = parseInt(match[1], 10); // Extrai o volume
      }
      if (match[2] || match[4] || match[6]) {
        const chapterValue = match[2] || match[4] || match[6];
        const chapterNumber = parseFloat(chapterValue); // Extrai o capítulo
        chapter = chapterNumber;
      }
    });

    return { volume, chapter };
  }


  public async orderByChapters(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const fileName = path.basename(file);
        const { volume, chapter } = this.extractSerieInfo(fileName);

        return {
          filePath: file,
          volume: volume ? Number(volume) : 0,
          chapter: chapter ? Number(chapter) : 0,
        };
      })
    );

    fileDetails.sort((a, b) => a.chapter - b.chapter);

    const orderedPaths = fileDetails.map((fileDetail) => fileDetail.filePath);
    return orderedPaths;
  }

  public async localUpload(file: string): Promise<string> {
    try {
      const destPath = path.join(this.seriesPath, path.basename(file));
      await fse.move(file, destPath);
      return destPath;
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo: ${error.message}`);
      throw error;
    }
  }

  public async uploadCover(file: string): Promise<string> {
    try {
      const destPath = path.join(this.showcaseImages, path.basename(file))
      await fse.move(file, destPath)
      return destPath
    } catch (e) {
      console.error(`Erro ao fazer upload de imagem: ${e}`)
      throw e
    }
  }


  public async uploadImage(file: string): Promise<string> {
    try {
      const destPath = path.join(this.imagesFilesPath, path.basename(file))
      await fse.move(file, destPath)
      return destPath
    } catch (e) {
      console.error(`Erro ao fazer upload de imagem: ${e}`)
      throw e
    }
  }


  public async getDataPaths(): Promise<string[]> {
    try {
      const directories = [this.booksData, this.comicsData, this.mangasData];

      const contentPromises = directories.map(async (dir) => {
        const items = await fse.readdir(dir, { withFileTypes: true });
        return items.map((item) => path.join(dir, item.name));
      });

      const contentArrays = await Promise.all(contentPromises);
      return contentArrays.flat();
    } catch (e) {
      console.error(`Erro ao obter séries: ${e}`);
      throw e;
    }
  }

  public async getDataPath(serieName: string): Promise<string> {
    try {
      const directories = [this.booksData, this.comicsData, this.mangasData];

      const contentPromises = await directories.map(async (dir) => {
        const items = await fse.readdir(dir, { withFileTypes: true });
        return items.map((item) => path.join(dir, item.name));
      })

      const contentArrays = (await Promise.all(contentPromises)).flat()

      const dataPath = contentArrays.find((contentPath) => path.basename(contentPath, path.extname(contentPath)) === serieName)

      return dataPath
    } catch (e) {
      console.error(`Erro ao obter série: ${e}`)
      console.error
    }
  }

}

// (async () => {
//   try {
//     const comicManager = new FileManager()
//     console.log(await comicManager.getDataPath("Spy x Family"))
//     // const paths = await comicManager.getSeries()
//     // console.log(await comicManager.orderByChapters(['C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\user library\\books\\SPY×FAMILY\\Potrinho Alegre_Vol.1 Ch.1 - Missão 01.cbz', 'C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\user library\\books\\SPY×FAMILY\\TQ Scans & Space Celestial & Eleven Scanlator_Ch.93 - Missão_ 93.cbz']))
//   } catch (error) {
//     console.error("Erro ao buscar os dados:", error);
//   }
// })();

