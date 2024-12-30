import { FileSystem } from "./abstract/FileSystem";
import { ComicChapter } from "../types/serie.interfaces";
import path from "path";
import fs from "fs/promises";
import fse from 'fs-extra'

export default class FileOperations extends FileSystem {
  constructor() {
    super();
  }

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


  public extractSerieInfo(fileName: string) {
    const regex =
      /(?:Vol\.\s*(\d+))?.*?(?:Ch\.\s*(\d+))?.*?(?:Capítulo\s*(\d+))?.*?(?:Chapter\s*(\d+))?.*?(\d+)/i;
    const match = fileName.match(regex);

    if (match) {
      const volume = match[1] ? parseInt(match[1]) : null;
      const chapter =
        match[2] || match[3] || match[4] || match[5]
          ? parseInt(match[2] || match[3] || match[4] || match[5])
          : null;

      return { volume, chapter };
    }
    return { volume: null, chapter: null };
  }

  public async orderByChapters(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const fileName = path.basename(file);
        const { volume, chapter } = this.extractSerieInfo(fileName);

        return {
          filePath: file,
          volume: volume ?? 0, chapter: chapter ?? 0,
        };
      })
    );

    fileDetails.sort((a, b) => {
      if (a.volume !== b.volume) {
        return a.volume - b.volume;
      }
      return a.chapter - b.chapter;
    });

    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public async orderByName(filesPath: string[]): Promise<string[]> {
    return filesPath.sort((a, b) =>
      path.basename(a).localeCompare(path.basename(b))
    );
  }

  public async orderByDefault(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const stat = await fs.stat(file);
        return {
          filePath: file,
          mtime: stat.mtime.getTime(),
        };
      })
    );

    fileDetails.sort((a, b) => a.mtime - b.mtime);

    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public async orderBySize(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const stat = await fs.stat(file);
        return {
          filePath: file,
          size: stat.size,
        };
      })
    );

    fileDetails.sort((a, b) => a.size - b.size);

    return fileDetails.map((fileDetail) => fileDetail.filePath);
  }

  public checkOrder(chapters: ComicChapter[]): ComicChapter[] {
    const extractChapterNumber = (name: string): number | null => {
      const regex = /(?:Ch\.|Capítulo|Chapter|Vol\.)\s*(\d+)/i;
      const match = name.match(regex);
      return match ? parseInt(match[1], 10) : null;
    };

    const reorderedChapters = [...chapters].sort((a, b) => {
      const chapterA = extractChapterNumber(a.sanitized_name) ?? 0;
      const chapterB = extractChapterNumber(b.sanitized_name) ?? 0;
      return chapterA - chapterB;
    });

    reorderedChapters.forEach((chapter, index) => {
      chapter.id = index + 1;
    });

    return reorderedChapters;
  }


  public async ensureCorrectOrder(
    chapters: ComicChapter[]
  ): Promise<ComicChapter[]> {
    // Extrai o número do capítulo de um nome
    const extractChapterNumber = (name: string): number | null => {
      const regex = /(?:Ch\.|Capítulo|Chapter|Vol\.)\s*(\d+)/i;
      const match = name.match(regex);
      return match ? parseInt(match[1], 10) : null;
    };

    // Verifica se os capítulos estão ordenados corretamente
    const isOrdered = chapters.every((chapter, index, arr) => {
      if (index === 0) return true; // O primeiro capítulo não precisa ser comparado
      const prevChapterNumber = extractChapterNumber(arr[index - 1].sanitized_name) ?? 0;
      const currentChapterNumber = extractChapterNumber(chapter.sanitized_name) ?? 0;
      return prevChapterNumber < currentChapterNumber;
    });

    if (isOrdered) {
      return chapters; // Retorna os capítulos, se já estiverem ordenados
    }

    // Caso não estejam ordenados, corrige a ordem
    const reorderedChapters = [...chapters].sort((a, b) => {
      const chapterNumberA = extractChapterNumber(a.sanitized_name) ?? 0;
      const chapterNumberB = extractChapterNumber(b.sanitized_name) ?? 0;
      return chapterNumberA - chapterNumberB;
    });

    // Atualiza os IDs dos capítulos após a reordenação
    reorderedChapters.forEach((chapter, index) => {
      chapter.id = index + 1; // Garante IDs sequenciais
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

  public async findJsonFile(serieName: string): Promise<string> {
    try {
      const seriesPath = await this.foundFiles(this.jsonFilesPath)
      const filePath = seriesPath.find((serie) => path.basename(serie, path.extname(serie)) === serieName)

      if (!filePath) {
        console.error(`arquivo inexistente`)
      }

      return filePath
    } catch (error) {
      console.error(`erro ao recuperar arquivo de dados: ${error}`)
    }
  }

  // found cover

  // found chapters pages
}

