import fse from 'fs-extra';
import path from 'path';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';

import LibrarySystem from './abstract/LibrarySystem';

export default class FileManager extends LibrarySystem {
  public async searchChapters(
    archivesPath: string,
  ): Promise<[string[], number]> {
    const entries = await fse.readdir(archivesPath, { withFileTypes: true });
    const dirEntries = entries
      .filter(
        (entry) =>
          entry.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(entry.name),
      )
      .map((entry) => path.join(archivesPath, entry.name));

    if (dirEntries.length === 0) {
      return [[], 0];
    }

    return [dirEntries, dirEntries.length];
  }

  public async singleCountChapter(dir: string): Promise<number> {
    const rawExts = ['.cbz', '.cbr', '.zip', '.rar', '.pdf'];
    const extSet = new Set(
      rawExts.map((e) =>
        e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`,
      ),
    );

    try {
      const entries = await fse.readdir(dir, { withFileTypes: true });
      if (!entries || entries.length === 0) return 0;

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
  }

  public async countChapters(directories: string[]): Promise<number> {
    const concurrency = 8;
    const rawExts = ['.cbz', '.cbr', '.zip', '.rar', '.pdf'];
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

  public async localUpload(oldPath: string, newPath: string): Promise<void> {
    try {
      await fse.move(oldPath, newPath);
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo: ${error}`);
      throw error;
    }
  }

  public async searchDirectories(dirPath: string): Promise<string[]> {
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

  public async findFirstChapter(dir: string): Promise<string> {
    const entries = await fse.readdir(dir, { withFileTypes: true });

    const chapter = entries.find(
      (e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name),
    );

    if (!chapter) return '';

    const firstPath = path.join(dir, chapter?.name);

    return firstPath;
  }

  public async findPath(basePath: string, name: string): Promise<string> {
    const dirPaths = await fse.readdir(basePath, { withFileTypes: true });

    for (const dirent of dirPaths) {
      if (dirent.isDirectory()) {
        if (dirent.name === name) {
          return path.join(basePath, dirent.name);
        } else {
          const foundPath = await this.findPath(
            path.join(basePath, dirent.name),
            name,
          );
          if (foundPath) {
            return foundPath;
          }
        }
      }
    }

    return '';
  }

  public sanitizeFilename(fileName: string): string {
    return fileName
      .replaceAll(/\s+/g, '_')

      .replaceAll(/[<>:"/\\|?*\x00-\x1F#!]/g, '_')
      .replaceAll(/[^a-zA-Z0-9._-]/g, '_')

      .replaceAll(/_{2,}/g, '_')

      .replaceAll(/\.{2,}/g, '.')

      .replaceAll(/^-+|-+$/g, '')

      .replaceAll(/[. ]+$/g, '')
      .replaceAll('#', '');
  }

  public async orderComic(filesPath: string[]): Promise<string[]> {
    const fileDetails = filesPath.map((file, index) => {
      const { volume, chapter } = this.extractComicInfo(
        file,
        path.basename(file),
      );

      return {
        filePath: file,
        volume,
        chapter,
        isSpecial: chapter === 0,
        fsIndex: index,
      };
    });

    fileDetails.sort((a, b) => {
      if (a.isSpecial !== b.isSpecial) {
        return a.isSpecial ? 1 : -1;
      }

      if (!a.isSpecial && !b.isSpecial) {
        if (a.volume !== b.volume) return a.volume - b.volume;
        return a.chapter - b.chapter;
      }

      return a.fsIndex - b.fsIndex;
    });

    return fileDetails.map((d) => d.filePath);
  }

  public buildSafePath(
    dirPath: string,
    originalName: string,
    ext = '.webp',
  ): string {
    const max = 260;
    const min = 6;
    const safeName = this.sanitizeFilename(originalName);
    const resolvedDir = path.resolve(dirPath);

    const staticLength = resolvedDir.length + path.sep.length + ext.length;

    let maxBaseLength = max - staticLength;

    if (maxBaseLength < min) {
      const fallback = randomUUID().slice(0, min);
      return path.join(resolvedDir, fallback + ext);
    }

    const base =
      safeName.length > maxBaseLength
        ? safeName.slice(0, maxBaseLength)
        : safeName;

    let finalPath = path.join(resolvedDir, base + ext);

    if (finalPath.length > max) {
      finalPath = path.join(resolvedDir, randomUUID().slice(0, min) + ext);
    }

    return finalPath;
  }

  // Serve para pegar tods os caminhos de json
  public async getDataPaths(): Promise<string[]> {
    try {
      const directories = [this.comicsData, this.mangasData];

      const contentArrays = await Promise.all(
        directories.map(async (dir) =>
          (await fse.readdir(dir, { withFileTypes: true })).map((item) =>
            path.join(dir, item.name),
          ),
        ),
      );

      return contentArrays.flat();
    } catch (e) {
      console.error(`Erro ao obter séries: ${e}`);
      throw e;
    }
  }

  public async ensureSafeSourcePath(originalPath: string): Promise<string> {
    const max = 240;
    if (originalPath.length < max) {
      return originalPath;
    }

    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const shortName = `${randomUUID().slice(0, 8)}${ext}`;
    const safePath = path.join(dir, shortName);

    await fse.move(originalPath, safePath, { overwrite: true });

    return safePath;
  }

  // Recursivo
  public async getAllFiles(dir: string): Promise<string[]> {
    const entries = await fse.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return await this.getAllFiles(fullPath);
        } else {
          return fullPath;
        }
      }),
    );
    return files.flat();
  }

  public findFirstCoverFile(fileNames: string[]): string | null {
    const imageExtensionRegex = /\.(jpg|jpeg|png|gif|webp)$/i;

    const zerosOnlyCandidates: string[] = [];
    const zeroThenOneCandidates: string[] = [];
    const namedCoverCandidates: string[] = [];
    const fallbackCandidates: string[] = [];
    const allWithNumbers: { name: string; num: number }[] = [];

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
      const numericValue = parseInt(digits, 10);
      allWithNumbers.push({ name, num: numericValue });

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

    if (allWithNumbers.length > 0) {
      const smallest = allWithNumbers.reduce((min, curr) =>
        curr.num < min.num ? curr : min,
      );
      console.log(
        `⚠️ Nenhum critério específico bateu, usando menor número como fallback: ${smallest.name} (número: ${smallest.num})`,
      );
      return smallest.name;
    }

    return null;
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

    const specialKeywords =
      /(giant[\s\-]?size|annual|special|one[\s\-]?shot|extra)/i;

    if (!specialKeywords.test(normName)) {
      m = normName.match(/\b(\d{1,4})(?!\.\d)/);
      if (m) {
        chapter = parseInt(m[1], 10);
      }
    }

    return { volume, chapter };
  }
}
