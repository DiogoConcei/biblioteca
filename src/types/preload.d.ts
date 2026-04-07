export {};

import { ComicTieIn, TieIn } from 'electron/types/comic.interfaces.js';
import { DownloadTask } from 'electron/types/download.interfaces.js';

import {
  Collection,
  SerieInCollection,
  ScrapedMetadata,
} from './collections.interfaces.js';
import {
  Literatures,
  viewData,
  APIResponse,
  LiteratureChapter,
} from '../../electron/types/electron-auxiliar.interfaces.js';
import { SerieData, SerieEditForm, SerieForm } from './series.interfaces.ts';
import {
  ComicCoverRegenerationResult,
  SystemResult,
  AppSettings,
} from './settings.interfaces';
import { MediaContent } from '../../electron/types/media.interfaces';

declare global {
  interface Window {
    electronAPI: {
      on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
      off: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
      send: (channel: string, ...args: unknown[]) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      emit: (channel: string, ...args: unknown[]) => void;

      windowAction: {
        minimize: () => Promise<boolean>;
        toggleMaximize: () => Promise<boolean>;
        close: () => Promise<boolean>;
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
        getSettings: () => Promise<APIResponse<AppSettings>>;
        setSettings: (
          settings: Partial<AppSettings>,
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

      lan: {
        start: () => Promise<{ success: boolean; active: boolean; url: string; token: string; error?: string }>;
        stop: () => Promise<{ success: boolean; active: boolean; url: string; token: string; error?: string }>;
        getStatus: () => Promise<{ success: boolean; active: boolean; url: string; token: string }>;
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
        ) => Promise<APIResponse<SerieForm>>;
        uploadSeries: (
          serieData: SerieForm[],
        ) => Promise<APIResponse<SerieForm[]>>;
        uploadChapter: (
          files: string[],
          literatureForm: string,
          dataPath: string,
        ) => Promise<APIResponse<LiteratureChapter[]>>;
      };

      series: {
        getSeries: () => Promise<APIResponse<viewData[]>>;
        getSerie: (
          serieName: string,
          literatureForm: string,
        ) => Promise<APIResponse<Literatures | TieIn>>;
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
        ) => Promise<APIResponse<MediaContent>>;
        saveLastRead: (
          serieName: string,
          chapter_id: number,
          page_number: number,
          totalPages: number,
          lastCfi?: string,
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
        ) => Promise<boolean>;
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

        getTasks: () => Promise<DownloadTask[]>;
        addTask: (taskData: Partial<DownloadTask>) => Promise<DownloadTask>;
        pauseTask: (taskId: string) => Promise<boolean>;
        resumeTask: (taskId: string) => Promise<boolean>;
        cancelTask: (taskId: string) => Promise<boolean>;
        clearCompleted: () => Promise<boolean>;
      };
    };
  }
}
