import { IpcMain } from 'electron';
import StorageManager from '../services/StorageManager';

export default function uploadHandlers(ipcMain: IpcMain) {
  const StorageOperations = new StorageManager();

  ipcMain.handle('upload:process-data', async (_event, filePaths: string[]) => {
    if (!filePaths || filePaths.length === 0) {
      console.error('Nenhum arquivo fornecido para upload.');
      throw new Error('Nenhum arquivo fornecido.');
    }

    try {
      const filteredPaths = filePaths.filter((path): path is string => typeof path === 'string');

      const processedData = await Promise.all(
        filteredPaths.map(async seriePath => {
          try {
            return await StorageOperations.preProcessData(seriePath);
          } catch (error) {
            console.error(`Erro ao processar os dados: ${error}`);
            throw error;
          }
        }),
      );

      return processedData;
    } catch (error) {
      console.error(`Erro ao processar os caminhos: ${error}`);
      throw error;
    }
  });
}
