import { contextBridge, ipcRenderer, webUtils } from "electron";
import { Comic, ComicCollectionInfo } from "./types/comic.interfaces";

const windowAction = {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  fullScreen: () => ipcRenderer.invoke("fullScreen-window"),
  close: () => ipcRenderer.invoke("close-window"),
};

const userAction = {
  ratingSerie: (serieName: string, userRating: number): Promise<void> => ipcRenderer.invoke("rating-serie", serieName, userRating),
  favoriteSerie: (serieName: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("favorite-serie", serieName),
  markRead: async (serieName: string, chapter_id: number): Promise<void> => ipcRenderer.invoke("mark-read", serieName, chapter_id)
}

const collections = {
  getFavSeries: async (): Promise<ComicCollectionInfo> => ipcRenderer.invoke("get-favSeries"),
}

const chapters = {
  getChapter: async (serieName: string, chapter_id: number): Promise<string[] | string> => ipcRenderer.invoke("get-chapter", serieName, chapter_id),
  getNextChapter: async (serieName: string, chapter_id: number): Promise<string> => ipcRenderer.invoke("get-next-chapter", serieName, chapter_id),
  getPrevChapter: async (serieName: string, chapter_id: number): Promise<string> => ipcRenderer.invoke("get-prev-chapter", serieName, chapter_id),
  saveLastRead: async (serieName: string, chapter_id: number, page_number: number): Promise<void> => ipcRenderer.invoke("save-last-read", serieName, chapter_id, page_number),
  acessLastRead: async (serieName: string): Promise<string> => ipcRenderer.invoke("acess-last-read", serieName),
}

const series = {
  createSerie: (filePaths: string[]): Promise<void> =>
    ipcRenderer.invoke("create-serie", filePaths),
  getSeries: async (): Promise<Comic[]> => ipcRenderer.invoke("get-all-series"),
  getSerie: async (serieName: string): Promise<Comic> =>
    ipcRenderer.invoke("get-serie", serieName),
};


const download = {
  downloadLocal: (serieName: string, quantity: number): Promise<void> =>
    ipcRenderer.invoke("download-chapter", serieName, quantity),
  lineReading: (serieName: string, chapter_id: number): Promise<void> => ipcRenderer.invoke("download-in-reading", serieName, chapter_id),
};

const upload = {
  localUpload: (filePaths: string[]): Promise<string[]> =>
    ipcRenderer.invoke("localUpload", filePaths),
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
  windowAction,
  userAction,
  collections,
  chapters,
  series,
  download,
  upload,
  webUtilities,
  eventEmitter
});
