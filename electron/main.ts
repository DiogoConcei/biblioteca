import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/extensions
import { registerHandlers } from './ipc';
import path from 'path';
import fse from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

async function ensureAppFolders() {
  const userDataPath = app.getPath('userData');
  const storageFolder = path.join(userDataPath, 'storage');

  // Se ainda não existe, cria “storage”
  if (!fse.existsSync(storageFolder)) {
    await fse.mkdirp(storageFolder);
  }

  // Crie já as subpastas que você sabe que sempre vai usar pelo menos uma vez
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

  // Se quiser criar logo as subpastas específicas (Books, Comics etc):
  await Promise.all([
    fse.mkdirp(path.join(configFolder, 'app')),
    fse.mkdirp(path.join(configFolder, 'comic')),
    fse.mkdirp(path.join(configFolder, 'book')),
    fse.mkdirp(path.join(configFolder, 'manga')),
    fse.mkdirp(path.join(jsonFolder, 'books')),
    fse.mkdirp(path.join(jsonFolder, 'comics')),
    fse.mkdirp(path.join(jsonFolder, 'mangas')),
    fse.mkdirp(path.join(imagesFolder, 'book')),
    fse.mkdirp(path.join(imagesFolder, 'comic')),
    fse.mkdirp(path.join(imagesFolder, 'manga')),
    fse.mkdirp(path.join(imagesFolder, 'showcase image')),
    fse.mkdirp(path.join(imagesFolder, 'dinamic images')),
  ]);

  // Por fim, armazene apenas o caminho base “storage” no global
  global.storageFolder = storageFolder;
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  win.webContents.openDevTools();

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  Menu.setApplicationMenu(null);

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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a win dow in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  await ensureAppFolders();
  await registerHandlers();
  createWindow();
});
