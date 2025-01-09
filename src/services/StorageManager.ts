import path from "path";
import fs from "fs/promises";
import jsonfile from "jsonfile";
import FileOperations from "./FileOperations";
import { FileSystem } from "./abstract/FileSystem";
import { Comic } from "../types/comic.interfaces";

export default class StorageManager extends FileSystem {
  private readonly fileManager: FileOperations;
  private comicId: number;

  constructor() {
    super();
    this.fileManager = new FileOperations();
  }

  // Get all
  public async seriesData(): Promise<Comic[]> {
    try {
      const seriesData = await this.foundFiles(this.jsonFilesPath);
      return await Promise.all(seriesData.map((serieData) => jsonfile.readFile(serieData)));
    } catch (e) {
      console.error(`Erro ao ler todo o conteúdo: ${e}`);
      throw e;
    }
  }

  // Get specific
  public async selectSerieData(serieName: string): Promise<Comic> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.jsonFilesPath);
      const serieData = seriesData.find((serie) =>
        path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);

      return await jsonfile.readFile(serieData);
    } catch (e) {
      console.error("Erro ao selecionar dados do arquivo:", e);
      throw e;
    }
  }

  // Update
  public async updateserieData(data: string, serieName: string): Promise<void> {
    try {
      const seriesData = await this.foundFiles(this.jsonFilesPath);
      const correctFile = seriesData.find(
        (serie) => path.basename(serie, path.extname(serie)) === serieName
      );

      if (!correctFile) {
        throw new Error(`Arquivo da série "${serieName}" não encontrado.`);
      }

      await jsonfile.writeFile(correctFile, JSON.parse(data), { spaces: 2 });
    } catch (error) {
      console.error(`Erro ao atualizar arquivo da série "${serieName}":`, error);
      throw error;
    }
  }

  // Update
  public async updateFavCollection(data: string): Promise<void> {
    try {
      await jsonfile.writeFile(this.comicCollections, JSON.parse(data), { spaces: 2 });
    } catch (error) {
      console.error("Erro ao atualizar coleção de favoritos:", error);
      throw error;
    }
  }

  // Create
  public async writeSerieData(serieData: Comic): Promise<void> {
    const tempPath = path.join(this.jsonFilesPath, `${serieData.name}.json`);
    try {
      await fs.writeFile(tempPath, JSON.stringify(serieData, null, 2), "utf-8");
    } catch (e) {
      console.error(`Erro ao tentar gravar o arquivo ${serieData.name}.json: ${e.message}`);
      throw e;
    }
  }

  // Delete
  // ?

  private async foundLastDownload(serieName: string): Promise<number> {
    try {
      const serieData = await this.selectSerieData(serieName);
      return serieData.metadata.last_download;
    } catch (error) {
      console.error(`Erro ao recuperar o último download da série "${serieName}": ${error}`);
      throw error;
    }
  }
}
