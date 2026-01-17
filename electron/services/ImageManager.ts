import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import fse from 'fs-extra';

import LibrarySystem from './abstract/LibrarySystem';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager';

export default class ImageManager extends LibrarySystem {
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly fileManager: FileManager = new FileManager();

  public async normalizeImage(
    imagePath: string,
    finalPath: string,
  ): Promise<string> {
    const normalizedPath = path.resolve(imagePath);
    const parse = path.parse(imagePath);

    if (parse.ext === '.xml') {
      return imagePath;
    }

    // Acho que HOJE eu faço o processamento da capa duas vezes
    // Isso é algo que tem que ser averiguado
    if (parse.ext === '.webp' && parse.dir === this.showcaseImages) {
      return normalizedPath;
    }

    if (!this.isImage(normalizedPath)) {
      throw new Error(`Formato de imagem não suportado: ${normalizedPath}`);
    }

    let imageInstance: sharp.Sharp | null = null;

    try {
      sharp.cache(false);

      const destPath = this.fileManager.buildSafePath(
        finalPath,
        parse.name,
        '.webp',
      );

      if (await fse.pathExists(destPath)) {
        return destPath;
      }

      if (parse.ext === '.webp') {
        return normalizedPath;
      }

      imageInstance = sharp(normalizedPath);
      await imageInstance.webp({ quality: 85 }).toFile(destPath);
      return destPath;
    } catch (e) {
      console.error(`Erro ao validar formato da imagem ${imagePath}:`, e);
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

    if (!this.isImage(normalizedPath)) {
      throw new Error(`Formato de imagem não suportado: ${normalizedPath}`);
    }

    if (parse.ext === '.webp') {
      return normalizedPath;
    }

    let imageInstance: sharp.Sharp | null = null;

    try {
      const finalPath = this.fileManager.buildSafePath(
        this.dinamicImages,
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

  public async normalizeChapter(dirPath: string): Promise<void> {
    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true });

      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((d) => path.join(dirPath, d.name));

      const files = entries
        .filter((e) => !e.isDirectory())
        .map((f) => path.join(dirPath, f.name));

      await Promise.all(
        dirs.map((d) => this.storageManager.fixComicDir(d, dirPath)),
      );

      await Promise.all(
        files.map((entryPath) => this.normalizeImage(entryPath, dirPath)),
      );

      await this.clearChapter(dirPath);
    } catch (e) {
      console.error(`Falha em normalizar diretório: ${e}`);
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
      return type.mime === 'image/jpeg' || type.mime === 'image/png';
    } catch {
      return false;
    }
  }

  public async generateCover(
    imagePath: string,
    outputPath: string,
  ): Promise<string> {
    let resultCover: string = '';
    const ext = path.extname(imagePath);

    try {
      if (ext === '.pdf') {
        resultCover = await this.storageManager.extractCoverFromPdf(
          imagePath,
          outputPath,
        );
      } else {
        resultCover = await this.storageManager.extractCoverWith7zip(
          imagePath,
          outputPath,
        );
      }

      return await this.normalizeCover(resultCover);
    } catch (e) {
      throw new Error('Falha em gerar cover');
    }
  }
}
