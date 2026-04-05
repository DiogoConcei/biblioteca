import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import FileManager from './FileManager';
import { ComicEdition } from '../types/comic.interfaces.ts';
import { StorageManager } from './StorageManager';

export default class ImageManager extends LibrarySystem {
  private readonly fileManager: FileManager = new FileManager();
  private _storageManager: StorageManager | null = null;

  private async getStorageManager() {
    if (!this._storageManager) {
      this._storageManager = (await import('./StorageManager')).default;
    }
    return this._storageManager;
  }

  public async normalizeImage(
    imagePath: string,
    finalPath: string,
  ): Promise<string> {
    const sanitizedPath = await this.fileManager.normalizeEncoding(imagePath);
    const normalizedPath = path.resolve(sanitizedPath);
    const parse = path.parse(imagePath);

    if (parse.ext === '.xml') {
      return imagePath;
    }

    if (parse.ext === '.webp' && parse.dir === this.showcaseImages) {
      return normalizedPath;
    }

    if (!(await this.isImage(normalizedPath))) {
      throw new Error(`Formato de imagem não suportado: ${normalizedPath}`);
    }

    let imageInstance: sharp.Sharp | null = null;

    try {
      sharp.cache(false);
      const destPath = this.fileManager.buildImagePath(
        finalPath,
        parse.name,
        '.webp',
      );

      const dir = path.dirname(destPath);
      await fse.ensureDir(dir);

      const isShowcase = finalPath.includes('showcase images');

      if (await fse.pathExists(destPath)) {
        return destPath;
      }

      imageInstance = sharp(normalizedPath);

      if (!(await fse.pathExists(normalizedPath))) {
        throw new Error(`Arquivo de origem não existe: ${normalizedPath}`);
      }

      if (isShowcase) {
        imageInstance.resize(300, null, { withoutEnlargement: true });
      }

      await imageInstance.webp({ quality: 85 }).toFile(destPath);
      return destPath;
    } catch (e) {
      console.error(`Erro ao normalizar formato da imagem ${imagePath}:`, e);
      throw e;
    } finally {
      if (imageInstance) {
        imageInstance.destroy();
      }
    }
  }

  public async uploadBackground(
    imagePath: string | null,
  ): Promise<string | null> {
    if (!imagePath) return null;

    return await this.normalizeImage(imagePath, this.backgroundImages);
  }

  public async normalizeCover(coverPath: string): Promise<string> {
    const normalizedPath = path.resolve(coverPath);
    const parse = path.parse(normalizedPath);

    if (!(await this.isImage(normalizedPath))) {
      throw new Error(`Formato de imagem não suportado: ${normalizedPath}`);
    }

    if (parse.ext === '.webp') {
      return normalizedPath;
    }

    let imageInstance: sharp.Sharp | null = null;

    try {
      const finalPath = this.fileManager.buildImagePath(
        parse.dir,
        parse.name,
        '.webp',
      );

      sharp.cache(false);
      imageInstance = sharp(coverPath);

      await imageInstance.webp({ quality: 85 }).toFile(finalPath);

      await fse.remove(coverPath);

      return finalPath;
    } catch (e) {
      console.error('Erro ao normalizar capa:', e);
      throw e;
    } finally {
      if (imageInstance) {
        imageInstance.destroy();
      }
    }
  }

  public getMediaUrl(absolutePath: string): string {
    if (!absolutePath) return '';
    if (
      absolutePath.startsWith('lib-media://') ||
      absolutePath.startsWith('http')
    ) {
      return absolutePath;
    }
    const encoded = Buffer.from(absolutePath, 'utf-8').toString('base64');
    return `lib-media://local/${encoded}`;
  }

  public async readFileAsDataUrl(rawPath: string): Promise<string> {
    try {
      const buffer = await fse.readFile(rawPath);
      const mimeType = (await this.getMime(rawPath)) || 'image/webp';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (e) {
      console.error('Erro ao ler arquivo como Base64:', e);
      return '';
    }
  }

  public async normalizeChapter(dirPath: string): Promise<void> {
    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true });
      const storageManager = await this.getStorageManager();

      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => path.join(dirPath, e.name));

      for (const dir of dirs) {
        await storageManager.fixComicDir(dir, dirPath);
      }

      const files = await fse.readdir(dirPath, { withFileTypes: true });
      await Promise.all(
        files.map(async (file) => {
          let filePath = path.join(dirPath, file.name);
          if (filePath.length > 240) {
            filePath = await this.fileManager.normalizePath(filePath);
          }

          if (await this.isImage(filePath)) {
            await this.normalizeImage(filePath, dirPath);
          }
        }),
      );

      await this.clearChapter(dirPath);
    } catch (e) {
      console.error(`Falha em normalizar diretorio: ${e}`);
      throw e;
    }
  }

  public async clearChapter(dirChapter: string): Promise<void> {
    try {
      const dirents = await fse.readdir(dirChapter, { withFileTypes: true });
      const imagePattern = /\.(jpeg|png|tiff|jpg)$/i;

      const imageFiles = dirents
        .filter((d) => d.isFile() && imagePattern.test(d.name))
        .map((d) => path.join(dirChapter, d.name));

      await Promise.all(
        imageFiles.map(async (file) => {
          try {
            await fse.remove(file);
          } catch (err) {
            console.error(`Falha ao limpar o arquivo ${file}:`, err);
          }
        }),
      );
    } catch (e) {
      console.error('Falha em limpar os arquivos do capítulo:', e);
    }
  }

  public async isImage(path: string): Promise<boolean> {
    try {
      const buffer = await fse.readFile(path);
      const type = await fileTypeFromBuffer(buffer);
      if (!type) return false;
      return [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/tiff',
        'image/gif',
      ].includes(type.mime);
    } catch {
      return false;
    }
  }

  public async generateCover(
    inputFile: string,
    outputPath: string,
  ): Promise<string> {
    if (!inputFile) return '';
    let resultCover: string = '';
    const ext = path.extname(inputFile);
    const storageManager = await this.getStorageManager();

    try {
      if (ext === '.pdf') {
        resultCover = await storageManager.extractCoverFromPdf(
          inputFile,
          outputPath,
        );
      } else {
        try {
          resultCover = await storageManager.extractCoverWith7zip(
            inputFile,
            outputPath,
          );

          if (!resultCover) {
            throw new Error('Nenhuma capa encontrada');
          }
        } catch (err) {
          console.warn('⚠️ Falha na extração principal:', err);

          await storageManager.cleanupExtractedCover(outputPath);

          resultCover = await storageManager.safeExtract(
            inputFile,
            outputPath,
          );
        }
      }

      const normalized = await this.normalizeCover(resultCover);

      await this.clearChapter(outputPath);

      return normalized;
    } catch (e) {
      console.error('Falha em gerar capas: ', e);
      return '';
    }
  }

  public async encodeImages(
    filePaths: string[],
    useProtocol = true,
  ): Promise<string[]> {
    if (useProtocol) {
      return filePaths.map((filePath) => this.getMediaUrl(filePath));
    }

    return Promise.all(filePaths.map((p) => this.readFileAsDataUrl(p)));
  }

  public async encodeImage(
    filePath: string,
    useProtocol = true,
  ): Promise<string> {
    if (useProtocol) return this.getMediaUrl(filePath);
    return this.readFileAsDataUrl(filePath);
  }

  public async getThumbnailUrl(originalPath: string): Promise<string> {
    if (!originalPath) return '';
    try {
      const parse = path.parse(originalPath);
      const thumbDir = path.join(this.showcaseImages, 'thumbnails');
      await fse.ensureDir(thumbDir);
      
      const thumbPath = path.join(thumbDir, `${parse.name}_thumb.webp`);
      
      if (!(await fse.pathExists(thumbPath))) {
         if (!(await fse.pathExists(originalPath))) {
            return this.getMediaUrl(originalPath);
         }
         await sharp(originalPath)
           .resize(300, null, { withoutEnlargement: true })
           .webp({ quality: 80, effort: 4 })
           .toFile(thumbPath);
      }
      
      return this.getMediaUrl(thumbPath);
    } catch (e) {
      console.error('Erro ao gerar thumbnail:', e);
      return this.getMediaUrl(originalPath);
    }
  }

  public async encodeComic(
    chapters: ComicEdition[],
    useProtocol = true,
  ): Promise<ComicEdition[]> {
    const encoded = await Promise.all(
      chapters.map(async (ch) => {
        if (!ch.coverImage) return ch;
        return {
          ...ch,
          coverImage: useProtocol
            ? this.getMediaUrl(ch.coverImage)
            : await this.readFileAsDataUrl(ch.coverImage),
        };
      }),
    );
    return encoded;
  }

  public async saveNewCover(coverPath: string): Promise<string> {
    const destPath = path.join(this.showcaseImages, path.basename(coverPath));
    return await this.normalizeImage(coverPath, destPath);
  }

  public async processCoverIfNeeded(
    cover: string,
    actualCover: string,
  ): Promise<string> {
    const isBase64 =
      typeof cover === 'string' &&
      cover.startsWith('data:image/') &&
      cover.includes(';base64,');

    if (isBase64) {
      return actualCover;
    }

    return await this.saveNewCover(cover);
  }

  public async isImageHealthy(filePath: string): Promise<boolean> {
    try {
      if (!(await fse.pathExists(filePath))) {
        return false;
      }

      if (!(await this.isImage(filePath))) {
        return false;
      }

      const metadata = await sharp(filePath).metadata();
      return Boolean(metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  private async getMime(filePath: string): Promise<string | null> {
    try {
      const buffer = await fse.readFile(filePath);
      const type = await fileTypeFromBuffer(buffer);

      if (type?.mime?.startsWith('image/')) {
        return type.mime;
      }

      return null;
    } catch {
      return null;
    }
  }

  public async applyFilters(
    filePath: string,
    options: {
      brightness?: number;
      contrast?: number;
      grayscale?: boolean;
      sharpness?: number;
    },
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(filePath);

      if (options.brightness && options.brightness !== 1) {
        pipeline = pipeline.modulate({ brightness: options.brightness });
      }

      if (options.contrast && options.contrast !== 1) {
        const contrast = options.contrast;
        pipeline = pipeline.linear(contrast, -(0.5 * contrast) + 0.5);
      }

      if (options.grayscale) {
        pipeline = pipeline.grayscale();
      }

      if (options.sharpness && options.sharpness > 0) {
        pipeline = pipeline.sharpen(options.sharpness);
      }

      return await pipeline.webp({ quality: 90 }).toBuffer();
    } catch (e) {
      console.error(`Erro ao aplicar filtros na imagem ${filePath}:`, e);
      return await fse.readFile(filePath);
    }
  }
}
