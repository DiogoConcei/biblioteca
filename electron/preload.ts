import { ipcRenderer, contextBridge, webUtils } from 'electron';
import {
  APIResponse,
  viewData,
  LiteratureChapter,
  Literatures,
} from './types/electron-auxiliar.interfaces.ts';
import {
  SerieData,
  SerieEditForm,
  SerieForm,
} from '../src/types/series.interfaces.ts';
import { Collection } from '../src/types/collections.interfaces.ts';
import { ComicTieIn, TieIn } from './types/comic.interfaces.ts';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
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
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  webUtilities: {
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
    readFileAsDataUrl: (path: string) =>
      ipcRenderer.invoke('web:readFileAsDataUrl', path),
  },

  upload: {
    processSerie: (filePaths: string[]): Promise<APIResponse<SerieData[]>> =>
      ipcRenderer.invoke('upload:process-data', filePaths),
    uploadSerie: (serieData: SerieForm): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('upload:process-serie', serieData),
    uploadSeries: (serieData: SerieForm[]): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('upload:process-series', serieData),
    uploadChapter: async (
      files: string[],
      literatureForm: string,
      dataPath: string,
    ): Promise<APIResponse<LiteratureChapter[]>> =>
      ipcRenderer.invoke(
        'chapter:upload-chapter',
        files,
        literatureForm,
        dataPath,
      ),
  },

  series: {
    getSeries: async (): Promise<APIResponse<viewData[]>> =>
      ipcRenderer.invoke('serie:get-all'),
    getTieIn: async (serieName: string): Promise<APIResponse<TieIn | null>> =>
      ipcRenderer.invoke('serie:get-TieIn', serieName),
    getManga: async (
      serieName: string,
    ): Promise<APIResponse<Literatures | null>> =>
      ipcRenderer.invoke('serie:manga-serie', serieName),
    getComic: async (
      serieName: string,
    ): Promise<APIResponse<Literatures | null>> =>
      ipcRenderer.invoke('serie:comic-serie', serieName),
    createTieIn: async (
      childSerie: ComicTieIn,
    ): Promise<APIResponse<string | null>> =>
      ipcRenderer.invoke('serie:create-TieIn', childSerie),
    serieToCollection: async (
      dataPath: string,
      collectionName: string,
    ): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('serie:add-to-collection', dataPath, collectionName),
    ratingSerie: (
      dataPath: string,
      userRating: number,
    ): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('serie:rating', dataPath, userRating),
    favoriteSerie: (dataPath: string): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('serie:favorite', dataPath),
    recentSerie: (
      dataPath: string,
      serie_name: string,
    ): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('serie:recent-read', dataPath, serie_name),
    updateSerie: (data: SerieEditForm): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('serie:update-serie', data),
    readFileAsDataUrl: (path: string) =>
      ipcRenderer.invoke('web:readFileAsDataUrl', path),
  },

  chapters: {
    getChapter: async (
      serieName: string,
      chapter_id: number,
    ): Promise<APIResponse<string[]>> =>
      ipcRenderer.invoke('chapter:get-single', serieName, chapter_id),
    saveLastRead: async (
      serieName: string,
      chapter_id: number,
      page_number: number,
      totalPages: number,
    ): Promise<APIResponse<void>> =>
      ipcRenderer.invoke(
        'chapter:save-last-read',
        serieName,
        chapter_id,
        page_number,
        totalPages,
      ),
    acessLastRead: async (
      serieName: string,
    ): Promise<APIResponse<[string, Literatures]>> =>
      ipcRenderer.invoke('chapter:acess-last-read', serieName),
    getNextChapter: async (
      serieName: string,
      chapter_id: number,
    ): Promise<APIResponse<string>> =>
      ipcRenderer.invoke('chapter:get-next-chapter', serieName, chapter_id),
    getPrevChapter: async (
      serieName: string,
      chapter_id: number,
    ): Promise<APIResponse<string>> =>
      ipcRenderer.invoke('chapter:get-prev-chapter', serieName, chapter_id),
  },

  collections: {
    getCollections: async (): Promise<APIResponse<Collection[]>> =>
      ipcRenderer.invoke('collection:get-all'),
    createCollection: async (
      collectionName: string,
    ): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('collection:create', collectionName),
    getFavSeries: async (): Promise<APIResponse<Collection>> =>
      ipcRenderer.invoke('collection:get-all-fav'),
  },

  userAction: {
    markRead: async (
      dataPath: string,
      chapter_id: number,
      isRead: boolean,
    ): Promise<APIResponse<void>> =>
      ipcRenderer.invoke('chapter:mark-read', dataPath, chapter_id, isRead),
    returnPage: async (
      dataPath: string,
      serieName?: string,
    ): Promise<APIResponse<string>> =>
      ipcRenderer.invoke('chapter:return-page', dataPath, serieName),
  },

  download: {
    multipleDownload: async (
      dataPath: string,
      quantity: number,
    ): Promise<boolean> =>
      ipcRenderer.invoke('donwload:multiple', dataPath, quantity),
    singleDownload: async (
      dataPath: string,
      chapter_id: number,
    ): Promise<boolean> =>
      ipcRenderer.invoke('download:single', dataPath, chapter_id),
    singleRemove: async (
      dataPath: string,
      chapter_id: number,
    ): Promise<boolean> =>
      ipcRenderer.invoke('download:delete', dataPath, chapter_id),

    readingDownload: async (
      serieName: string,
      chapter_id: number,
    ): Promise<boolean> =>
      ipcRenderer.invoke('download:reading', serieName, chapter_id),
    checkDownload: async (
      serieName: string,
      chapter_id: number,
    ): Promise<boolean> =>
      ipcRenderer.invoke('download:check', serieName, chapter_id),
  },
});
