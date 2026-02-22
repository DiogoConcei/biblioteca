import { BrowserWindow, IpcMain } from 'electron';
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

  ipcMain.handle('system:create-backup', async (_event, options) => {
    try {
      return await systemManager.createBackup(options);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:reset-application', async (_event, options) => {
    try {
      await systemManager.resetApplication(options);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:regenerate-comic-covers', async () => {
    try {
      const data = await systemManager.regenerateComicCovers((progress) => {
        for (const window of BrowserWindow.getAllWindows()) {
          window.webContents.send(
            'system:comic-cover-regeneration-progress',
            progress,
          );
        }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:get-backup-list', async () => {
    try {
      const data = await systemManager.getBackupList();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:set-settings', async (_event, settings) => {
    try {
      await systemManager.setSettings(settings);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
