import { ipcMain } from 'electron';
import uploadHandlers from './uploadHandlers';

export function registerHandlers() {
  uploadHandlers(ipcMain);
}
