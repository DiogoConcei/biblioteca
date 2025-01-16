export { };
import { Comic, Collections } from './comic.interfaces'

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
                localUpload: (filePaths: string[]) => Promise<string[]>,
            },
            series: {
                createSerie: (filePaths: string[]) => Promise<void>,
                getSeries: () => Comic[],
                getSerie: (serieName: string) => Comic
            },
            download: {
                downloadLocal: (seriePath: string, quantity: number) => Promise<void>,
            },
            eventEmitter: {
                on: (channel: string, listener: (...args: any[]) => void) => void,
                off: (channel: string, listener: (...args: any[]) => void) => void,
            },
            chapters: {
                getChapter: (serieName: string, chapter_id: number) => Promise<string[]>,
                saveLastRead: (serieName: string, chapter_id: number, page_number) => Promise<void>,
                acessLastRead: (serieName: string) => Promise<string>,
                getLastPage: (serieName: string, chapter_id: number) => Promise<number>,
            },
            collections: {
                getFavSeries: () => Promise<ComicCollectionInfo>,
            },
            userAction: {
                favoriteSerie: (serieName: string) => Promise<{ success: boolean }>,
                ratingSerie: (serieName: string, userRating: number) => Promise<void>;
                markRead: (serieName: string, chapter_id: number) => Promise<void>
            }
        };
    }
}
