import { ipcMain } from 'electron';

import uploadHandlers from './uploadHandlers.ts';

import seriesHandlers from './seriesHandlers.ts';
import collectionHandlers from './collectionHandlers.ts';
import downloadHandlers from './downloadHandlers.ts';
import userHandlers from './userHandlers.ts';
import chaptersHandlers from './chaptersHandlers.ts';
import systemHandlers from './systemHandlers.ts';
import lanHandlers from './lanHandlers.ts';
import historyHandlers from './historyHandlers.ts';
import imageHandlers from './imageHandlers.ts';
import metadataHandlers from './metadataHandlers.ts';

export function registerHandlers() {
  uploadHandlers(ipcMain);
  seriesHandlers(ipcMain);
  collectionHandlers(ipcMain);
  userHandlers(ipcMain);
  chaptersHandlers(ipcMain);
  downloadHandlers(ipcMain);
  systemHandlers(ipcMain);
  lanHandlers(ipcMain);
  historyHandlers(ipcMain);
  imageHandlers(ipcMain);
  metadataHandlers(ipcMain);
}
