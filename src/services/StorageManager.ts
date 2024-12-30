import path from "path";
import fs from "fs/promises";
import jsonfile from "jsonfile";
import FileOperations from "./FileOperations";
import { FileSystem } from "./abstract/FileSystem";
import { ComicConfig, Comic, ComicChapter } from "../types/serie.interfaces";

export default class StorageManager extends FileSystem {
  private readonly fileManager: FileOperations;
  private comicId: number;

  constructor() {
    super();
    this.fileManager = new FileOperations();
  }

  public async getCurrentId(): Promise<number> {
    try {
      let data: ComicConfig = JSON.parse(await fs.readFile(this.comicConfig, "utf-8"));
      let currentId = data.global_id;
      return currentId;
    } catch (e) {
      console.error(`Erro ao obter o ID atual: ${e}`);
      throw e;
    }
  }

  public async seriesData(): Promise<Comic[]> {
    try {
      const seriesData = await this.foundFiles(this.jsonFilesPath);
      return await Promise.all(seriesData.map((serieData) => jsonfile.readFile(serieData)));
    } catch (e) {
      console.error(`Erro ao ler todo o conteúdo: ${e}`);
      throw e;
    }
  }

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

  public async getData(filePath: string): Promise<string> {
    const data: string = await jsonfile.readFile(filePath)
    return data
  }

  public async getComicConfig(): Promise<ComicConfig> {
    const data: ComicConfig = await jsonfile.readFile(this.comicConfig)
    return data
  }

  public async setId(currentId: number): Promise<number> {
    try {
      let data: ComicConfig = JSON.parse(await fs.readFile(this.comicConfig, "utf-8"));
      data.global_id = currentId
      await fs.writeFile(this.comicConfig, JSON.stringify(data), "utf-8")
      return currentId;
    } catch (e) {
      console.error(`Erro ao obter o ID atual: ${e}`);
      throw e;
    }
  }

  public async updateserieData(data: string, serieName: string): Promise<void> {
    try {
      const allData = await this.foundFiles(this.jsonFilesPath);
      const correctFile = allData.find(
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

  public async updateComicConfig(data: string): Promise<void> {
    try {
      await jsonfile.writeFile(this.comicConfig, JSON.parse(data), { spaces: 2 });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      throw error;
    }
  }

  public async createMainData(series: string[]): Promise<Comic[]> {
    const currentDate = new Date().toLocaleDateString();

    return await Promise.all(
      series.map(async (serie, index) => {
        const id = ++this.comicId;
        const name = path.basename(serie);
        const sanitizedName = this.fileManager.sanitizeFilename(name);

        const chaptersPath = await this.foundFiles(serie);
        const chaptersData = await this.createChapterData(chaptersPath, currentDate);

        const orderedChapters = await this.fileManager.ensureCorrectOrder(chaptersData);

        orderedChapters.forEach((orderedChapter, index) => {
          chaptersData[index] = { ...orderedChapter };
        });

        const comments: string[] = []

        return {
          id,
          name,
          sanitized_name: sanitizedName,
          serie_path: serie,
          cover_image: "",
          total_chapters: orderedChapters.length,
          created_at: currentDate,
          chapters_read: 0,
          reading_data: {
            last_chapter_id: 0,
            last_page: 0,
            last_read_at: "",
          },
          chapters: orderedChapters,
          metadata: {
            status: "em andamento",
            is_favorite: false,
            recommended_by: "",
            original_owner: "",
            last_download: 0,
            rating: 0,
          },
          comments: comments,
        };
      })
    );
  }

  public async createChapterData(chaptersPath: string[], currentDate: string): Promise<ComicChapter[]> {
    return chaptersPath.map((chapter, index) => {
      const name = path.basename(chapter, path.extname(chapter));
      const sanitized_name = this.fileManager.sanitizeFilename(name);

      return {
        id: index + 1,
        name,
        sanitized_name,
        chapter_path: path.resolve(chapter),
        create_date: currentDate,
        is_dowload: false,
        is_read: false,
      };
    });
  }

  public async createData(series: string[]): Promise<void> {
    try {
      this.comicId = await this.getCurrentId();
      const seriesData = await this.createMainData(series);
      await Promise.all(seriesData.map((serieData) => this.writeSerieData(serieData)));
    } catch (e) {
      console.error(`Erro ao armazenar o conteúdo: ${e}`);
      throw e;
    }
  }

  private async writeSerieData(serieData: Comic): Promise<void> {
    const tempPath = path.join(this.jsonFilesPath, `${serieData.name}.json`);
    try {
      this.setId(this.comicId)
      await fs.writeFile(tempPath, JSON.stringify(serieData, null, 2), "utf-8");
    } catch (e) {
      console.error(`Erro ao tentar gravar o arquivo ${serieData.name}.json: ${e.message}`);
      throw e;
    }
  }
}

