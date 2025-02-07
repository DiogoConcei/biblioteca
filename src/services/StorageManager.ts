import path from "path";
import fs from "fs/promises";
import jsonfile from "jsonfile";
import FileManager from "./FileManager";
import { FileSystem } from "./abstract/FileSystem";
import { Comic } from "../types/comic.interfaces";
import { Manga } from "../types/manga.interfaces";
import { Book } from "../types/book.interfaces";
import { NormalizedSerieData, SeriesProcessor, Literatures, ExhibitionSerieData } from "../types/series.interfaces";

export default class StorageManager extends FileSystem {
  private readonly fileManager: FileManager = new FileManager();

  constructor() {
    super();
  }

  public createNormalizedData(serie: Literatures): NormalizedSerieData {
    return {
      id: serie.id,
      name: serie.name,
      cover_image: serie.cover_image,
      archive_path: serie.archives_path,
      chapters_path: serie.chapters_path,
      is_favorite: false,
      total_chapters: serie.total_chapters,
      status: serie.metadata.status,
      collections: serie.metadata.collections || [],
      recommended_by: serie.metadata.recommended_by,
      original_owner: serie.metadata.original_owner,
      rating: serie.metadata.rating
    };
  }

  public async seriesData(): Promise<ExhibitionSerieData[]> {
    try {
      const dataPaths = await this.fileManager.getDataPaths();

      const seriesData = await Promise.all(
        dataPaths.map((serieData) =>
          jsonfile.readFile(serieData) as Promise<Literatures>
        )
      );

      const exhibData = seriesData.map((serie) => {
        return {
          id: serie.id,
          name: serie.name,
          cover_image: serie.cover_image,
          chapters_read: serie.chapters_read,
          dataPath: serie.data_path,
          total_chapters: serie.total_chapters,
          literatureForm: serie.literatureForm
        }
      })

      return exhibData
    } catch (e) {
      console.error(`Erro ao ler todo o conteúdo: ${e}`);
      throw e;
    }
  }

  public async selectMangaData(serieName: string): Promise<Manga> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);
      const serieData = seriesData.find((serie) =>
        path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);

      return await jsonfile.readFile(serieData);
    } catch (e) {
      console.error("Erro ao selecionar dados do Manga:", e);
      throw e;
    }
  }

  public async selectComicData(serieName: string): Promise<Comic> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);
      const serieData = seriesData.find((serie) =>
        path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);

      return await jsonfile.readFile(serieData);
    } catch (e) {
      console.error("Erro ao selecionar dados do Manga:", e);
      throw e;
    }
  }

  public async selectBookData(serieName: string): Promise<Book> {
    try {
      const seriesData = await this.fileManager.foundFiles(this.mangasData);
      const serieData = seriesData.find((serie) =>
        path.basename(serie, path.extname(serie)) === serieName
      );

      if (!serieData) throw new Error(`Nenhuma série encontrada com o nome: ${serieName}`);

      return await jsonfile.readFile(serieData);
    } catch (e) {
      console.error("Erro ao selecionar dados do Manga:", e);
      throw e;
    }
  }

  public async updateSerieData(data: Literatures, dataPath: string): Promise<void> {
    try {
      await jsonfile.writeFile(dataPath, data, { spaces: 2 });
    } catch (error) {
      console.error(`Erro ao atualizar arquivo da série "${data.name}":`, error);
      throw error;
    }
  }

  public async readSerieData(dataPath: string): Promise<Literatures> {
    try {
      const serieData: Literatures = await jsonfile.readFile(dataPath, "utf-8")
      return serieData
    } catch (e) {
      console.error(`erro ao tentar ler diretamente o dado das series: ${e}`)
      throw e
    }
  }

  public async writeSerieData(serie: Literatures): Promise<void> {
    try {
      await fs.writeFile(serie.data_path, JSON.stringify(serie, null, 2), "utf-8");
    } catch (e) {
      console.error(`Erro em criar dados da serie: ${e}`)
      throw e;
    }
  }


  public async foundLastDownload(serieData: Literatures): Promise<number> {
    try {
      const chaptersData = serieData.chapters
      let metadata_last_download = serieData.metadata.last_download
      let correct_last_download

      for (let chapters of chaptersData) {
        if (chapters.is_dowload === false) {
          correct_last_download = chapters.id
        }
      }

      if (metadata_last_download !== correct_last_download) {
        metadata_last_download = correct_last_download
      }

      return serieData.metadata.last_download;
    } catch (error) {
      console.error(`Erro ao recuperar o último download da série "${serieData.name}": ${error}`);
      throw error;
    }
  }

  public async preProcessData(seriePath: string): Promise<SeriesProcessor> {
    const randomNumber = Math.random() * 1000;
    const serieName = path.basename(seriePath);

    return {
      id: Math.round(randomNumber),
      name: serieName,
      sanitized_name: this.fileManager.sanitizeFilename(serieName),
      archives_path: seriePath,
      chapters_path: path.join(this.imagesFilesPath, serieName),
      created_at: new Date().toISOString(),
      collections: [],
      deleted_at: ""
    }
  }

}

// (async () => {
//   try {
//     const MangaOperations = new StorageManager();
//     console.log(await MangaOperations.readSerieData("C:\\Users\\Diogo\\Downloads\\Code\\gerenciador-de-arquivos\\storage\\data store\\json files\\Mangas\\Dr. Stone.json"))
//   } catch (error) {
//     console.error('Erro ao executar a função:', error);
//   }
// })();
