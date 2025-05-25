import { ipcMain } from 'electron';
import uploadHandlers from './uploadHandlers.ts';
import seriesHandlers from './seriesHandlers.ts';

export function registerHandlers() {
  uploadHandlers(ipcMain);
  seriesHandlers(ipcMain);
}
