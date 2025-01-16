import { Comic } from "../types/comic.interfaces";
import { Jimp } from "jimp";
import { FileSystem } from "./abstract/FileSystem";
import StorageManager from "./StorageManager";
import FileOperations from "./FileOperations";
import unzipper from "unzipper";
import fs from "fs";
import fse from "fs/promises";
import jsonfile from "jsonfile";
import path from "path";

export default class ImageOperations extends FileSystem {
  private readonly dataManager: StorageManager;
  private readonly fileManager: FileOperations;

  constructor() {
    super();
    this.dataManager = new StorageManager();
    this.fileManager = new FileOperations();
  }

  public async createComicImages(serieName: string, quantity: number): Promise<string> {
    try {
      const serieData = await this.dataManager.selectSerieData(serieName);

      const organizedChapters = await this.fileManager.orderByChapters(
        await this.fileManager.foundFiles(serieData.archives_path)
      );

      const serieNames = path.basename(serieData.archives_path);
      const seriePath = await this.fileManager.findJsonFile(serieNames);
      const lastDownload = await this.foundLastDownload(serieNames);
      const nextItem = lastDownload;
      const lastItem = Math.min(lastDownload + quantity, organizedChapters.length);

      const chaptersPath = path.join(this.imagesFilesPath, serieNames);
      let lastProcessedPath = "";

      for (let i = nextItem; i <= lastItem; ++i) {
        const chapterName = path.basename(organizedChapters[i], path.extname(organizedChapters[i]));
        const chapterSeriePath = path.join(chaptersPath, chapterName);

        await this.extractionProcess(chapterSeriePath, organizedChapters[i]);

        serieData.chapters[i].is_dowload = true;
        serieData.chapters[i].chapter_path = chapterSeriePath;
        serieData.metadata.last_download = i;
        serieData.chapters_path = chaptersPath;

        lastProcessedPath = chapterSeriePath;
      }

      await jsonfile.writeFile(seriePath, serieData, { spaces: 2 });

      return lastProcessedPath;
    } catch (error) {
      console.error(`Erro ao processar os capítulos em "${serieName}": ${error}`);
      throw error;
    }
  }

  private async extractionProcess(chapterSeriePath: string, chapterFile: string): Promise<void> {
    fs.mkdirSync(chapterSeriePath, { recursive: true });

    try {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(chapterFile)
          .pipe(unzipper.Extract({ path: chapterSeriePath }))
          .on("close", resolve)
          .on("error", reject);
      });
    } catch (error) {
      console.error(`Erro ao extrair o capítulo: ${error}`);
      throw error;
    }
  }


  public async coverToSerie(filesNames: string[]): Promise<void> {
    try {
      const series = await Promise.all(
        filesNames.map(fileName => this.dataManager.selectSerieData(fileName))
      );

      const covers = await this.foundFiles(this.showcaseImages);

      for (const serie of series) {
        let found = false;
        for (const coverPath of covers) {
          const coverName = path.basename(coverPath, path.extname(coverPath));
          if (coverName.startsWith(serie.name)) {
            serie.cover_image = coverPath;
            found = true;
            break;
          }
        }

        if (!found) console.warn(`Capa não encontrada para a série ${serie.name}`);

        const filePath = path.join(this.jsonFilesPath, `${serie.name}.json`);
        await jsonfile.writeFile(filePath, serie, { spaces: 2 });
      }
    } catch (error) {
      console.error(`[ERROR] Erro ao associar capas às séries: ${error.message}`);
      throw error;
    }
  }

  private async CoverCreation(imagePath: string): Promise<string> {
    const dirPath = path.dirname(imagePath);
    const directories = dirPath.split(path.sep);
    const serieName = directories[directories.length - 2];
    const chapterName = path.basename(dirPath);
    const coverFileName = `${serieName}_${chapterName}_${path.basename(imagePath)}`;
    const destinationPath = path.join(this.showcaseImages, coverFileName);

    const fileExists = await fs.promises.stat(imagePath).catch(() => false);
    if (!fileExists) throw new Error(`Arquivo ${imagePath} não encontrado.`);

    await fs.promises.copyFile(imagePath, destinationPath);
    return serieName;
  }

  private async analyzeSpecialImage(imagePaths: string[]): Promise<string | null> {
    for (const imagePath of imagePaths) {
      try {
        const image = await Jimp.read(imagePath);
        if (image.bitmap.width >= 400 || image.bitmap.height >= 600) {
          return imagePath;
        }
      } catch (error) {
        console.error(`[ERROR] Erro ao processar a imagem especial ${imagePath}:`, error);
        throw error;
      }
    }
    return null;
  }

  private async analyzeImage(imagePaths: string[]): Promise<string[]> {
    const validImages: string[] = [];
    for (const imagePath of imagePaths) {
      try {
        const image = await Jimp.read(imagePath);
        if (image.bitmap.width <= 1200 && image.bitmap.height >= 1300) {
          validImages.push(imagePath);
          break;
        }
      } catch (error) {
        console.error(`[ERROR] Erro ao processar a imagem ${imagePath}:`, error);
        throw error;
      }
    }

    if (validImages.length === 0) {
      const specialImage = await this.analyzeSpecialImage(imagePaths);
      if (specialImage) validImages.push(specialImage);
    }

    return validImages;
  }

  private async foundLastDownload(serieName: string): Promise<number> {
    try {
      const serieData = await this.dataManager.selectSerieData(serieName);
      return serieData.metadata.last_download;
    } catch (error) {
      console.error(`Erro ao recuperar o último download da série "${serieName}": ${error}`);
      throw error;
    }
  }

  public async encodeImageToBase64(filePath: string[] | string): Promise<string | string[]> {
    try {
      if (typeof filePath === "string") {
        const fileData = await fse.readFile(filePath);
        return fileData.toString("base64");
      } else if (Array.isArray(filePath)) {
        const base64Array = await Promise.all(
          filePath.map(async (filePath) => {
            const fileData = await fse.readFile(filePath);
            return fileData.toString("base64");
          })
        );
        return base64Array;
      } else {
        throw new Error("Entrada inválida. Deve ser um caminho de arquivo ou uma lista de caminhos.");
      }
    } catch (error) {
      console.error("Erro ao processar imagens:", error);
      throw error;
    }
  }

  public async extractInitialCovers(fileNames: string[]): Promise<void> {
    try {
      const seriesData = await Promise.all(
        fileNames.map(fileName => this.dataManager.selectSerieData(fileName))
      );

      const archivesPath = seriesData.map(serie => serie.name);

      const extractedPaths = await Promise.all(
        archivesPath.map(archivePath => this.createComicImages(archivePath, 1))
      );


      const chapterImages = await Promise.all(
        extractedPaths.map(chapterPath => this.foundFiles(chapterPath))
      );

      const initialCovers = (await Promise.all(
        chapterImages.map(images => this.analyzeImage(images))
      )).flat();

      for (const cover of initialCovers) {
        await this.CoverCreation(cover);
      }

      await this.coverToSerie(fileNames);
    } catch (error) {
      console.error(`Erro em extrair a showcaseImage: ${error}`)
      throw error;
    }
  }

}

(async () => {
  try {
    const comicManager = new ImageOperations()
    await comicManager.extractInitialCovers(["Dragon Ball"])
  } catch (error) {
    console.error("Erro ao buscar os dados:", error);
  }
})();
