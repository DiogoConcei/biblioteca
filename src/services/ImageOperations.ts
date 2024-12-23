import { Comic } from "../types/serie.interfaces";
import { Jimp } from "jimp";
import { FileSystem } from "./abstract/FileSystem";
import StorageManager from "./StorageManager";
import FileOperations from "./FileOperations";
import unzipper from "unzipper";
import fs from "fs";
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

  public async extractChapter(chapterPath: string): Promise<string> {
    try {
      const chapterName = path.basename(chapterPath);
      const serieName = path.basename(path.dirname(chapterPath));
      const chaptersSeriePath = path.join(
        this.imagesFilesPath,
        serieName,
        chapterName
      );

      fs.mkdirSync(chaptersSeriePath, { recursive: true });

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(chapterPath)
          .pipe(unzipper.Extract({ path: chaptersSeriePath }))
          .on("close", () => {
            resolve();
          })
          .on("error", (error) => {
            console.error(`Erro ao extrair o capítulo ${chapterName}:`, error);
            reject(error);
          });
      });

      return chaptersSeriePath;
    } catch (error) {
      console.error(`Erro ao processar o capítulo em ${chapterPath}:`, error);
      throw error;
    }
  }

  private async analiseImageSpecial(imagePaths: string[]): Promise<string[]> {
    const specialImagePaths: string[] = [];

    for (const imagePath of imagePaths) {
      try {
        const image = await Jimp.read(imagePath);

        if (image.bitmap.width >= 1300) {
          specialImagePaths.push(imagePath);
          break;
        }
      } catch (error) {
        console.error(`Erro ao processar a imagem especial ${imagePath}:`, error);
      }
    }

    return specialImagePaths;
  }

  private async analiseImage(imagePaths: string[]): Promise<string[]> {
    const validImagePaths: string[] = [];

    for (const imagePath of imagePaths) {
      try {
        const image = await Jimp.read(imagePath);

        if (image.bitmap.width < 1000 && image.bitmap.height <= 1300) {
          validImagePaths.push(imagePath);
          break;
        }
      } catch (error) {
        console.error(`Erro ao processar a imagem ${imagePath}:`, error);
      }
    }

    const specialImages = await this.analiseImageSpecial(validImagePaths);

    return [...validImagePaths, ...specialImages];
  }



  private async createCover(imagePath: string, serieName: string): Promise<void> {
    try {

      const destinyDir = path.join(
        this.showcaseImages,
        `${serieName}_${path.basename(imagePath)}`
      );

      if (!(await fs.promises.stat(imagePath).catch(() => false))) {
        throw new Error(`Arquivo ${imagePath} não encontrado.`);
      }

      await fs.promises.copyFile(imagePath, destinyDir);
    } catch (e) {
      console.error(`Erro ao criar a capa para ${serieName}: ${e.message}`);
      throw e;
    }
  }

  public async coverToSerie(series: Comic[]): Promise<void> {
    const covers = await this.foundFiles(this.showcaseImages);

    series.forEach((serie, index) => {
      serie.cover_image = covers[index];
    });

    for (const serie of series) {
      const filePath = path.join(this.jsonFilesPath, `${serie.name}.json`);
      try {
        await jsonfile.writeFile(filePath, serie, { spaces: 2 });
      } catch (error) {
        console.error(`Erro ao salvar arquivo ${filePath}: ${error.message}`);
      }
    }
  }

  public async extractInitialCovers(filesName: string[]): Promise<void> {
    try {
      const seriesData: Comic[] = [];
      console.log(`Nome das series dentro do módulo de imagens -> ${filesName}`)

      for (const fileName of filesName) {
        const serieData = await this.dataManager.selectFileData(fileName);
        seriesData.push(serieData);
      }

      const firstChapterPaths = seriesData.map(
        (serie) => serie.chapters[0].chapter_path
      );

      const extractChapters: string[] = [];

      for (const chapterPath of firstChapterPaths) {
        const extractedChapter = await this.extractChapter(chapterPath);
        extractChapters.push(extractedChapter);
      }

      const chapterImages = [];
      for (const chapterPath of extractChapters) {
        const images = await this.foundFiles(chapterPath);
        chapterImages.push(images);
      }

      const initialCovers: string[] = [];
      for (const images of chapterImages) {
        const validImages = await this.analiseImage(images);
        initialCovers.push(...validImages);
      }

      for (const cover of initialCovers) {
        const serieName = path.basename(path.dirname(cover));
        await this.createCover(cover, serieName);
      }

      await this.coverToSerie(seriesData)

    } catch (e) {
      console.error(`Erro encontrado: ${e.message}`);
      throw e;
    }
  }
}


