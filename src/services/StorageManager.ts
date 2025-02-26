import FileSystem from "./abstract/FileSystem";
import FileManager from "./FileManager";
import jsonfile from "jsonfile";
import path from "path";
import fse from "fs-extra";
import { Manga } from "../types/manga.interfaces";
import { Comic } from "../types/comic.interfaces";
import { Book } from "../types/book.interfaces";
import {
  SeriesProcessor,
  NormalizedSerieData,
  ExhibitionSerieData,
} from "../types/series.interfaces";
import { Literatures } from "../types/series.interfaces";
import { promisify } from "util";
import { exec } from "child_process";

export default class StorageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();
  private readonly SEVEN_ZIP_PATH = "C:\\Program Files\\7-Zip\\7z";
  private readonly execAsync = promisify(exec);

  constructor() {
    super();
  }

  public async writeSerieData(serie: Literatures): Promise<void> {
    try {
      await jsonfile.writeFile(serie.dataPath, serie, { spaces: 2 });
    } catch (e) {
      console.error(`Erro em criar dados da série: ${e}`);
      throw e;
    }
  }

  public async updateSerieData(data: Literatures): Promise<void> {
    try {
      await jsonfile.writeFile(data.dataPath, data, { spaces: 2 });
    } catch (error) {
      console.error(
        `Erro ao atualizar arquivo da série "${data.name}":`,
        error
      );
      throw error;
    }
  }

  public async readSerieData(dataPath: string): Promise<Literatures> {
    try {
      const serieData: Literatures = await jsonfile.readFile(dataPath, {
        encoding: "utf-8",
      });
      return serieData;
    } catch (e) {
      console.error(`Erro ao tentar ler diretamente o dado das séries: ${e}`);
      throw e;
    }
  }

  public async preProcessData(seriePath: string): Promise<SeriesProcessor> {
    const serieName = path.basename(seriePath);

    return {
      name: serieName,
      sanitizedName: this.fileManager.sanitizeFilename(serieName),
      archivesPath: seriePath,
      chaptersPath: "",
      createdAt: new Date().toISOString(),
      collections: [],
      deletedAt: "",
    };
  }

  public createNormalizedData(serie: Literatures): NormalizedSerieData {
    return {
      id: serie.id,
      name: serie.name,
      coverImage: serie.coverImage,
      archivesPath: serie.archivesPath,
      chaptersPath: serie.chaptersPath,
      isFavorite: false,
      totalChapters: serie.totalChapters,
      status: serie.metadata.status,
      collections: serie.metadata.collections,
      recommendedBy: serie.metadata.recommendedBy,
      originalOwner: serie.metadata.originalOwner,
      rating: serie.metadata.rating,
    };
  }

  public async seriesData(): Promise<ExhibitionSerieData[]> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const seriesData: Literatures[] = await Promise.all(
        dataPaths.map(async (dataPath) => {
          return await jsonfile.readFile(dataPath, { encoding: "utf-8" });
        })
      );

      const exhibData = seriesData.map((serie) => ({
        id: serie.id,
        name: serie.name,
        coverImage: serie.coverImage,
        chaptersRead: serie.chaptersRead,
        dataPath: serie.dataPath,
        totalChapters: serie.totalChapters,
        literatureForm: serie.literatureForm,
      }));

      return exhibData;
    } catch (e) {
      console.error(`Erro ao ler todo o conteúdo: ${e}`);
      throw e;
    }
  }

  public async selectMangaData(serieName: string): Promise<Manga> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);

      const serieData = seriesData.find(
        (serie) => path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return await jsonfile.readFile(serieData, { encoding: "utf-8" });
    } catch (e) {
      console.error("Erro ao selecionar dados do Manga:", e);
      throw e;
    }
  }

  public async selectComicData(serieName: string): Promise<Comic> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.comicsData);
      const serieData = seriesData.find(
        (serie) => path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return await jsonfile.readFile(serieData, { encoding: "utf-8" });
    } catch (e) {
      console.error("Erro ao selecionar dados do Comic:", e);
      throw e;
    }
  }

  public async selectBookData(serieName: string): Promise<Book> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);
      const serieData = seriesData.find(
        (serie) => path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) {
        throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);
      }

      return await jsonfile.readFile(serieData, { encoding: "utf-8" });
    } catch (e) {
      console.error("Erro ao selecionar dados do Book:", e);
      throw e;
    }
  }

  // Se trata de um caso especifico mas recorrente
  public async fixComicDir(brokenPath: string, correctPath: string) {
    try {
      const brokenEntries = await fse.readdir(brokenPath, {
        withFileTypes: true,
      });

      const fixPath = await Promise.all(
        brokenEntries.map(async (entry) => {
          const src = path.join(brokenPath, entry.name);
          const dest = path.join(correctPath, entry.name);

          if (await fse.pathExists(dest)) {
            await fse.remove(dest);
          }

          await fse.move(src, dest, { overwrite: true });
        })
      );

      await fse.rmdir(brokenPath);
    } catch (e) {
      console.error(`Falha em corrigir o diretório: ${brokenPath}`, e);
      throw e;
    }
  }

  public async foundLastDownload(serieData: Literatures): Promise<number> {
    try {
      const chaptersData = serieData.chapters;
      let metadata_lastDownload = serieData.metadata.lastDownload;
      let correct_lastDownload: number;

      for (const chapter of chaptersData) {
        if (chapter.isDownload === false) {
          correct_lastDownload = chapter.id;
        }
      }

      if (metadata_lastDownload !== correct_lastDownload) {
        metadata_lastDownload = correct_lastDownload;
      }

      return serieData.metadata.lastDownload;
    } catch (error) {
      console.error(
        `Erro ao recuperar o último download da série "${serieData.name}": ${error}`
      );
      throw error;
    }
  }

  public async extractWith7zip(
    inputFile: string,
    outputDir: string
  ): Promise<void> {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" -o"${outputDir}" -y`;
      await this.execAsync(extractCmd);
    } catch (e) {
      console.error(`Falha em descompactar arquivos: ${e}`);
      throw e;
    }
  }

  public async extractCoverWith7zip(inputFile: string, outputDir: string) {
    try {
      await fse.mkdir(outputDir, { recursive: true });
      const listZip = `"${this.SEVEN_ZIP_PATH}" l "${inputFile}"`;
      const log = await this.execAsync(listZip);
      const filePath = this.fileManager.purifyOutput(log.stdout);

      const extractCmd = `"${this.SEVEN_ZIP_PATH}" x "${inputFile}" "${filePath}" -o"${outputDir}" -y`;
      await this.execAsync(extractCmd);
    } catch (e) {
      console.error(`Falha em descompactar cover: ${e}`);
      throw e;
    }
  }
}
