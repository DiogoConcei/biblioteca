export {};
import { Response, SerieData, viewData } from './series.interfaces.ts';
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
      };
    };
  }
}
