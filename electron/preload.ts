import { ipcRenderer, contextBridge, webUtils } from 'electron';
import { SerieData, SerieForm, viewData, Response } from '../src/types/series.interfaces.ts';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  windowAction: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  webUtilities: {
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  },

  upload: {
    processSerie: (filePaths: string[]): Promise<Response<SerieData[]>> =>
      ipcRenderer.invoke('upload:process-data', filePaths),
    uploadSerie: (serieData: SerieForm): Promise<Response<void>> =>
      ipcRenderer.invoke('upload:process-serie', serieData),
  },

  series: {
    getSeries: async (): Promise<Response<viewData[]>> => ipcRenderer.invoke('serie:get-all'),
  },
});
