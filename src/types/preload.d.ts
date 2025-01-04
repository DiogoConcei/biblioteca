export { };
import { Comic } from './serie.interfaces'

declare global {
    interface Window {
        electron: {
            series: {
                // select all
                getSeries: () => Comic[],
                // select
                getSerie: (serieName: string) => Comic,
                // create
                createSerie: (filePaths: string[]) => Promise<void>,
            }
            serieActions: {
                favoriteSerie: (serieName: string) => Promise<{ success: boolean }>,
                ratingSerie: (serieName: string, userRating: number) => Promise<void>;
            },
            download: {
                downloadSerie: (seriePath: string, quantity: number) => Promise<void>,
            }
            windowAction: {
                minimize: () => void,
                fullScreen: () => void,
                close: () => void,
            }
            upload: {
                handleDrop: (filePaths: string[]) => Promise<string[]>,
            }
            webUtils: {
                getPathForFile: (file: File) => string;
            },
            eventEmitter: {
                on: (channel: string, listener: (...args: any[]) => void) => void,
                off: (channel: string, listener: (...args: any[]) => void) => void,
            }
        };
    }
}
