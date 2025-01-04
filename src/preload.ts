import { contextBridge, ipcRenderer, webUtils } from "electron";
import { Comic } from "./types/serie.interfaces";

const windowAction = {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  fullScreen: () => ipcRenderer.invoke("fullScreen-window"),
  close: () => ipcRenderer.invoke("close-window"),
};

const series = {
  getSeries: async (): Promise<Comic[]> => ipcRenderer.invoke("get-all-series"),
  getSerie: async (serieName: string): Promise<Comic> =>
    ipcRenderer.invoke("get-serie", serieName),
  createSerie: (filePaths: string[]): Promise<void> =>
    ipcRenderer.invoke("create-serie", filePaths),
};

const serieActions = {
  favoriteSerie: (serieName: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("favorite-serie", serieName),
  ratingSerie: (serieName: string, userRating: number): Promise<void> => ipcRenderer.invoke("rating-serie", serieName, userRating)

};

const download = {
  downloadSerie: (seriePath: string, quantity: number): Promise<void> =>
    ipcRenderer.invoke("download-chapter", seriePath, quantity),
};

const upload = {
  handleDrop: (filePaths: string[]): Promise<string[]> =>
    ipcRenderer.invoke("file:handleDrop", filePaths),
};

const webUtilities = {
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
};

const eventEmitter = {
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
  },
};

contextBridge.exposeInMainWorld("electron", {
  series,
  serieActions,
  download,
  windowAction,
  upload,
  webUtilities,
  eventEmitter,
});
