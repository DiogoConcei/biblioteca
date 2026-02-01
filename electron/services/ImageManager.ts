import path from 'path';
import sharp from 'sharp';
import mime from 'mime-types';
import { fileTypeFromBuffer } from 'file-type';
import fse from 'fs-extra';
import LibrarySystem from './abstract/LibrarySystem';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager';
import { ComicEdition } from '../types/comic.interfaces.ts';

export default class ImageManager extends LibrarySystem {
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly fileManager: FileManager = new FileManager();

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

    // Acho que HOJE eu faço o processamento da capa duas vezes
    // Isso é algo que tem que ser averiguado
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
      if (await fse.pathExists(destPath)) {
        return destPath;
      }
      if (parse.ext === '.webp') {
        return normalizedPath;
      }

      imageInstance = sharp(normalizedPath);

      if (!(await fse.pathExists(normalizedPath))) {
        throw new Error(`Arquivo de origem não existe: ${normalizedPath}`);
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
  public async readFileAsDataUrl(rawPath: string): Promise<string> {
    const buf = await fse.promises.readFile(rawPath);
    const mimeType = mime.lookup(rawPath) || 'application/octet-stream';
    return `data:${mimeType};base64,${buf.toString('base64')}`;
  }

  // chapOut === dirPath
  public async normalizeChapter(dirPath: string): Promise<void> {
    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true });

      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => path.join(dirPath, e.name));

      for (const dir of dirs) {
        await this.storageManager.fixComicDir(dir, dirPath);
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

    try {
      if (ext === '.pdf') {
        resultCover = await this.storageManager.extractCoverFromPdf(
          inputFile,
          outputPath,
        );
      } else {
        resultCover = await this.storageManager.extractCoverWith7zip(
          inputFile,
          outputPath,
        );
      }

      return await this.normalizeCover(resultCover);
    } catch (e) {
      console.error('Falha em gerar capas: ', e);
      return '';
    }
  }

  public async encodeImages(filePaths: string[]): Promise<string[]> {
    try {
      const codedImages = await Promise.all(
        filePaths.map(async (filePath) => {
          const buffer = await fse.readFile(filePath);
          const mimeType = await this.getMime(filePath);

          if (!mimeType) {
            throw new Error(`Arquivo não é uma imagem válida: ${filePath}`);
          }

          return `data:${mimeType};base64,${buffer.toString('base64')}`;
        }),
      );

      return codedImages;
    } catch (e) {
      console.error('Falha em codificar as imagens', e);
      return [];
    }
  }

  public async encodeImage(filePath: string): Promise<string> {
    try {
      const buffer = await fse.readFile(filePath);
      const mimeType = await this.getMime(filePath);

      if (!mimeType) {
        throw new Error(`Arquivo não é uma imagem válida: ${filePath}`);
      }

      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (e) {
      console.error('Falha em codificar as imagens', e);
      return '';
    }
  }

  public async encodeComic(chapters: ComicEdition[]): Promise<ComicEdition[]> {
    const encodeChapter = await Promise.all(
      chapters.map(async (ch) => {
        if (!ch.coverImage) return ch;

        const encodeCover = await this.encodeImage(ch.coverImage);

        return {
          ...ch,
          coverImage: encodeCover as string,
        };
      }),
    );

    return encodeChapter;
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
}
