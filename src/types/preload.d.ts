export { };
import { Comic } from './serie.interfaces'

declare global {
    interface Window {
        electron: {
            getSeries: () => Comic[],
            getSerie: (serieName: string) => Comic,
            minimize: () => void,
            fullScreen: () => void,
            close: () => void,
            handleDrop: (filePaths: string[]) => Promise<string[]>,
            webUtils: {
                getPathForFile: (file: File) => string;
            },
            createSerie: (filePaths: string[]) => Promise<void>,
            on: (channel: string, listener: (...args: any[]) => void) => void,
            off: (channel: string, listener: (...args: any[]) => void) => void,
            favoriteSerie: (serieName: string, is_favorite: boolean) => Promise<void>,
        };
    }
}
