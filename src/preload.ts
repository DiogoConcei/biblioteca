import { contextBridge, ipcRenderer, webUtils } from "electron";
import { Manga } from "./types/manga.interfaces";
import { Book } from "./types/book.interfaces";
import { Comic } from "./types/comic.interfaces";
import { Collections } from "./types/collections.interfaces";
import { SerieForm } from "./types/series.interfaces";
import { SeriesProcessor, Literatures, NormalizedSerieData } from "./types/series.interfaces";

const windowAction = {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  fullScreen: () => ipcRenderer.invoke("fullScreen-window"),
  close: () => ipcRenderer.invoke("close-window"),
  restore: () => ipcRenderer.invoke("restore-window"),
};

const contextMenu = {
  show: () => ipcRenderer.send("show-context-menu"),
  excluir: (itemName: string): Promise<void> => ipcRenderer.invoke("context-menu-excluir", itemName),
  deletar: (itemName: string): Promise<void> => ipcRenderer.invoke("context-menu-deletar", itemName),
  renomear: (oldName: string, newName: string): Promise<void> => ipcRenderer.invoke("context-menu-renomear", oldName, newName),
};


const userAction = {
  ratingSerie: (data: Literatures, data_path: string, userRating: number): Promise<{ success: boolean }> => ipcRenderer.invoke("rating-serie", data, userRating, data_path),
  favoriteSerie: (data: Literatures, data_path: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("favorite-serie", data, data_path),
  markRead: async (chapter_id: number, data: Literatures, data_path: string): Promise<{ success: boolean }> => ipcRenderer.invoke("mark-read", data, chapter_id, data_path),
}

const AppConfig = {
  getScreenConfig: (urlLocation: string): Promise<boolean> => ipcRenderer.invoke("get-screen-config", urlLocation),
  getThemeConfig: (): Promise<string> => ipcRenderer.invoke("get-theme-config"),
  controlScreen: async (): Promise<boolean> => ipcRenderer.invoke("control-full-screen"),
  switchTheme: async (): Promise<boolean> => ipcRenderer.invoke("switch-theme-color"),
}

const collections = {
  getFavSeries: async (): Promise<Collections> => ipcRenderer.invoke("get-fav-series"),
  addToCollection: async (serieData: NormalizedSerieData) => ipcRenderer.invoke("add-to-collection", serieData),
  createCollection: async (collectionName: string): Promise<void> => ipcRenderer.invoke("create-collection")
}

const chapters = {
  getChapter: async (serieName: string, chapter_id: number): Promise<string[] | string> => ipcRenderer.invoke("get-chapter", serieName, chapter_id),
  getNextChapter: async (serieName: string, chapter_id: number): Promise<string> => ipcRenderer.invoke("get-next-chapter", serieName, chapter_id),
  getPrevChapter: async (serieName: string, chapter_id: number): Promise<string> => ipcRenderer.invoke("get-prev-chapter", serieName, chapter_id),
  saveLastRead: async (serieName: string, chapter_id: number, page_number: number): Promise<void> => ipcRenderer.invoke("save-last-read", serieName, chapter_id, page_number),
  acessLastRead: async (serieName: string): Promise<string> => ipcRenderer.invoke("acess-last-read", serieName),
}

const series = {
  createSerie: (serieData: SerieForm): Promise<void> =>
    ipcRenderer.invoke("create-serie", serieData),
  getSeries: async (): Promise<Comic[]> => ipcRenderer.invoke("get-all-series"),
  getManga: async (serieName: string): Promise<Manga> =>
    ipcRenderer.invoke("get-manga-series", serieName),
  getComic: async (serieName: string): Promise<Comic> =>
    ipcRenderer.invoke("get-comic-series", serieName),
  getBook: async (serieName: string): Promise<Book> =>
    ipcRenderer.invoke("get-book-series", serieName),

};

const download = {
  downloadLocal: (dataPath: string, quantity: number): Promise<void> =>
    ipcRenderer.invoke("download-chapter", dataPath, quantity),
  lineReading: (serieName: string, chapter_id: number): Promise<void> => ipcRenderer.invoke("download-in-reading", serieName, chapter_id),
  downloadIndividual: (serieName: string, chapter_id: number): Promise<void> => ipcRenderer.invoke("download-individual", serieName, chapter_id)
};

const upload = {
  localUpload: (filePaths: string[]): Promise<SeriesProcessor[]> =>
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
  contextMenu,
  userAction,
  AppConfig,
  collections,
  chapters,
  series,
  download,
  upload,
  webUtilities,
  eventEmitter
});
