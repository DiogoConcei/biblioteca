import { contextBridge, ipcRenderer, webUtils } from "electron";
import { Comic } from "./types/serie.interfaces";

const windowControl = {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  fullScreen: () => ipcRenderer.invoke("fullScreen-window"),
  close: () => ipcRenderer.invoke("close-window"),
};

const seriesManager = {
  getSeries: async (): Promise<Comic[]> =>
    ipcRenderer.invoke("get-all-series"),
  getSerie: async (serieName: string): Promise<Comic> => ipcRenderer.invoke("get-serie", serieName),
  createSerie: (filePaths: string[]): Promise<void> =>
    ipcRenderer.invoke("create-serie", filePaths),
  handleDrop: (files: string[]): Promise<string[]> =>
    ipcRenderer.invoke("file:handleDrop", files),
  favoriteSerie: (serieName: string, is_favorite: boolean): Promise<void> =>
    ipcRenderer.invoke("favorite-serie", serieName, is_favorite),
  downloadSerie: (seriePath: string, quantity: number): Promise<void> => ipcRenderer.invoke("donwload-chapter", seriePath, quantity)
};

const eventEmitt = {
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
  },
}

const webUtilities = {
  getPathForFile: (file: File) => {
    return webUtils.getPathForFile(file);
  },
};

contextBridge.exposeInMainWorld("electron", {
  ...windowControl,
  ...seriesManager,
  ...eventEmitt,
  webUtils: webUtilities,
});
