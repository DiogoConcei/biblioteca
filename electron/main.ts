import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'node:url';
import { registerHandlers } from './ipc';
import path from 'path';
import fse from 'fs-extra';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

declare global {
  var storageFolder: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

export function getMainWindow(): BrowserWindow | null {
  return win;
}

let win: BrowserWindow | null;

async function ensureAppFolders() {
  const userDataPath = app.getPath('userData');
  const storageFolder = path.join(userDataPath, 'storage');

  if (!fse.existsSync(storageFolder)) {
    await fse.mkdirp(storageFolder);
  }

  const dataStore = path.join(storageFolder, 'data store');
  const userLibrary = path.join(storageFolder, 'user library');
  const configFolder = path.join(storageFolder, 'config');
  const imagesFolder = path.join(dataStore, 'images files');
  const jsonFolder = path.join(dataStore, 'json files');

  await Promise.all([
    fse.mkdirp(dataStore),
    fse.mkdirp(userLibrary),
    fse.mkdirp(configFolder),
    fse.mkdirp(imagesFolder),
    fse.mkdirp(jsonFolder),
  ]);

  await Promise.all([
    fse.mkdirp(path.join(configFolder, 'app')),
    fse.mkdirp(path.join(configFolder, 'comic')),
    fse.mkdirp(path.join(configFolder, 'book')),
    fse.mkdirp(path.join(configFolder, 'manga')),
    fse.mkdirp(path.join(jsonFolder, 'books')),
    fse.mkdirp(path.join(jsonFolder, 'comics')),
    fse.mkdirp(path.join(jsonFolder, 'mangas')),
    fse.mkdirp(path.join(jsonFolder, 'childSeries')),
    fse.mkdirp(path.join(imagesFolder, 'book')),
    fse.mkdirp(path.join(imagesFolder, 'comic')),
    fse.mkdirp(path.join(imagesFolder, 'manga')),
    fse.mkdirp(path.join(imagesFolder, 'showcase images')),
    fse.mkdirp(path.join(imagesFolder, 'dinamic images')),
  ]);

  global.storageFolder = storageFolder;

  const configJsonPath = path.join(configFolder, 'app', 'config.json');
  const collectionsJsonPath = path.join(
    configFolder,
    'app',
    'appCollections.json',
  );

  if (!fse.existsSync(configJsonPath)) {
    await fse.writeJson(
      configJsonPath,
      {
        settings: {
          reading_mode: 'single_page',
          zoom: 'fit_width',
          ligth_mode: true,
          full_screen: true,
        },
        metadata: { global_id: 0 },
      },
      { spaces: 2 },
    );
  }

  if (!fse.existsSync(collectionsJsonPath)) {
    await fse.writeJson(
      collectionsJsonPath,
      [
        {
          name: 'Favoritas',
          description: 'Minhas séries favoritas.',
          series: [],
          updatedAt: new Date().toISOString(),
        },
        {
          name: 'Recentes',
          description: 'Séries lidas recentemente',
          series: [],
          comments: [],
          updatedAt: new Date().toISOString(),
        },
      ],
      { spaces: 2 },
    );
  }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    frame: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      allowRunningInsecureContent: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    // Dev mode
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // Production
    const indexHtml = path.join(
      process.resourcesPath,
      'app',
      'dist',
      'index.html',
    );
    win.loadFile(indexHtml);
  }

  ipcMain.handle('window:minimize', async () => {
    if (win) win.minimize();
    return true;
  });

  ipcMain.handle('window:toggle-maximize', async () => {
    if (!win) return false;

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }

    return win.isMaximized();
  });

  ipcMain.handle('window:close', async () => {
    if (win) win.close();

    return true;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  await ensureAppFolders();
  await registerHandlers();
  createWindow();
});

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).toString();
