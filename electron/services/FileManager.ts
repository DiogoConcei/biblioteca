import FileSystem from './abstract/FileSystem.ts';
import path from 'path';
import fse from 'fs-extra';

export default class FileManager extends FileSystem {
  constructor() {
    super();
  }

  public sanitizeFilename(fileName: string): string {
    return fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^-+|-+$/g, '')
      .replace(/\.{2,}/g, '.');
  }

  public async orderComic(filesPath: string[]): Promise<string[]> {
    const fileDetails = await Promise.all(
      filesPath.map(async (file) => {
        const { volume, chapter } = this.extractComicInfo(
          file,
          path.basename(file),
        );

        return { filePath: file, volume, chapter };
      }),
    );

    fileDetails.sort((a, b) => {
      if (a.volume !== b.volume) return a.volume - b.volume;
      return a.chapter - b.chapter;
    });

    return fileDetails.map((d) => d.filePath);
  }

  private extractComicInfo(
    fullPath: string,
    fileName: string,
  ): { volume: number; chapter: number } {
    let volume = 0;
    let chapter = 0;

    const normFull = fullPath.replace(/[_\-]/g, ' ').replace(/\s+/g, ' ');
    const volM = normFull.match(/\b(?:v|vol\.?)\s*(\d+)/i);
    if (volM) {
      volume = parseInt(volM[1], 10);
    }

    const normName = fileName
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (/\(\s*[a-d]\d+\s*\)/i.test(normName)) {
      return { volume, chapter: Number.MAX_SAFE_INTEGER };
    }

    let m: RegExpMatchArray | null;

    m = normName.match(/\(\s*(\d+(?:\.\d+)?)([a-d])?\s*\)/i);
    if (m) {
      const num = parseFloat(m[1]);
      const suf = m[2]?.toLowerCase();
      chapter = suf
        ? parseFloat((num + (suf.charCodeAt(0) - 96) / 10).toFixed(1))
        : num;
      return { volume, chapter };
    }

    m = normName.match(/\b(\d+)([a-d])\b/i);
    if (m) {
      const num = parseInt(m[1], 10);
      const suf = m[2].toLowerCase();
      chapter = parseFloat((num + (suf.charCodeAt(0) - 96) / 10).toFixed(1));
      return { volume, chapter };
    }

    m =
      normName.match(/\bch(?:apter)?\.?\s*(\d+(\.\d+)?)/i) ||
      normName.match(/\bcap(?:ítulo)?\.?\s*(\d+(\.\d+)?)/i);
    if (m) {
      chapter = parseFloat(m[1]);
      return { volume, chapter };
    }

    m = normName.match(/#\s*(\d+(\.\d+)?)/);
    if (m) {
      chapter = parseFloat(m[1]);
      return { volume, chapter };
    }

    m = normName.match(/\b(\d{1,4})(?!\.\d)/);
    if (m) {
      chapter = parseInt(m[1], 10);
    }

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
      }),
    );

    fileDetails.sort((a, b) => a.chapter - b.chapter);

    const orderedPaths = fileDetails.map((fileDetail) => fileDetail.filePath);
    return orderedPaths;
  }

  private extractSerieInfo(fileName: string): {
    volume: number;
    chapter: number;
  } {
    const regex =
      /Vol\.\s*(\d+)|Ch\.\s*(\d+(\.\d+)?)|Chapter\s*(\d+(\.\d+)?)|Capítulo\s*(\d+(\.\d+)?)/gi;
    const matches = [...fileName.matchAll(regex)];

    let volume = 0;
    let chapter = 0;

    matches.forEach((match) => {
      if (match[1]) {
        volume = parseInt(match[1], 10);
      }
      if (match[2] || match[4] || match[6]) {
        const chapterValue = match[2] || match[4] || match[6];
        const chapterNumber = parseFloat(chapterValue);
        chapter = chapterNumber;
      }
    });

    return { volume, chapter };
  }

  public async localUpload(oldPath: string, newPath: string): Promise<void> {
    try {
      await fse.move(oldPath, newPath);
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo: ${error}`);
      throw error;
    }
  }

  public async uploadCover(oldPath: string, newPath: string): Promise<void> {
    try {
      await fse.move(oldPath, newPath);
    } catch (e) {
      console.error(`Erro ao fazer upload de imagem: ${e}`);
      throw e;
    }
  }

  public async getAllFilesRecursively(dir: string): Promise<string[]> {
    const entries = await fse.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return await this.getAllFilesRecursively(fullPath);
        } else {
          return fullPath;
        }
      }),
    );
    return files.flat();
  }

  public async uploadImage(file: string): Promise<string> {
    try {
      const destPath = path.join(
        this.imagesFolder,
        'dinamicImages',
        path.basename(file),
      );
      await fse.move(file, destPath);
      return destPath;
    } catch (e) {
      console.error(`Erro ao fazer upload de imagem: ${e}`);
      throw e;
    }
  }

  public async getDataPaths(): Promise<string[]> {
    try {
      const directories = [this.booksData, this.comicsData, this.mangasData];

      const contentArrays = await Promise.all(
        directories.map(async (dir) =>
          (
            await fse.readdir(dir, { withFileTypes: true })
          ).map((item) => path.join(dir, item.name)),
        ),
      );

      return contentArrays.flat();
    } catch (e) {
      console.error(`Erro ao obter séries: ${e}`);
      throw e;
    }
  }

  public async getDataPath(serieName: string): Promise<string> {
    const directories = [
      this.booksData,
      this.comicsData,
      this.mangasData,
      this.childSeriesData,
    ];

    try {
      const allPaths = (
        await Promise.all(
          directories.map(async (dir) => {
            const items = await fse.readdir(dir, { withFileTypes: true });
            return items.map((item) => path.join(dir, item.name));
          }),
        )
      ).flat();

      return (
        allPaths.find((p) => path.basename(p, path.extname(p)) === serieName) ||
        ''
      );
    } catch (e) {
      console.error(`Erro ao obter série: ${e}`);
      throw e;
    }
  }

  public findFirstCoverFile(fileNames: string[]): string | null {
    const imageExtensionRegex = /\.(jpg|jpeg|png|gif|webp)$/i;

    const zerosOnlyCandidates: string[] = [];
    const zeroThenOneCandidates: string[] = [];
    const namedCoverCandidates: string[] = [];
    const fallbackCandidates: string[] = [];

    const coverKeywords = [
      'cover',
      'front',
      'capa',
      'capa1',
      'page0001',
      'pg0001',
      '01a',
      '01',
      '01b',
      'preview',
    ];

    for (const name of fileNames) {
      if (!imageExtensionRegex.test(name)) continue;

      const baseName = name.replace(imageExtensionRegex, '').toLowerCase();

      if (coverKeywords.some((keyword) => baseName.includes(keyword))) {
        namedCoverCandidates.push(name);
      }

      const lastDigitsMatch = baseName.match(/(\d+)(?!.*\d)/);
      if (!lastDigitsMatch) continue;

      const digits = lastDigitsMatch[1];

      if (/^0+$/.test(digits)) {
        zerosOnlyCandidates.push(name);
      } else if (/^0*1$/.test(digits)) {
        zeroThenOneCandidates.push(name);
      } else if (/^0*2$/.test(digits) || /^0*3$/.test(digits)) {
        fallbackCandidates.push(name);
      }
    }

    if (zerosOnlyCandidates.length > 0) {
      return zerosOnlyCandidates[0];
    }

    if (zeroThenOneCandidates.length > 0) {
      return zeroThenOneCandidates[0];
    }

    if (namedCoverCandidates.length > 0) {
      return namedCoverCandidates[0];
    }

    if (fallbackCandidates.length > 0) {
      return fallbackCandidates[0];
    }

    return null;
  }

  public foundLiteratureForm(dataPath: string): string {
    try {
      const LiteratureForm = path.basename(path.dirname(dataPath));
      return LiteratureForm;
    } catch (e) {
      console.error(
        `Falha em descobrir o tipo da serie: ${path.basename(dataPath)}`,
      );
      throw e;
    }
  }
}
