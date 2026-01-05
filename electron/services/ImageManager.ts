import fse from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import FileSystem from './abstract/LibrarySystem.ts';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';
import { fileTypeFromBuffer } from 'file-type';
import mime from 'mime-types';

export default class ImageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public async readFileAsDataUrl(rawPath: string): Promise<string> {
    const buf = await fse.promises.readFile(rawPath);
    const mimeType = mime.lookup(rawPath) || 'application/octet-stream';
    return `data:${mimeType};base64,${buf.toString('base64')}`;
  }

  public normalizeImageFilename(filePath: string): string {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    let baseName = path.basename(filePath, ext);

    baseName = baseName.replace(/\.(pdf|zip|rar)/gi, '');

    return path.join(dir, `${baseName}${ext}`);
  }

  public async uploadNewCover(
    serieName: string,
    oldCover: string,
    newCover: string,
  ): Promise<string> {
    if (oldCover === newCover) {
      return oldCover;
    }

    const extName = path.extname(newCover).toLowerCase();

    if (extName !== '.webp') {
      const normalizedCover = await this.normalizeCover(newCover, serieName);
      return normalizedCover;
    }

    return newCover;
  }

  public async normalizeChapter(dirPath: string): Promise<void> {
    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries.filter((e) => e.isDirectory())) {
        await this.storageManager.fixComicDir(
          path.join(entry.parentPath, entry.name),
          dirPath,
        );
      }

      const fixEntries = (
        await fse.readdir(dirPath, { withFileTypes: true })
      ).map((entry) => path.join(dirPath, entry.name));

      await Promise.all(
        fixEntries.map(async (entryPath) => {
          const chapterPath = path.dirname(entryPath);
          await this.normalizeImage(entryPath, chapterPath);
        }),
      );

      await this.clearChapter(dirPath);
    } catch (e) {
      console.error(`Falha em normalizar diretório: ${e}`);
      throw e;
    }
  }

  public async normalizeImage(
    imagePath: string,
    dinamicPath: string,
  ): Promise<string> {
    const imageName = path.basename(imagePath);
    const imageExt = path.extname(imageName);
    let imageInstance: sharp.Sharp | null = null;

    if (
      imageExt.toLowerCase() === '.webp' ||
      imageExt.toLowerCase() === '.xml'
    ) {
      return imagePath;
    }

    try {
      const imageFilter = /\.(jpeg|png|jpg)$/i;

      if (!imageFilter.test(imageExt)) {
        throw new Error(`Formato de imagem não suportado: ${imagePath}`);
      }

      sharp.cache(false);
      const normalizedPath = path.normalize(imagePath);

      if (!(await fse.pathExists(normalizedPath))) {
        throw new Error(`Arquivo não encontrado: ${normalizedPath}`);
      }

      const fileName = path.basename(imageName, imageExt);
      const sanitizedFileName = this.fileManager.sanitizeFilename(fileName);
      const destPath = this.fileManager.buildSafeImagePath(
        dinamicPath,
        sanitizedFileName,
        '.webp',
      );

      if (
        imageExt === '.webp' &&
        path.dirname(normalizedPath) === this.showcaseImages
      ) {
        return normalizedPath;
      }
      if (await fse.pathExists(destPath)) {
        return destPath;
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

  public async normalizeCover(
    coverPath: string,
    serieName: string,
  ): Promise<string> {
    let imageInstance: sharp.Sharp | null = null;

    try {
      const ext = path.extname(coverPath).toLowerCase();

      const imageFilter = /\.(jpe?g|png|webp)$/i;

      if (!imageFilter.test(ext)) {
        throw new Error(`Arquivo não é uma imagem válida: ${coverPath}`);
      }

      const rawName = path.dirname(coverPath);
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

  public async clearChapter(dirChapter: string): Promise<void> {
    try {
      const pathDirents = await fse.readdir(dirChapter, {
        withFileTypes: true,
      });
      const imageFiles = pathDirents
        .filter(
          (dirent) =>
            dirent.isFile() && /\.(jpeg|png|tiff|jpg)$/i.test(dirent.name),
        )
        .map((dirent) => path.join(dirChapter, dirent.name));

      for (const imageFile of imageFiles) {
        try {
          if (await fse.pathExists(imageFile)) {
            await fse.remove(imageFile);
          }
        } catch (error) {
          console.error(`Falha ao limpar o arquivo ${imageFile}: ${error}`);
        }
      }
    } catch (e) {
      console.error('Falha em limpar os arquivos do capítulo:', e);
    }
  }

  public async encodeImageToBase64(
    filePath: string | string[],
  ): Promise<string | string[]> {
    const encodeSingle = async (file: string): Promise<string> => {
      const buffer = await fse.readFile(file);
      const type = await fileTypeFromBuffer(buffer);
      const ext = path.extname(file).toLowerCase();

      const allowedExt = ['.webp', '.jpg', '.jpeg', '.png'];

      let mimeType: string | false | undefined;

      if (type?.mime?.startsWith('image/')) {
        mimeType = type.mime;
      } else if (allowedExt.includes(ext)) {
        mimeType = mime.lookup(ext);
      } else {
        throw new Error(`Arquivo não é uma imagem válida: ${file}`);
      }

      if (!mimeType) {
        throw new Error(
          `Não foi possível determinar o MIME da imagem: ${file}`,
        );
      }

      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    };

    if (typeof filePath === 'string') {
      return encodeSingle(filePath);
    }

    return Promise.all(filePath.map(encodeSingle));
  }

  public async decodeBase64ToImage(
    serieName: string,
    base64Data: string,
  ): Promise<string> {
    const matches = base64Data.match(
      /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/,
    );

    if (!matches) {
      throw new Error('Base64 inválido ou sem MIME type');
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType || !detectedType.mime.startsWith('image/')) {
      throw new Error('Conteúdo Base64 não é uma imagem válida');
    }

    const directory = path.join(this.imagesFolder, 'dinamic images');
    await fse.ensureDir(directory);

    const fileName = `${serieName}_${Date.now()}.${detectedType.ext}`;
    const filePath = path.join(directory, fileName);

    await fse.writeFile(filePath, buffer);
    return filePath;
  }
}

// (async () => {
//   const imageGen = new ImageManager();
//   const dirPath =
//     'C:\\Users\\diogo\\AppData\\Roaming\\biblioteca\\storage\\data store\\images files\\comic\\05 - Surpreendentes X-Men\\Surpreendentes_X-Men_V3_008_2005_';

//   await imageGen.clearChapter(dirPath);
// })();

//   public async createCovers(serie: SerieForm, comicData: Comic): Promise<void> {
//     try {
//       const entries = await fse.readdir(serie.oldPath, { withFileTypes: true });
//       const comicFiles = entries
//         .filter((e) => e.isFile() && /\.(cbz|cbr|zip|rar|pdf)$/i.test(e.name))
//         .map((e) => path.join(serie.oldPath, e.name));
//       if (!comicData.chapters || comicData.chapters.length === 0) {
//         throw new Error('Comic data chapters are missing or empty');
//       }
//       if (comicFiles.length < comicData.chapters.length) {
//         throw new Error(
//           'Número de arquivos de quadrinhos é menor que o número de capítulos',
//         );
//       }
//       await Promise.all(
//         comicData.chapters.map(async (chap, idx) => {
//           let coverPath = '';
//           const ext = path.extname(chap.archivesPath);
//           const rawName = chap.name;
//           const chapName = this.fileManager.sanitizeDirName(rawName);
//           const chapterOut = path.join(
//             this.comicsImages,
//             comicData.name,
//             chapName,
//           );
//           const outputPath = path.join(this.dinamicImages, comicData.name);
//           try {
//             if (ext === '.pdf') {
//               coverPath = await this.storageManager.extractCoverFromPdf(
//                 comicFiles[idx],
//                 outputPath,
//               );
//             } else {
//               coverPath = await this.storageManager.extractCoverWith7zip(
//                 comicFiles[idx],
//                 outputPath,
//               );
//             }
//             const resultCover = await this.imageManager.normalizeCover(
//               coverPath,
//               serie.name,
//             );
//             chap.chapterPath = chapterOut;
//             chap.coverImage = resultCover;
//           } catch (e) {
//             console.error(
//               `Erro no capítulo ${chap.name} - arquivo ${comicFiles[idx]}:`,
//               e,
//             );
//             throw e;
//           }
//         }),
//       );
//     } catch (e) {
//       console.error('Erro ao criar capas:', e);
//       throw e;
//     }
//   }

//   private async createChildCovers(
//     child: ComicTieIn,
//     basePath: string,
//   ): Promise<void> {
//     if (!child.compiledComic) return;

//     const entries = await fse.readdir(basePath, {
//       withFileTypes: true,
//     });

//     const firstChapterEntry = entries.find(
//       (e) => e.isFile() && /\.(cbz|cbr|zip|rar|PDF)$/i.test(e.name),
//     );

//     if (!firstChapterEntry) return;

//     let coverPath = '';
//     const firstChapter = path.join(basePath, firstChapterEntry.name);
//     const ext = path.extname(firstChapter);

//     const outputPath = path.join(this.dinamicImages, child.serieName);

//     if (ext === '.pdf') {
//       coverPath = await this.storageManager.extractCoverFromPdf(
//         firstChapter,
//         outputPath,
//       );
//     } else {
//       coverPath = await this.storageManager.extractCoverWith7zip(
//         firstChapter,
//         outputPath,
//       );
//     }

//     const resultCover = await this.imageManager.normalizeCover(
//       coverPath,
//       child.serieName,
//     );
//     child.coverImage = resultCover;
//   }

//   public async createTieInCovers(dataPath: string): Promise<void> {
//     if (await this.validationManager.tieInCreated(dataPath)) {
//       return;
//     }

//     const tieInData = (await this.storageManager.readSerieData(
//       dataPath,
//     )) as TieIn;
//     const tieChapters = tieInData.chapters;
//     if (!tieChapters || tieChapters.length === 0) {
//       console.warn(`Nenhum capítulo encontrado para Tie-In em ${dataPath}`);
//       return;
//     }

//     await Promise.all(
//       tieChapters.map(async (chap) => {
//         const ext = path.extname(chap.archivesPath);
//         let coverPath = '';
//         const rawName = this.fileManager.sanitizeFilename(chap.name);
//         const chapSafe = rawName.replaceAll('.', '_');
//         const safeDir = this.fileManager
//           .sanitizeDirName(tieInData.name)
//           .slice(0, 10)
//           .replaceAll('.', '_');
//         const chapterOut = path.join(this.comicsImages, safeDir, chapSafe);
//         const outputPath = path.join(this.dinamicImages, tieInData.name);

//         try {
//           if (ext === '.pdf') {
//             coverPath = await this.storageManager.extractCoverFromPdf(
//               chap.archivesPath,
//               outputPath,
//             );
//           } else {
//             coverPath = await this.storageManager.extractCoverWith7zip(
//               chap.archivesPath,
//               outputPath,
//             );
//           }

//           const resultCover = await this.imageManager.normalizeCover(
//             coverPath,
//             tieInData.name,
//           );
//           chap.chapterPath = chapterOut;
//           chap.coverImage = resultCover;
//         } catch (error) {
//           console.error(
//             `Erro no capítulo ${chap.name} - (${chap.archivesPath}):`,
//             error,
//           );
//           throw error;
//         }
//       }),
//     );

//     tieInData.metadata.isCreated = true;
//     await fse.writeJson(tieInData.dataPath, tieInData, { spaces: 2 });
//   }

//   private async processCoverImage(
//     chapterPath: string,
//     chName: string,
//     serieName: string,
//   ): Promise<string[]> {
//     console.log(chapterPath);
//     const ext = path.extname(chapterPath);
//     let coverPath = '';
//     const chapName = this.fileManager.sanitizeDirName(chName);
//     const chapterOut = path.join(this.comicsImages, serieName, chapName);
//     const outputPath = path.join(this.dinamicImages, serieName);
//     if (ext === '.pdf') {
//       coverPath = await this.storageManager.extractCoverFromPdf(
//         chapterPath,
//         outputPath,
//       );
//     } else {
//       coverPath = await this.storageManager.extractCoverWith7zip(
//         chapterPath,
//         outputPath,
//       );
//     }
//     const resultCover = await this.imageManager.normalizeCover(
//       coverPath,
//       serieName,
//     );
//     return [chapterOut, resultCover];
//   }
