import fse from 'fs-extra';
import path from 'path';
import pLimit from 'p-limit';

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

  public sanitizeFilename(fileName: string): string {
    return fileName
      .replace(/\s+/g, '_')

      .replace(/[<>:"/\\|?*\x00-\x1F#!]/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_')

      .replace(/_{2,}/g, '_')

      .replace(/\.{2,}/g, '.')

      .replace(/^-+|-+$/g, '')

      .replace(/[. ]+$/g, '')
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
