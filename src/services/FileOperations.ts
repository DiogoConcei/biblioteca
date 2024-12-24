import { FileSystem } from "./abstract/FileSystem";
import { ComicChapter } from "../types/serie.interfaces";
import path from "path";
import fs from "fs/promises";
import fse from 'fs-extra'

export default class FileOperations extends FileSystem {
  constructor() {
    super();
  }

  // private createBaseFolders() {
  //   this.createFolder(this.seriesPath);
  //   this.createFolder(this.showcaseImages);
  //   this.createFolder(this.jsonFilesPath);
  // }

  public async encodeImageToBase64(filePath: string): Promise<string> {
    try {
      const fileData = await fs.readFile(filePath);
      return fileData.toString('base64');
    } catch (error) {
      throw new Error(`Erro ao converter o arquivo para Base64: ${error.message}`);
    }
  }

  public sanitizeFilename(fileName: string): string {
    return fileName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^-+|-+$/g, "")
      .replace(/\.{2,}/g, ".");
  }

  public async orderByDefault(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const filePath = file;
        const name = path.basename(file);
        const stat = await fs.stat(file);
        const mtime = stat.mtime.getTime();

        return {
          name: name,
          filePath: filePath,
          mtime: mtime,
        };
      })
    );

    fileDetails.sort((a, b) => {
      if (a.mtime === b.mtime) {
        return a.name.localeCompare(b.name);
      }
      return a.mtime - b.mtime;
    });

    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public async orderByName(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const filePath = file;
        const name = path.basename(file);

        return {
          name: name,
          filePath: filePath,
        };
      })
    );

    fileDetails.sort((a, b) => a.name.localeCompare(b.name));

    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public async orderBySize(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const filePath = file;
        const stat = await fs.stat(file);
        const size = stat.size;

        return {
          filePath: filePath,
          size: size,
        };
      })
    );

    fileDetails.sort((a, b) => a.size - b.size);
    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public extractSerieInfo(fileName: string) {
    const regex =
      /(?:Vol\.\s*(\d+))?.*?(?:Ch\.\s*(\d+))?.*?(?:Capítulo\s*(\d+))?.*?(?:Chapter\s*(\d+))?.*/i;
    const match = fileName.match(regex);

    if (match) {

      const volume = match[1] ? parseInt(match[1]) : null;
      const chapter = match[2] ? parseInt(match[2]) : null;
      const capítulo = match[3] ? parseInt(match[3]) : null;
      const chapterLabel = match[4] ? parseInt(match[4]) : null;

      const chapterNumber = chapter || chapterLabel || capítulo;

      return { volume, chapterNumber };
    }
    return { volume: null, chapterNumber: null };
  }

  public async orderByChapters(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const filePath = file;
        const fileName = path.basename(file);

        const { volume, chapterNumber } = this.extractSerieInfo(fileName);

        return {
          filePath,
          volume,
          chapterNumber,
        };
      })
    );

    fileDetails.sort((a, b) => {
      if (a.volume !== b.volume) {
        return a.volume - b.volume;
      }
      return a.chapterNumber - b.chapterNumber;
    });

    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public checkOrder(chapters: ComicChapter[]): ComicChapter[] {
    const extractChapterNumber = (name: string): number | null => {
      const regex = /(?:Ch\.|Cap_tulo|Chapter)_(\d+)/i;
      const match = name.match(regex);
      return match ? parseInt(match[1], 10) : null;
    };

    const isOrdered = chapters.every((chapter) => {
      const chapterNumber = extractChapterNumber(
        chapter.sanitized_name
      );
      return chapterNumber !== null && chapter.id === chapterNumber;
    });

    if (isOrdered) {
      return chapters;
    }

    const reorderedChapters = [...chapters].sort((a, b) => {
      const chapterNumberA =
        extractChapterNumber(a.sanitized_name) ?? 0;
      const chapterNumberB =
        extractChapterNumber(b.sanitized_name) ?? 0;
      return chapterNumberA - chapterNumberB;
    });

    reorderedChapters.forEach((chapter, index) => {
      chapter.id = index + 1;
    });

    return reorderedChapters;
  }

  public async localUpload(file: string): Promise<string> {
    try {
      const destPath = path.join(this.seriesPath, path.basename(file));

      if (await fse.pathExists(destPath)) {
        const newDestPath = path.join(this.seriesPath, `${path.basename(file)}_new`);
        await fse.move(file, newDestPath);
        return newDestPath;
      } else {
        await fse.move(file, destPath);
        return destPath;
      }
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo: ${error.message}`);
      throw error;
    }
  }

  // found jsonfile 

  // found cover

  // check cover

  // check jsonfile

  // found chapters pages
}

