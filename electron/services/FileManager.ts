import fse from 'fs-extra';
import path, { parse } from 'path';
import iconv from 'iconv-lite';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';

import LibrarySystem from './abstract/LibrarySystem';
import { Literatures } from '../types/electron-auxiliar.interfaces';

enum ComicCategory {
  NORMAL = 0,
  SPECIAL = 1,
  EXTRA = 2,
}

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

  public async localUpload(
    serieData: Literatures,
    oldPath: string,
  ): Promise<void> {
    try {
      if (!serieData.chapters) return;

      await fse.move(oldPath, serieData.archivesPath);

      serieData.chapters = serieData.chapters.map((c) => {
        const fileName = path.basename(c.archivesPath);

        return {
          ...c,
          archivesPath: path.join(this.userLibrary, c.serieName, fileName),
        };
      });
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
      .replaceAll('#', '')
      .replace('.pdf', '')
      .trim();
  }

  public sanitizeDirName(dirName: string) {
    return this.sanitizeFilename(dirName).replaceAll('.', '_').trim();
  }

  public async ensurSourcePath(originalPath: string): Promise<string> {
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

  public sanitizeImageName(name: string): string {
    return this.sanitizeFilename(name)
      .slice(0, 15)
      .concat(`_${randomUUID().slice(0, 3)}`);
  }

  public async normalizeEncoding(originalPath: string): Promise<string> {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);

    let fixedName = base;

    try {
      const buffer = Buffer.from(base, 'binary');
      const utf8 = iconv.decode(buffer, 'latin1');

      if (utf8 && utf8 !== base) {
        fixedName = utf8;
      }
    } catch {}

    fixedName = fixedName.normalize('NFKD');

    fixedName = fixedName.replace(/[\u0300-\u036f]/g, '');

    fixedName = fixedName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

    fixedName = fixedName.replace(/\s+/g, ' ').replace(/_+/g, '_').trim();

    if (fixedName === base) {
      return originalPath;
    }

    const newPath = path.join(dir, fixedName + ext);

    if (await fse.pathExists(newPath)) {
      return newPath;
    }

    await fse.move(originalPath, newPath, { overwrite: false });

    return newPath;
  }

  public buildImagePath(
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

  private extractPageIndex(filename: string): string | null {
    const match = filename.match(/-(\d{3,4})(?=\.[^.]+$)/);
    return match ? match[1] : null;
  }

  public async normalizePath(filePath: string): Promise<string> {
    const safePath = await this.normalizeEncoding(filePath);

    const resolved = path.resolve(safePath);
    const parsed = path.parse(resolved);

    const safeName = this.sanitizeImageName(parsed.name);
    const index = this.extractPageIndex(parsed.base) ?? '000';
    const newName = `${index}_${safeName}`;

    const finalPath = path.join(parsed.dir, newName + parsed.ext);

    if (resolved === finalPath) {
      return finalPath;
    }

    if (!(await fse.pathExists(resolved))) {
      throw new Error(`Arquivo não existe após normalização: ${resolved}`);
    }

    if (await fse.pathExists(finalPath)) {
      return finalPath;
    }

    await fse.move(resolved, finalPath, { overwrite: false });

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

  public buildChapterPath(
    baseDir: string,
    serieName: string,
    chapterName: string,
  ): string {
    const max = 260;
    const min = 8;
    const safeSerie = this.sanitizeFilename(serieName);
    const safeChapter = this.sanitizeFilename(chapterName);

    const resolvedBase = path.resolve(baseDir);

    const staticLength = resolvedBase.length + path.sep.length * 2;

    let remaining = max - staticLength;

    if (remaining <= min * 2) {
      const s = randomUUID().slice(0, min);
      const c = randomUUID().slice(0, min);
      return path.join(resolvedBase, s, c);
    }

    const maxSerieLen = Math.floor(remaining * 0.4);
    const maxChapterLen = remaining - maxSerieLen;

    const finalSerie =
      safeSerie.length > maxSerieLen
        ? safeSerie.slice(0, maxSerieLen)
        : safeSerie;

    const finalChapter =
      safeChapter.length > maxChapterLen
        ? safeChapter.slice(0, maxChapterLen)
        : safeChapter;

    let finalPath = path.join(resolvedBase, finalSerie, finalChapter);

    if (finalPath.length > max) {
      finalPath = path.join(
        resolvedBase,
        randomUUID().slice(0, min),
        randomUUID().slice(0, min),
      );
    }

    return finalPath;
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

  public sortPage(a: string, b: string): number {
    const getIndex = (p: string) => {
      const m = p.match(/-(\d+)\.\w+$/);
      return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
    };

    return getIndex(a) - getIndex(b);
  }

  public async searchImages(imagesPath: string): Promise<string[]> {
    const chapterDirents = await fse.readdir(imagesPath, {
      withFileTypes: true,
    });

    const imageFiles = chapterDirents
      .filter(
        (dirent) =>
          dirent.isFile() && /\.(jpeg|png|webp|tiff|jpg)$/i.test(dirent.name),
      )
      .map((dirent) => path.join(imagesPath, dirent.name));

    if (imageFiles.length === 0) {
      throw new Error('Nenhuma imagem encontrada no capítulo.');
    }

    return imageFiles;
  }

  public async getDataPath(serieName: string): Promise<string> {
    const directories = [
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
  public async moveChapter(from: string, to: string) {
    await fse.move(from, to);
  }

  public async orderManga(filesPath: string[]): Promise<string[]> {
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

  public async orderComic(filesPath: string[]): Promise<string[]> {
    const items = filesPath.map((file, index) => {
      const info = this.extractComicInfo(file);
      return { ...info, filePath: file, fsIndex: index };
    });

    items.sort((a, b) => {
      if (a.readingIndex !== b.readingIndex)
        return a.readingIndex - b.readingIndex;

      if (a.partIndex !== b.partIndex) return a.partIndex - b.partIndex;

      if (a.issueNumber !== b.issueNumber) return a.issueNumber - b.issueNumber;

      if (a.category !== b.category) return a.category - b.category;

      return a.fsIndex - b.fsIndex;
    });

    return items.map((i) => i.filePath);
  }

  private extractComicInfo(fullPath: string): {
    readingIndex: number;
    partIndex: number;
    issueNumber: number;
    category: ComicCategory;
  } {
    const fileName = path.basename(fullPath);
    const norm = fileName
      .replace(/[_+.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // 1️⃣ número de leitura no início
    let readingIndex = 9999;
    const lead = norm.match(/^(\d{1,3})\b/);
    if (lead) readingIndex = parseInt(lead[1], 10);

    // 2️⃣ parte interna (01.de.04)
    let partIndex = 0;
    const part = norm.match(/\b(\d{1,3})\s*de\s*(\d{1,3})\b/);
    if (part) partIndex = parseInt(part[1], 10);

    // 3️⃣ número da edição
    let issueNumber = 0;

    // #083, #10
    const hash = norm.match(/#\s*(\d+)/);
    if (hash) issueNumber = parseInt(hash[1], 10);

    // Hulk 084
    if (!issueNumber) {
      const plain = norm.match(/\b(\d{2,4})\b/);
      if (plain) issueNumber = parseInt(plain[1], 10);
    }

    // v3 #12
    const volumeIssue = norm.match(/v\d+\s*(\d+)/);
    if (volumeIssue) issueNumber = parseInt(volumeIssue[1], 10);

    // 4️⃣ categoria
    let category = ComicCategory.NORMAL;

    if (/(annual|one shot|edição especial|special)/i.test(norm)) {
      category = ComicCategory.SPECIAL;
    }

    if (/(sketch|esboç|guia|handbook)/i.test(norm)) {
      category = ComicCategory.EXTRA;
    }

    return {
      readingIndex,
      partIndex,
      issueNumber,
      category,
    };
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
}
