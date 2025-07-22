export {};

import {
  Literatures,
  Response,
  SerieData,
  viewData,
} from "./series.interfaces.ts";
// import { Manga } from '../../electron/types/manga.interfaces.ts';
// import { Comic } from '../../electron/types/comic.interfaces.ts';
// import { Book } from '../../electron/types/book.interfaces.ts';
// import { Collections } from '../../electron/types/collections.interfaces.ts';
// import { SeriesProcessor, SerieForm, Literatures } from './series.interfaces.ts';

declare global {
  interface Window {
    electronAPI: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on: (channel: string, listener: (...args: any[]) => void) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      off: (channel: string, listener: (...args: any[]) => void) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      send: (channel: string, ...args: any[]) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      emit: (channel: string, ...args: any[]) => void;

      windowAction: {
        minimize: () => Promise<boolean>;
        toggleMaximize: () => Promise<boolean>;
        close: () => Promise<boolean>;
      };

      webUtilities: {
        getPathForFile: (file: File) => string;
      };

      upload: {
        processSerie: (filePaths: string[]) => Promise<Response<SerieData[]>>;
        uploadSerie: (serieData: SerieForm) => Promise<Response<SerieForm>>;
      };

      series: {
        getSeries: () => Promise<Response<viewData[]>>;
        getComic: (serieName: string) => Promise<Response<Literatures | null>>;
        getManga: (serieName: string) => Promise<Response<Literatures | null>>;
        serieToCollection: (dataPath: string) => Promise<Response<void>>;
        favoriteSerie: (dataPath: string) => Promise<Response<void>>;
        recentSerie: (dataPath: string) => Promise<Response<void>>;
        ratingSerie: (
          dataPath: string,
          userRating: number
        ) => Promise<Response<void>>;
      };

      chapters: {
        getChapter: (
          serieName: string,
          chapter_id: number
        ) => Promise<Response<string[]>>;
        saveLastRead: (
          serieName: string,
          chapter_id: number,
          page_number: number
        ) => Promise<Response<void>>;
        acessLastRead: (serieName: string) => Promise<Response<string>>;
        getNextChapter: (
          serieName: string,
          chapter_id: number
        ) => Promise<Response<string>>;
        getPrevChapter: (
          serieName: string,
          chapter_id: number
        ) => Promise<Response<string>>;
      };

      collections: {
        getCollections: () => Promise<Response<Collection[]>>;
        createCollection: (collectionName: string) => Promise<Response<void>>;
        getFavSeries: () => Promise<Response<Collection>>;
      };

      userAction: {
        markRead: (
          dataPath: string,
          chapter_id: number,
          isRead: boolean
        ) => Promise<Response<void>>;
        returnPage: (
          dataPath: string,
          serieName?: string
        ) => Promise<Response<string>>;
      };

      download: {
        multipleDownload: (
          dataPath: string,
          quantity: number
        ) => Promise<boolean>;
        singleDownload: (
          dataPath: string,
          chapter_id: number
        ) => Promise<boolean>;
        singleRemove: (
          dataPath: string,
          chapter_id: number
        ) => Promise<boolean>;

        readingDownload: (
          serieName: string,
          chapter_id: number
        ) => Promise<boolean>;
        checkDownload: (
          serieName: string,
          chapter_id: number
        ) => Promise<boolean>;
      };
    };
  }
}
