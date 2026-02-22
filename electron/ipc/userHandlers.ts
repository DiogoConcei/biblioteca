import { IpcMain } from 'electron';
import StorageManager from '../services/StorageManager';
import FileManager from '../services/FileManager';

export default function userHandlers(ipcMain: IpcMain) {
  const storageManager = new StorageManager();
  const fileManager = new FileManager();

  ipcMain.handle(
    'chapter:return-page',
    async (_event, dataPath: string, serieName?: string) => {
      try {
        const sDPath = serieName
          ? await fileManager.getDataPath(serieName)
          : dataPath;

        const [literatureForm, serieData] = await Promise.all([
          fileManager.foundLiteratureForm(sDPath),
          storageManager.readSerieData(sDPath),
        ]);

        if (!serieData) {
          return { success: false, error: 'Falha em recuperar dados' };
        }

        let serieLink: string | null = null;

        if (literatureForm === 'childSeries') {
          serieLink = `/TieIn/${encodeURIComponent(serieData.name)}`;
        } else if (['Comics', 'Mangas'].includes(literatureForm)) {
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

  // Reordenar séries
}
