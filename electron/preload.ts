import { ipcRenderer, contextBridge, webUtils } from "electron";

import {
  SerieData,
  SerieForm,
  viewData,
  Response,
  Literatures,
} from "../src/types/series.interfaces.ts";
import { Collection } from "../src/types/collections.interfaces.ts";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electronAPI", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  emit: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),

  windowAction: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
    close: () => ipcRenderer.invoke("window:close"),
  },

  webUtilities: {
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  },

  upload: {
    processSerie: (filePaths: string[]): Promise<Response<SerieData[]>> =>
      ipcRenderer.invoke("upload:process-data", filePaths),
    uploadSerie: (serieData: SerieForm): Promise<Response<void>> =>
      ipcRenderer.invoke("upload:process-serie", serieData),
  },

  series: {
    getSeries: async (): Promise<Response<viewData[]>> =>
      ipcRenderer.invoke("serie:get-all"),
    getManga: async (
      serieName: string
    ): Promise<Response<Literatures | null>> =>
      ipcRenderer.invoke("serie:manga-serie", serieName),
    getComic: async (
      serieName: string
    ): Promise<Response<Literatures | null>> =>
      ipcRenderer.invoke("serie:comic-serie", serieName),
    serieToCollection: async (dataPath: string): Promise<Response<void>> =>
      ipcRenderer.invoke("serie:add-to-collection", dataPath),
    ratingSerie: (
      dataPath: string,
      userRating: number
    ): Promise<Response<void>> =>
      ipcRenderer.invoke("serie:rating", dataPath, userRating),
    favoriteSerie: (dataPath: string): Promise<Response<void>> =>
      ipcRenderer.invoke("serie:favorite", dataPath),
    recentSerie: (dataPath: string): Promise<Response<void>> =>
      ipcRenderer.invoke("serie:recent-read", dataPath),
  },

  chapters: {
    getChapter: async (
      serieName: string,
      chapter_id: number
    ): Promise<Response<string[]>> =>
      ipcRenderer.invoke("chapter:get-single", serieName, chapter_id),
    saveLastRead: async (
      serieName: string,
      chapter_id: number,
      page_number: number
    ): Promise<Response<void>> =>
      ipcRenderer.invoke(
        "chapter:save-last-read",
        serieName,
        chapter_id,
        page_number
      ),
    acessLastRead: async (serieName: string): Promise<Response<string>> =>
      ipcRenderer.invoke("chapter:acess-last-read", serieName),
    getNextChapter: async (
      serieName: string,
      chapter_id: number
    ): Promise<Response<string>> =>
      ipcRenderer.invoke("get-next-chapter", serieName, chapter_id),
    getPrevChapter: async (
      serieName: string,
      chapter_id: number
    ): Promise<Response<string>> =>
      ipcRenderer.invoke("get-prev-chapter", serieName, chapter_id),
  },

  collections: {
    getCollections: async (): Promise<Response<Collection[]>> =>
      ipcRenderer.invoke("collection:get-all"),
    createCollection: async (collectionName: string): Promise<Response<void>> =>
      ipcRenderer.invoke("collection:create", collectionName),
    getFavSeries: async (): Promise<Response<Collection>> =>
      ipcRenderer.invoke("collection:get-all-fav"),
  },

  userAction: {
    markRead: async (
      dataPath: string,
      chapter_id: number,
      isRead: boolean
    ): Promise<Response<void>> =>
      ipcRenderer.invoke("chapter:mark-read", dataPath, chapter_id, isRead),
    returnPage: async (
      dataPath: string,
      serieName?: string
    ): Promise<Response<string>> =>
      ipcRenderer.invoke("chapter:return-page", serieName, dataPath),
  },

  download: {
    multipleDownload: async (
      dataPath: string,
      quantity: number
    ): Promise<boolean> =>
      ipcRenderer.invoke("donwload:multiple", dataPath, quantity),
    singleDownload: async (
      dataPath: string,
      chapter_id: number
    ): Promise<boolean> =>
      ipcRenderer.invoke("download:single", dataPath, chapter_id),
    singleRemove: async (
      dataPath: string,
      chapter_id: number
    ): Promise<boolean> =>
      ipcRenderer.invoke("download:delete", dataPath, chapter_id),

    readingDownload: async (
      serieName: string,
      chapter_id: number
    ): Promise<boolean> =>
      ipcRenderer.invoke("download:reading", serieName, chapter_id),
    checkDownload: async (
      serieName: string,
      chapter_id: number
    ): Promise<boolean> =>
      ipcRenderer.invoke("download:check", serieName, chapter_id),
  },
});
