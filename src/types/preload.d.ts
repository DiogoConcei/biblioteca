export { };
import { Comic } from './comic.interfaces'
import { Collections } from './collections.interfaces';
import { SeriesProcessor } from './series.interfaces';

declare global {
    interface Window {
        electron: {
            windowAction: {
                minimize: () => void,
                fullScreen: () => void,
                close: () => void
            },

            webUtilities: {
                getPathForFile: (file: File) => string;
            },
            upload: {
                localUpload: (filePaths: string[]) => Promise<SeriesProcessor[]>,
            },
            series: {
                createSerie: (filePaths: string[]) => Promise<void>,
                getSeries: () => Comic[],
                getSerie: (serieName: string) => Comic
            },
            download: {
                downloadLocal: (seriePath: string, quantity: number) => Promise<void>,
                lineReading: (serieName: string, chapter_id: number) => Promise<void>,
                downloadIndividual: (serieName: string, chapter_id: number) => Promise<void>
            },
            eventEmitter: {
                on: (channel: string, listener: (...args: any[]) => void) => void,
                off: (channel: string, listener: (...args: any[]) => void) => void,
            },
            chapters: {
                getChapter: (serieName: string, chapter_id: number) => Promise<string[]>,
                getNextChapter: (serieName: string, chapter_id: number) => Promise<string>,
                getPrevChapter: (serieName: string, chapter_id: number) => Promise<string>,
                saveLastRead: (serieName: string, chapter_id: number, page_number) => Promise<void>,
                acessLastRead: (serieName: string) => Promise<string>,
            },
            collections: {
                getFavSeries: () => Promise<ComicCollectionInfo>,
            },
            userAction: {
                favoriteSerie: (serieName: string) => Promise<{ success: boolean }>,
                ratingSerie: (serieName: string, userRating: number) => Promise<void>,
                markRead: (serieName: string, chapter_id: number) => Promise<void>,
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
