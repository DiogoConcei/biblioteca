export {};
import { contextBridge, ipcRenderer, webUtils } from "electron";
import { Manga } from "./types/manga.interfaces";
import { Book } from "./types/book.interfaces";
import { Comic } from "./types/comic.interfaces";
import { Collection } from "./types/collections.interfaces";
import {
  SerieForm,
  SeriesProcessor,
  LiteratureForms,
} from "./types/series.interfaces";

const windowAction = {
  minimize: () => ipcRenderer.invoke("minimize-window"),
  fullScreen: () => ipcRenderer.invoke("fullScreen-window"),
  close: () => ipcRenderer.invoke("close-window"),
  restore: () => ipcRenderer.invoke("restore-window"),
};

const webUtilities = {
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
};

const upload = {
  localUpload: (filePaths: string[]): Promise<SeriesProcessor[]> =>
    ipcRenderer.invoke("localUpload", filePaths),
  decodePathFile: (serieName: string, codePath: string): Promise<string> =>
    ipcRenderer.invoke("save-dinamic-cover", serieName, codePath),
};

const series = {
  createSerie: (serieData: SerieForm): Promise<void> =>
    ipcRenderer.invoke("create-serie", serieData),
  getSeries: async (): Promise<Comic[]> => ipcRenderer.invoke("get-all-series"),
};

const manga = {
  getManga: async (serieName: string): Promise<Manga> =>
    ipcRenderer.invoke("get-manga-serie", serieName),
  coverDinamic: async (
    archivesPath: string,
    literatureForm: LiteratureForms
  ): Promise<string[]> =>
    ipcRenderer.invoke("dinamic-cover", archivesPath, literatureForm),
};

const comic = {
  getComic: async (serieName: string): Promise<Comic> =>
    ipcRenderer.invoke("get-comic-serie", serieName),
};

const book = {
  getBook: async (serieName: string): Promise<Book> =>
    ipcRenderer.invoke("get-book-series", serieName),
};

const download = {
  multipleDownload: async (
    dataPath: string,
    quantity: number
  ): Promise<boolean> =>
    ipcRenderer.invoke("multiple-download", dataPath, quantity),
  singleDownload: async (
    dataPath: string,
    chapter_id: number
  ): Promise<boolean> =>
    ipcRenderer.invoke("single-download", dataPath, chapter_id),
  readingDownload: async (
    serieName: string,
    chapter_id: number
  ): Promise<boolean> =>
    ipcRenderer.invoke("donwload-in-reading", serieName, chapter_id),
  checkDownload: async (
    serieName: string,
    chapter_id: number
  ): Promise<boolean> =>
    ipcRenderer.invoke("check-download", serieName, chapter_id),
};

const eventEmitter = {
  on: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
  },
};

const chapters = {
  getChapter: async (
    serieName: string,
    chapter_id: number
  ): Promise<string[]> =>
    ipcRenderer.invoke("get-chapter", serieName, chapter_id),
  getNextChapter: async (
    serieName: string,
    chapter_id: number
  ): Promise<string> =>
    ipcRenderer.invoke("get-next-chapter", serieName, chapter_id),
  getPrevChapter: async (
    serieName: string,
    chapter_id: number
  ): Promise<string> =>
    ipcRenderer.invoke("get-prev-chapter", serieName, chapter_id),
  saveLastRead: async (
    serieName: string,
    chapter_id: number,
    page_number: number
  ): Promise<void> =>
    ipcRenderer.invoke("save-last-read", serieName, chapter_id, page_number),
  acessLastRead: async (serieName: string): Promise<string> =>
    ipcRenderer.invoke("acess-last-read", serieName),
};

const collections = {
  getCollections: async (): Promise<Collection[]> =>
    ipcRenderer.invoke("get-collections"),
  createCollection: async (collectionName: string): Promise<void> =>
    ipcRenderer.invoke("create-collection", collectionName),
  serieToCollection: async (dataPath: string) =>
    ipcRenderer.invoke("serie-to-collection", dataPath),
  getFavSeries: async (): Promise<Collection> =>
    ipcRenderer.invoke("get-fav-series"),
};

const userAction = {
  ratingSerie: (
    dataPath: string,
    userRating: number
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("rating-serie", dataPath, userRating),
  favoriteSerie: (dataPath: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("favorite-serie", dataPath),
  markRead: async (
    dataPath: string,
    chapter_id: number,
    isRead: boolean
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("mark-read", dataPath, chapter_id, isRead),
  returnPage: async (serieName: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("return-page", serieName),
};

const AppConfig = {
  getScreenConfig: (urlLocation: string): Promise<boolean> =>
    ipcRenderer.invoke("get-screen-config", urlLocation),
  getThemeConfig: (): Promise<string> => ipcRenderer.invoke("get-theme-config"),
  controlScreen: async (): Promise<boolean> =>
    ipcRenderer.invoke("control-full-screen"),
  switchTheme: async (): Promise<boolean> =>
    ipcRenderer.invoke("switch-theme-color"),
};

const contextMenu = {
  show: () => ipcRenderer.send("show-context-menu"),
  excluir: (itemName: string): Promise<void> =>
    ipcRenderer.invoke("context-menu-excluir", itemName),
  deletar: (itemName: string): Promise<void> =>
    ipcRenderer.invoke("context-menu-deletar", itemName),
  renomear: (oldName: string, newName: string): Promise<void> =>
    ipcRenderer.invoke("context-menu-renomear", oldName, newName),
};

contextBridge.exposeInMainWorld("electron", {
  windowAction,
  webUtilities,
  upload,
  series,
  manga,
  comic,
  book,
  download,
  eventEmitter,
  chapters,
  collections,
  userAction,
  AppConfig,
  contextMenu,
});
