import { IpcMain } from 'electron';
import SystemManager from '../services/SystemManager.ts';
import StorageManager from '../services/StorageManager.ts';
import CollectionsManager from '../services/CollectionManager';
import FileManager from '../services/FileManager.ts';
import ImageManager from '../services/ImageManager.ts';
import UserManager from '../services/UserManager.ts';
import TieInManager from '../services/TieInManager.ts';
import { ComicTieIn, TieIn } from '../types/comic.interfaces.ts';
import { SerieEditForm } from '../../src/types/series.interfaces.ts';
import { Literatures } from '../types/electron-auxiliar.interfaces.ts';

export default function systemHandlers(ipcMain: IpcMain) {
  const systemManager = new SystemManager();
  // Auto backup

  ipcMain.handle('system:reorder-id', async (_event) => {
    try {
      return await systemManager.fixId();
    } catch (e) {
      console.error(`Falha na requisicao `);
      return false;
    }
  });
}
