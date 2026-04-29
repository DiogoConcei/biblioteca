import { BrowserWindow, dialog, IpcMain } from 'electron';

import SystemManager from '../services/SystemManager';
import BackupManager from '../services/BackupManager';
import ConfigManager from '../services/ConfigManager';
import ComicManager from '../services/ComicManager';
import DownloadManager from '../services/DownloadManager';
import TieInManager from '../services/TieInManager';
import MigrationManager from '../services/MigrationManager';

export default function systemHandlers(ipcMain: IpcMain) {
  const systemManager = new SystemManager();
  const backupManager = new BackupManager();
  const configManager = new ConfigManager();
  const comicManager = new ComicManager();
  const downloadManager = new DownloadManager(null); // BrowserWindow will be set if needed, but for these calls it's mostly BG
  const tieInManager = new TieInManager();
  const migrationManager = new MigrationManager();

  ipcMain.handle('system:create-backup', async (_event, options) => {
    try {
      return await backupManager.createBackup(options);
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:regenerate-comic-covers', async () => {
    try {
      const data = await comicManager.regenerateComicCovers(tieInManager, (progress) => {
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
      const data = await backupManager.getBackupList();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:pick-image', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
        ],
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: true, data: null };
      }

      return { success: true, data: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(
    'system:restore-backup',
    async (_event, backupPath: string) => {
      try {
        await backupManager.restoreBackup(backupPath);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  );

  ipcMain.handle('system:remove-backup', async (_event, backupPath: string) => {
    try {
      await backupManager.removeBackup(backupPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:get-settings', async () => {
    try {
      const data = await configManager.getSettings();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:set-settings', async (_event, settings) => {
    try {
      await configManager.setSettings(settings);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:reset-application', async () => {
    try {
      // await systemManager.resetApplication(options);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:connect-drive', async () =>
    configManager.setDriveConnection(true),
  );
  ipcMain.handle('system:disconnect-drive', async () =>
    configManager.setDriveConnection(false),
  );
  ipcMain.handle('system:export-logs', async () => systemManager.exportLogs());
  ipcMain.handle('system:clear-logs', async () => systemManager.clearLogs());
  ipcMain.handle('system:create-debug-bundle', async () =>
    systemManager.createDebugBundle(),
  );

  ipcMain.handle('system:get-series-with-downloads', async () => {
    try {
      const data = await downloadManager.getSeriesWithDownloads();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(
    'system:regenerate-chapters',
    async (_event, dataPath: string) => {
      try {
        await migrationManager.fixChildSeriePaths(dataPath);
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Failed to regenerate chapters.' };
      }
    },
  );
}
