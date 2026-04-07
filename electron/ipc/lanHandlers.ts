import { IpcMain } from 'electron';

import { lanServer } from '../services/LanServer';

export default function lanHandlers(ipcMain: IpcMain) {
  ipcMain.handle('lan:start', async () => {
    try {
      const status = await lanServer.start();
      return { success: true, ...status };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('lan:stop', async () => {
    try {
      await lanServer.stop();
      return { success: true, ...lanServer.getStatus() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('lan:status', () => {
    return { success: true, ...lanServer.getStatus() };
  });
}
