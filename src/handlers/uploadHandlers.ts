import { IpcMain } from "electron";
import FileOperations from "../services/FileManager";
import StorageManager from "../services/StorageManager";
import ValidationOperations from "../services/ValidationManager";
import ImageManager from "../services/ImageManager";
import { LiteratureForms } from "../types/series.interfaces";
import MangaManager from "../services/MangaManager";

export default function uploadHandlers(ipcMain: IpcMain) {
  const FileManager = new FileOperations();
  const StorageOperations = new StorageManager();
  const ValidationManager = new ValidationOperations();
  const imageManager = new ImageManager();
  const mangaManager = new MangaManager();

  ipcMain.handle("localUpload", async (_event, filePaths: string[]) => {
    if (!filePaths || filePaths.length === 0) {
      console.error("Nenhum arquivo fornecido para upload.");
      throw new Error("Nenhum arquivo fornecido.");
    }

    try {
      const newPaths = await Promise.all(
        filePaths.map(async (file) => {
          try {
            if (ValidationManager.serieExist(file)) {
              return await FileManager.localUpload(file);
            }
          } catch (error) {
            console.error(`Erro ao fazer upload de ${file}: ${error}`);
            throw error;
          }
        })
      );

      const processedData = await Promise.all(
        newPaths.map(async (seriePath) => {
          try {
            return await StorageOperations.preProcessData(seriePath);
          } catch (error) {
            console.error(`Erro ao processar os dados: ${error}`);
            throw error;
          }
        })
      );

      return processedData;
    } catch (error) {
      console.error(`Erro ao processar os caminhos: ${error}`);
      throw error;
    }
  });

  ipcMain.handle("dinamic-cover", async (_event, archivesPath: string) => {
    try {
      const coversPath = await mangaManager.createMangaCovers(archivesPath);
      return await imageManager.encodeImageToBase64(coversPath);
    } catch (e) {
      console.error(`Falha em criar as capas: ${e}`);
      throw e;
    }
  });

  ipcMain.handle(
    "save-dinamic-cover",
    async (_event, serieName: string, codePath: string) => {
      try {
        return await imageManager.decodeBase64ToImage(serieName, codePath);
      } catch (e) {
        console.error(`Falha ao decodificar imagem: ${e}`);
        throw e;
      }
    }
  );
}
