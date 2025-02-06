export { };
import { Manga } from './manga.interfaces';
import { Comic } from './comic.interfaces'
import { Book } from './book.interfaces';
import { Collections } from './collections.interfaces';
import { SeriesProcessor, SerieForm, Literatures } from './series.interfaces';

declare global {
    interface Window {
        electron: {
            windowAction: {
                minimize: () => void,
                fullScreen: () => void,
                close: () => void,
                restore: () => void
            },

            webUtilities: {
                getPathForFile: (file: File) => string;
            },
            upload: {
                localUpload: (filePaths: string[]) => Promise<SeriesProcessor[]>,
            },
            series: {
                createSerie: (serieData: SerieForm) => Promise<void>,
                getSeries: () => ExhibitionSerieData[],
                getManga: (serieName: string) => Manga,
                getComic: (serieName: string) => Comic,
                getBook: (serieName: string) => Book
            },
            download: {
                downloadLocal: (dataPath: string, quantity: number) => Promise<void>,
                lineReading: (serieName: string, chapter_id: number) => Promise<void>,
                downloadIndividual: (serieName: string, chapter_id: number) => Promise<void>
            },
            eventEmitter: {
                on: (channel: string, listener: (...args: any[]) => void) => void,
                off: (channel: string, listener: (...args: any[]) => void) => void,
            },
            chapters: {
                getChapter: (dataPath: string, chapter_id: number) => Promise<string[]>,
                getNextChapter: (dataPath: string, chapter_id: number) => Promise<string>,
                getPrevChapter: (dataPath: string, chapter_id: number) => Promise<string>,
                saveLastRead: (dataPath: string, chapter_id: number, page_number) => Promise<void>,
                acessLastRead: (dataPath: string,) => Promise<string>,
            },
            collections: {
                getCollections: () => Promise<Collection[]>,
                createCollection: (collectionName: string) => Promise<void>,
                serieToCollection: (data_path: string) => Promise<void>
                getFavSeries: () => Promise<Collections>,
            },
            userAction: {
                favoriteSerie: (data_path: string) => Promise<{ success: boolean }>,
                ratingSerie: (dataPath: string, userRating: number) => Promise<{ success: boolean }>,
                markRead: (data_path: string, chapter_id: number) => Promise<{ success: boolean }>,
            },
            AppConfig: {
                getScreenConfig: (urlLocation: string) => Promise<boolean>,
                controlScreen: () => Promise<boolean>,
                getThemeConfig: () => Promise<boolean>,
                switchTheme: () => Promise<boolean>
            },
            contextMenu: {
                show: () => void;
                excluir: (itemName: string) => Promise<void>;
                deletar: (itemName: string) => Promise<void>;
                renomear: (oldName: string, newName: string) => Promise<void>;
            };
        };
    }
}
