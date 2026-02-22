export {};

import {
  childSerie,
  ComicTieIn,
  TieIn,
} from 'electron/types/comic.interfaces.js';
import { childSerie, ComicTieIn } from 'electron/types/comic.interfaces.js';
import { CreateCollectionDTO } from './collections.interfaces.js';
import {
  Literatures,
  viewData,
  APIResponse,
  LiteratureChapter,
} from '../../electron/types/electron-auxiliar.interfaces.js';
import { SerieData, SerieEditForm, SerieForm } from './series.interfaces.ts';
import {
  Collection,
  SerieInCollection,
  ScrapedMetadata,
} from './collections.interfaces';
import {
  ComicCoverRegenerationResult,
  SystemResult,
} from './settings.interfaces';

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
        readFileAsDataUrl: (path: string) => string;
      };

      upload: {
        processSerie: (filePath: string[]) => APIResponse<SerieData>;
        processSeries: (
          filePaths: string[],
        ) => Promise<APIResponse<SerieData[]>>;
        uploadSerie: (
          serieData: SerieForm,
        ) => Promise<ResAPIResponseponse<SerieForm>>;
        uploadSeries: (
          serieData: SerieForm[],
        ) => Promise<ResAPIResponseponse<SerieForm>>;
        uploadChapter: (
          files: string[],
          literatureForm: string,
          dataPath: string,
        ) => Promise<APIResponse<LiteratureChapter[]>>;
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
        createTieIn: (
          childSerie: ComicTieIn,
        ) => Promise<APIResponse<string | null>>;
        serieToCollection: (
          dataPath: string,
          collectionName: string,
        ) => Promise<APIResponse<void>>;
        favoriteSerie: (
          dataPath: string,
        ) => Promise<APIResponse<SerieInCollection>>;
        recentSerie: (
          dataPath: string,
          serie_name: string,
        ) => Promise<APIResponse<void>>;
        ratingSerie: (
          dataPath: string,
          userRating: number,
        ) => Promise<APIResponse<void>>;
        updateSerie: (data: SerieEditForm) => Promise<APIResponse<void>>;
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
          totalPages: number,
        ) => Promise<APIResponse<void>>;
        acessLastRead: (
          serieId: number,
        ) => Promise<APIResponse<[string, Literatures | TieIn]>>;
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
        quicklyCreate: (
          collectionName: string,
        ) => Promise<APIResponse<boolean>>;
        createCollection: (
          collection: Omit<Collection, 'createdAt' | 'updatedAt'>,
        ) => Promise<APIResponse<boolean>>;
        deleteCollection: (
          collectionName: string,
        ) => Promise<APIResponse<void>>;
        updateCollection: (
          collectionName: string,
          payload: Partial<
            Pick<Collection, 'description' | 'coverImage' | 'name'>
          >,
        ) => Promise<APIResponse<void>>;
        removeSerie: (
          collectionName: string,
          serieId: number,
          keepEmpty?: boolean,
        ) => Promise<APIResponse<string>>;
        reorderSeries: (
          collectionName: string,
          orderedSeriesIds: number[],
        ) => Promise<APIResponse<void>>;
        updateSerieBackground: (
          collectionName: string,
          serieId: number,
          path: string | null,
        ) => Promise<APIResponse<void>>;
        fetchMetadata: (
          title: string,
          type: 'manga' | 'comic',
          year?: number,
          author?: string,
        ) => Promise<APIResponse<ScrapedMetadata>>;
        getFavSeries: () => Promise<APIResponse<Collection>>;
      };

      system: {
        createBackup: (options?: {
          encrypt?: boolean;
          password?: string;
          description?: string;
          includeLargeFiles?: boolean;
        }) => Promise<APIResponse<undefined> & { path?: string }>;
        resetApplication: (options: {
          level: 'soft' | 'full';
          backupBefore?: boolean;
          preserve?: string[];
        }) => Promise<APIResponse<void>>;
        getBackupList: () => Promise<
          APIResponse<
            Array<{
              id: string;
              path: string;
              createdAt: string;
              description?: string;
              encrypted?: boolean;
            }>
          >
        >;
        restoreBackup: (backupPath: string) => Promise<APIResponse<void>>;
        removeBackup: (backupPath: string) => Promise<APIResponse<void>>;
        getSettings: () => Promise<APIResponse<Record<string, unknown>>>;
        setSettings: (
          settings: Record<string, unknown>,
        ) => Promise<APIResponse<void>>;
        connectDrive: () => Promise<APIResponse<void>>;
        disconnectDrive: () => Promise<APIResponse<void>>;
        exportLogs: () => Promise<APIResponse<undefined> & { path?: string }>;
        clearLogs: () => Promise<APIResponse<void>>;
        createDebugBundle: () => Promise<
          APIResponse<undefined> & { path?: string }
        >;
        pickImage: () => Promise<APIResponse<string | null>>;
        regenerateComicCovers: () => Promise<
          SystemResult<ComicCoverRegenerationResult>
        >;
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
