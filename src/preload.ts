import { contextBridge, ipcRenderer, webUtils } from "electron";
import { Comic, ComicCollectionInfo } from "./types/comic.interfaces";

const windowAction = {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  fullScreen: () => ipcRenderer.invoke("fullScreen-window"),
  close: () => ipcRenderer.invoke("close-window"),
};

const series = {
  createSerie: (filePaths: string[]): Promise<void> =>
    ipcRenderer.invoke("create-serie", filePaths),
  getSeries: async (): Promise<Comic[]> => ipcRenderer.invoke("get-all-series"),
  getSerie: async (serieName: string): Promise<Comic> =>
    ipcRenderer.invoke("get-serie", serieName),
  getFavSeries: async (): Promise<ComicCollectionInfo> => ipcRenderer.invoke("get-favSeries"),
  getChapter: async (serieName: string, chapter_id: number): Promise<string[] | string> => ipcRenderer.invoke("get-chapter", serieName, chapter_id)
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
