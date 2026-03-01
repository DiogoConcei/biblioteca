import { BrowserWindow, dialog, IpcMain } from 'electron';

import SystemManager from '../services/SystemManager';

export default function systemHandlers(ipcMain: IpcMain) {
  const systemManager = new SystemManager();

  ipcMain.handle('system:create-backup', async (_event, options) => {
    try {
      return await systemManager.createBackup(options);
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
        await systemManager.restoreBackup(backupPath);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  );

  ipcMain.handle('system:remove-backup', async (_event, backupPath: string) => {
    try {
      await systemManager.removeBackup(backupPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:get-settings', async () => {
    try {
      const data = await systemManager.getSettings();
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

  ipcMain.handle('system:reset-application', async (_event, options) => {
    try {
      await systemManager.resetApplication(options);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:connect-drive', async () =>
    systemManager.setDriveConnection(true),
  );
  ipcMain.handle('system:disconnect-drive', async () =>
    systemManager.setDriveConnection(false),
  );
  ipcMain.handle('system:export-logs', async () => systemManager.exportLogs());
  ipcMain.handle('system:clear-logs', async () => systemManager.clearLogs());
  ipcMain.handle('system:create-debug-bundle', async () =>
    systemManager.createDebugBundle(),
  );
}
