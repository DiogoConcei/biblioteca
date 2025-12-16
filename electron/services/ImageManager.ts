import fse from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import FileSystem from './abstract/FileSystem.ts';
import StorageManager from './StorageManager.ts';
import FileManager from './FileManager.ts';

export default class ImageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();

  constructor() {
    super();
  }

  public normalizeImageFilename(filePath: string): string {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    let baseName = path.basename(filePath, ext);

    baseName = baseName.replace(/\.(pdf|zip|rar)/gi, '');

    return path.join(dir, `${baseName}${ext}`);
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
    filePath: string[] | string,
  ): Promise<string | string[]> {
    try {
      if (typeof filePath === 'string') {
        const fileData = await fse.readFile(filePath);
        return fileData.toString('base64');
      } else if (Array.isArray(filePath)) {
        const base64Array = await Promise.all(
          filePath.map(async (file) => {
            const fileData = await fse.readFile(file);
            return fileData.toString('base64');
          }),
        );
        return base64Array;
      } else {
        throw new Error(
          'Entrada inválida. Deve ser um caminho de arquivo ou uma lista de caminhos.',
        );
      }
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      throw error;
    }
  }

  public async decodeBase64ToImage(
    serieName: string,
    codePath: string,
  ): Promise<string> {
    try {
      const base64Data = codePath.replace(/^data:image\/webp;base64,/, '');
      const fileName = `${serieName}_${Date.now()}.webp`;
      const directory = path.join(this.imagesFolder, 'dinamic images');

      if (!fse.existsSync(directory)) {
        fse.mkdirSync(directory, { recursive: true });
      }

      const filePath = path.join(directory, fileName);
      await fse.writeFile(filePath, base64Data, 'base64');

      return filePath;
    } catch (error) {
      throw new Error(`Erro ao salvar a imagem: ${error}`);
    }
  }
}
