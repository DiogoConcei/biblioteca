import { IpcMain } from 'electron';

import StorageManagerInstance from '../services/StorageManager';
import FileManager from '../services/FileManager';

export default function userHandlers(ipcMain: IpcMain) {
  const fileManager = new FileManager();

  ipcMain.handle(
    'chapter:return-page',
    async (_event, dataPath: string, serieName?: string) => {
      try {
        // Prioriza o dataPath direto, pois é o identificador mais confiável.
        // Só tenta buscar pelo nome se o dataPath original não estiver disponível.
        let sDPath = dataPath;
        if (!sDPath && serieName) {
          sDPath = (await fileManager.getDataPath(serieName)) || '';
        }

        if (!sDPath) {
          return { success: false, error: 'Caminho de dados não fornecido' };
        }

        const [literatureForm, serieData] = await Promise.all([
          fileManager.foundLiteratureForm(sDPath),
          StorageManagerInstance.readSerieData(sDPath),
        ]);

        if (!serieData) {
          return { success: false, error: 'Falha em recuperar dados da série' };
        }

        let serieLink: string | null = null;

        if (literatureForm === 'childSeries') {
          serieLink = `/TieIn/${encodeURIComponent(serieData.name)}`;
        } else if (['Comics', 'Mangas', 'books'].includes(literatureForm)) {
          serieLink = `/${serieData.literatureForm}/${serieData.name}/${serieData.id}`;
        }

        if (!serieLink) {
          return { success: false, error: 'Tipo de literatura inválido' };
        }

        return { success: true, data: serieLink };
      } catch (e) {
        console.error(
          `Falha em criar url de retorno para pagina individual: ${e}`,
        );
        return { success: false, error: String(e) };
      }
    },
  );
}
