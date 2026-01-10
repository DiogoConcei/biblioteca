import fse from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';
import LibrarySystem from './abstract/LibrarySystem';
import StorageManager from './StorageManager';
import FileManager from './FileManager';

export default class ImageManager extends LibrarySystem {
  private readonly fileManager = new FileManager();
  private readonly storageManager = new StorageManager();

  constructor() {
    super();
  }

  public async readFileAsDataUrl(filePath: string): Promise<string> {
    const buffer = await fse.readFile(filePath);

    const header = buffer.subarray(0, 16);

    const mimeType = this.checkMime(header);

    if (!mimeType) {
      throw new Error('File is not a supported image');
    }

    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  // Impedir de ser usado fora do flox imagePath -> normalize
  public async normalizeImage(
    imagePath: string,
    finalPath: string,
  ): Promise<string> {
    const resolvedPath = path.resolve(imagePath);
    const parsed = path.parse(resolvedPath);
    const imageExt = path.extname(resolvedPath).toLowerCase();

    if (imageExt === '.xml') {
      return resolvedPath;
    }

    if (
      imageExt === '.webp' &&
      path.resolve(path.dirname(resolvedPath)) ===
        path.resolve(this.showcaseImages)
    ) {
      return resolvedPath;
    }

    await this.isFile(resolvedPath);

    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(imageExt)) {
      throw new Error(`Formato de imagem não suportado: ${imagePath}`);
    }

    const destPath = this.fileManager.buildSafeImagePath(
      finalPath,
      parsed.name,
      '.webp',
    );

    if (await fse.pathExists(destPath)) return destPath;

    return await this.convertImage(destPath, resolvedPath);
  }

  public async normalizeCover(
    coverPath: string,
    serieName: string,
  ): Promise<string> {
    const ext = path.extname(coverPath).toLowerCase();

    const imageFilter = /\.(jpe?g|png|webp)$/i;
    if (!imageFilter.test(ext)) {
      throw new Error(`Arquivo não é uma imagem válida: ${coverPath}`);
    }

    const dinamicPath = path.join(this.dinamicImages, serieName);
    await fse.ensureDir(dinamicPath);

    const baseName = path.basename(coverPath, ext);
    const safeName = baseName.replaceAll('.', '_');

    const finalPath = this.fileManager.buildSafeImagePath(
      dinamicPath,
      safeName,
      '.webp',
    );

    if (ext === '.webp') {
      await fse.move(coverPath, finalPath, { overwrite: true });
      return finalPath;
    }

    const result = await this.convertImage(finalPath, coverPath);

    try {
      await fse.remove(coverPath);
    } catch (e) {
      console.warn('Falha ao remover cover original:', coverPath, e);
    }

    return result;
  }

  public async normalizeChapter(dirPath: string): Promise<void> {
    await this.isDir(dirPath);

    const entries = await fse.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries.filter((e) => e.isDirectory())) {
      const subdirPath = path.join(dirPath, entry.name);
      await this.storageManager.fixComicDir(subdirPath, dirPath);
    }

    const fixEntries = entries.map((e) => path.join(dirPath, e.name));
    const CONCURRENCY = 16;
    const limit = pLimit(CONCURRENCY);
    const failures: { entryPath: string; reason: unknown }[] = [];

    const tasks = fixEntries.map((entryPath) => {
      limit(async () => {
        const chapterPath = path.dirname(entryPath);

        try {
          await this.normalizeImage(entryPath, chapterPath);
        } catch (e) {
          failures.push({ entryPath, reason: e });
          console.error(`normalizeImage falhou em ${dirPath}: `, e);
        }
      });
    });

    await Promise.all(tasks);

    if (failures.length > 0) {
      const summary = failures
        .map((f) => `${f.entryPath}: ${String(f.reason)}`)
        .join('\n');
      throw new Error(`Alguns arquivos falharam ao normalizar:\n${summary}`);
    }

    await this.clearChapter(dirPath);
  }

  private async clearChapter(dirPath: string): Promise<void> {}

  // public async clearChapter(dirChapter: string): Promise<void> {
  //   try {
  //     const pathDirents = await fse.readdir(dirChapter, {
  //       withFileTypes: true,
  //     });
  //     const imageFiles = pathDirents
  //       .filter(
  //         (dirent) =>
  //           dirent.isFile() && /\.(jpeg|png|tiff|jpg)$/i.test(dirent.name),
  //       )
  //       .map((dirent) => path.join(dirChapter, dirent.name));

  //     for (const imageFile of imageFiles) {
  //       try {
  //         if (await fse.pathExists(imageFile)) {
  //           await fse.remove(imageFile);
  //         }
  //       } catch (error) {
  //         console.error(`Falha ao limpar o arquivo ${imageFile}: ${error}`);
  //       }
  //     }
  //   } catch (e) {
  //     console.error('Falha em limpar os arquivos do capítulo:', e);
  //   }
  // }

  private async convertImage(
    destPath: string,
    resolvedPath: string,
  ): Promise<string> {
    let imageInstance: sharp.Sharp | null = null;
    const tmpPath = `${destPath}.tmp-${randomUUID().slice(0, 4)}`;

    try {
      await this.fileManager.ensureDestDir(destPath);

      imageInstance = sharp(resolvedPath);

      await imageInstance.webp({ quality: 85 }).toFile(destPath);

      await fse.move(tmpPath, destPath, { overwrite: true });

      return destPath;
    } catch (e) {
      try {
        await fse.remove(tmpPath);
      } catch (_) {}
      console.error(`Erro ao normalizar/converter imagem ${resolvedPath}:`, e);
      throw e;
    } finally {
      if (imageInstance) {
        imageInstance.destroy();
      }
    }
  }

  // vai passar para o vManager
  private async isFile(resolvedPath: string): Promise<void> {
    try {
      const stat = await fse.stat(resolvedPath);

      if (!stat.isFile()) {
        throw new Error(`Caminho não é um arquivo: ${resolvedPath}`);
      }
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        throw new Error(`Arquivo não encontrado: ${resolvedPath}`);
      }
      throw err;
    }
  }

  private async isDir(dirPath: string): Promise<void> {
    try {
      const stat = await fse.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path não é um diretório: ${dirPath}`);
      }
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        throw new Error(`Arquivo não encontrado: ${dirPath}`);
      }
      throw err;
    }
  }

  private checkMime(buffer: Buffer): string | null {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return 'image/png';
    }

    // JPEG: FF D8 FF
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return 'image/jpeg';
    }

    // GIF: "GIF8"
    if (
      buffer.length >= 4 &&
      buffer.subarray(0, 4).toString('ascii') === 'GIF8'
    ) {
      return 'image/gif';
    }

    // WEBP: "RIFF" .... "WEBP"
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    return null;
  }
}

// public async encodeImageToBase64(
//   filePath: string | string[],
// ): Promise<string | string[]> {
//   const encodeSingle = async (file: string): Promise<string> => {
//     const buffer = await fse.readFile(file);
//     const type = await fileTypeFromBuffer(buffer);
//     const ext = path.extname(file).toLowerCase();

//     const allowedExt = ['.webp', '.jpg', '.jpeg', '.png'];

//     let mimeType: string | false | undefined;

//     if (type?.mime?.startsWith('image/')) {
//       mimeType = type.mime;
//     } else if (allowedExt.includes(ext)) {
//       mimeType = mime.lookup(ext);
//     } else {
//       throw new Error(`Arquivo não é uma imagem válida: ${file}`);
//     }

//     if (!mimeType) {
//       throw new Error(
//         `Não foi possível determinar o MIME da imagem: ${file}`,
//       );
//     }

//     return `data:${mimeType};base64,${buffer.toString('base64')}`;
//   };

//   if (typeof filePath === 'string') {
//     return encodeSingle(filePath);
//   }

//   return Promise.all(filePath.map(encodeSingle));
// }
