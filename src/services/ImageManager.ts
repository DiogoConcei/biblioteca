import fse from "fs-extra";
import path from "path";
import sharp from "sharp";
import { promisify } from "util";
import sizeOf from "image-size";
import FileSystem from "./abstract/FileSystem";
import StorageManager from "./StorageManager";
import FileManager from "./FileManager";

export default class ImageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly storageManager: StorageManager = new StorageManager();
  private readonly sizeOfAsync = promisify(sizeOf);

  constructor() {
    super();
  }

  public async normalizeChapter(dirPath: string): Promise<void> {
    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries.filter((e) => e.isDirectory())) {
        await this.storageManager.fixComicDir(
          path.join(entry.parentPath, entry.name),
          dirPath
        );
      }

      const fixEntries = (
        await fse.readdir(dirPath, { withFileTypes: true })
      ).map((entry) => path.join(dirPath, entry.name));

      await Promise.all(
        fixEntries.map(async (entryPath) => {
          await this.normalizeImage(entryPath);
        })
      );

      await this.clearChapter(dirPath);
    } catch (error) {
      console.error(`Falha em normalizar diretório: ${error}`);
      throw error;
    }
  }

  public async normalizeImage(imagePath: string): Promise<string | null> {
    let imageInstance: sharp.Sharp | null = null;

    try {
      const imageFilter = /\.(jpg|jpeg|png|gif|bmp|webp|tiff)$/i;
      if (!imageFilter.test(imagePath)) return null;

      sharp.cache(false);

      const normalizedPath = path.normalize(imagePath);
      if (!(await fse.pathExists(normalizedPath))) {
        console.error(`Arquivo não encontrado: ${normalizedPath}`);
        return null;
      }

      const ext = path.extname(normalizedPath).toLowerCase();
      const fileName = path.basename(normalizedPath, ext);
      const sanitizedFileName = this.fileManager.sanitizeFilename(fileName);

      const destPath = path.join(
        path.dirname(normalizedPath),
        `${sanitizedFileName}.webp`
      );

      if (
        ext === ".webp" &&
        path.basename(normalizedPath) === `${sanitizedFileName}.webp`
      ) {
        return normalizedPath;
      }

      imageInstance = sharp(normalizedPath);
      await imageInstance.webp({ quality: 100 }).toFile(destPath);

      return destPath;
    } catch (error) {
      console.error(`Erro ao converter a imagem ${imagePath}:`, error);
      throw error;
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
            dirent.isFile() && /\.(jpeg|png|tiff|jpg)$/i.test(dirent.name)
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
      console.error("Falha em limpar os arquivos do capítulo:", e);
    }
  }

  public async encodeImageToBase64(
    filePath: string[] | string
  ): Promise<string | string[]> {
    try {
      if (typeof filePath === "string") {
        const fileData = await fse.readFile(filePath);
        return fileData.toString("base64");
      } else if (Array.isArray(filePath)) {
        const base64Array = await Promise.all(
          filePath.map(async (file) => {
            const fileData = await fse.readFile(file);
            return fileData.toString("base64");
          })
        );
        return base64Array;
      } else {
        throw new Error(
          "Entrada inválida. Deve ser um caminho de arquivo ou uma lista de caminhos."
        );
      }
    } catch (error) {
      console.error("Erro ao processar imagens:", error);
      throw error;
    }
  }

  public async decodeBase64ToImage(
    serieName: string,
    codePath: string
  ): Promise<string> {
    try {
      const base64Data = codePath.replace(/^data:image\/webp;base64,/, "");
      const fileName = `${serieName}_${Date.now()}.webp`;
      const directory = path.join(this.imagesFilesPath, "DinamicImages");

      if (!fse.existsSync(directory)) {
        fse.mkdirSync(directory, { recursive: true });
      }

      const filePath = path.join(directory, fileName);
      await fse.writeFile(filePath, base64Data, "base64");

      return filePath;
    } catch (error) {
      throw new Error(`Erro ao salvar a imagem: ${error}`);
    }
  }
}

// (async () => {
// const imageManager = new ImageManager();
// const testPath =
// "C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\data store\\images files\\Manga\\Dragon Ball\\Kyodai Scans_Vol. 2, Ch. 21";
// imageManager.clearChapter(testPath);
// })();
