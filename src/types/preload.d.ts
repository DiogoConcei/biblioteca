export {};

import { childSerie, ComicTieIn } from 'electron/types/comic.interfaces.js';

import { Literatures, viewData, APIResponse } from './auxiliar.interfaces.js';
import { SerieData } from './series.interfaces.ts';

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
        processSerie: (
          filePaths: string[],
        ) => Promise<APIResponse<SerieData[]>>;
        uploadSerie: (
          serieData: SerieForm,
        ) => Promise<ResAPIResponseponse<SerieForm>>;
      };

      series: {
        getSeries: () => Promise<APIResponse<viewData[]>>;
        getComic: (
          serieName: string,
        ) => Promise<APIResponse<Literatures | null>>;
        getManga: (
          serieName: string,
        ) => Promise<APIResponse<Literatures | null>>;
        getTieIn: (
          SerieName: string,
        ) => Promise<APIResponse<childSerie | null>>;
        getSerieData: (
          serieName: string,
        ) => Promise<APIResponse<Literatures | null>>;
        createTieIn: (
          childSerie: ComicTieIn,
        ) => Promise<APIResponse<string | null>>;
        serieToCollection: (
          dataPath: string,
        ) => Promise<ResAPIResponseponse<void>>;
        favoriteSerie: (dataPath: string) => Promise<RespAPIResponseonse<void>>;
        recentSerie: (
          dataPath: string,
          serie_name: string,
        ) => Promise<APIResponse<void>>;
        ratingSerie: (
          dataPath: string,
          userRating: number,
        ) => Promise<APIResponse<void>>;
      };

      chapters: {
        getChapter: (
          serieName: string,
          chapter_id: number,
        ) => Promise<APIResponse<string[]>>;
        saveLastRead: (
          serieName: string,
          chapter_id: number,
          page_number: number,
        ) => Promise<APIResponse<void>>;
        acessLastRead: (
          serieName: string,
        ) => Promise<APIResponse<[string, Literatures]>>;
        getNextChapter: (
          serieName: string,
          chapter_id: number,
        ) => Promise<APIResponse<string>>;
        getPrevChapter: (
          serieName: string,
          chapter_id: number,
        ) => Promise<APIResponse<string>>;
      };

      collections: {
        getCollections: () => Promise<APIResponse<Collection[]>>;
        createCollection: (
          collectionName: string,
        ) => Promise<APIResponse<void>>;
        getFavSeries: () => Promise<APIResponse<Collection>>;
      };

      userAction: {
        markRead: (
          dataPath: string,
          chapter_id: number,
          isRead: boolean,
        ) => Promise<APIResponse<void>>;
        returnPage: (
          dataPath: string,
          serieName?: string,
        ) => Promise<APIResponse<string>>;
      };

      download: {
        multipleDownload: (
          dataPath: string,
          quantity: number,
        ) => Promise<boolean>;
        singleDownload: (
          dataPath: string,
          chapter_id: number,
        ) => Promise<boolean>;
        singleRemove: (
          dataPath: string,
          chapter_id: number,
        ) => Promise<boolean>;

        readingDownload: (
          serieName: string,
          chapter_id: number,
        ) => Promise<boolean>;
        checkDownload: (
          serieName: string,
          chapter_id: number,
        ) => Promise<boolean>;
      };
    };
  }
}
