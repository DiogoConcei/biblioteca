export {};
import { Manga } from "./manga.interfaces";
import { Comic } from "./comic.interfaces";
import { Book } from "./book.interfaces";
import { Collections } from "./collections.interfaces";
import { SeriesProcessor, SerieForm, Literatures } from "./series.interfaces";

declare global {
  interface Window {
    electron: {
      windowAction: {
        minimize: () => void;
        fullScreen: () => void;
        close: () => void;
        restore: () => void;
      };

      webUtilities: {
        getPathForFile: (file: File) => string;
      };

      upload: {
        localUpload: (filePaths: string[]) => Promise<SeriesProcessor[]>;
        decodePathFile: (
          serieName: string,
          codePath: string
        ) => Promise<string>;
      };

      series: {
        createSerie: (serieData: SerieForm) => Promise<void>;
        getSeries: () => ExhibitionSerieData[];
      };

      manga: {
        getManga: (serieName: string) => Manga;
        coverDinamic: (
          archivesPath: string,
          literatureForm: LiteratureForms
        ) => Promise<string[]>;
      };

      comic: {
        getComic: (serieName: string) => Comic;
      };

      book: {
        getBook: (serieName: string) => Book;
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
        readingDownload: (
          serieName: string,
          chapter_id: number
        ) => Promise<boolean>;
        checkDownload: (
          serieName: string,
          chapter_id: number
        ) => Promise<boolean>;
      };

      eventEmitter: {
        on: (channel: string, listener: (...args: any[]) => void) => void;
        off: (channel: string, listener: (...args: any[]) => void) => void;
      };

      chapters: {
        getChapter: (
          serieName: string,
          chapter_id: number
        ) => Promise<string[]>;
        getNextChapter: (
          serieName: string,
          chapter_id: number
        ) => Promise<string>;
        getPrevChapter: (
          serieName: string,
          chapter_id: number
        ) => Promise<string>;
        saveLastRead: (
          serieName: string,
          chapter_id: number,
          page_number: number
        ) => Promise<void>;
        acessLastRead: (serieName: string) => Promise<string>;
      };

      collections: {
        getCollections: () => Promise<Collection[]>;
        createCollection: (collectionName: string) => Promise<void>;
        serieToCollection: (dataPath: string) => Promise<void>;
        getFavSeries: () => Promise<Collections>;
      };

      userAction: {
        favoriteSerie: (dataPath: string) => Promise<{ success: boolean }>;
        ratingSerie: (
          dataPath: string,
          userRating: number
        ) => Promise<{ success: boolean }>;
        markRead: (
          dataPath: string,
          chapter_id: number,
          isRead: boolean
        ) => Promise<{ success: boolean }>;
        returnPage: (dataPath: string) => Promise<string>;
      };

      AppConfig: {
        getScreenConfig: (urlLocation: string) => Promise<boolean>;
        controlScreen: () => Promise<boolean>;
        getThemeConfig: () => Promise<boolean>;
        switchTheme: () => Promise<boolean>;
      };

      contextMenu: {
        show: () => void;
        excluir: (itemName: string) => Promise<void>;
        deletar: (itemName: string) => Promise<void>;
        renomear: (oldName: string, newName: string) => Promise<void>;
      };
    };
  }
}
