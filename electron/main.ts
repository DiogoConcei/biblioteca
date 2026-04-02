import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'path';
import fse from 'fs-extra';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

import { registerHandlers } from './ipc';
import DownloadManager from './services/DownloadManager';
import MediaServer from './services/MediaServer';

// Polyfill para URL.parse (ES2024), necessário para algumas versões do Node.js
if (typeof URL.parse !== 'function') {
  (URL as any).parse = (url: string, base?: string) => {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}

// Registrar o protocolo antes do app estar pronto (obrigatório para alguns tipos de protocolo)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'lib-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

declare global {
  const storageFolder: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let downloadManager: DownloadManager | null = null;
const mediaServer = new MediaServer();

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

  // fse.mkdirp cria diretórios recursivamente. Podemos criar os mais profundos de uma vez.
  const foldersToCreate = [
    path.join(storageFolder, 'config', 'app'),
    path.join(storageFolder, 'config', 'comic'),
    path.join(storageFolder, 'config', 'book'),
    path.join(storageFolder, 'config', 'manga'),
    path.join(storageFolder, 'user library'),
    path.join(storageFolder, 'data store', 'json files', 'books'),
    path.join(storageFolder, 'data store', 'json files', 'comics'),
    path.join(storageFolder, 'data store', 'json files', 'mangas'),
    path.join(storageFolder, 'data store', 'json files', 'childSeries'),
    path.join(storageFolder, 'data store', 'images files', 'book'),
    path.join(storageFolder, 'data store', 'images files', 'comic'),
    path.join(storageFolder, 'data store', 'images files', 'manga'),
    path.join(storageFolder, 'data store', 'images files', 'showcase images', 'thumbnails'),
    path.join(storageFolder, 'data store', 'images files', 'dinamic images'),
  ];

  await Promise.all(foldersToCreate.map(folder => fse.mkdirp(folder)));

  global.storageFolder = storageFolder;

  const configFolder = path.join(storageFolder, 'config', 'app');
  const configJsonPath = path.join(configFolder, 'config.json');
  const collectionsJsonPath = path.join(configFolder, 'appCollections.json');

  const fileWrites = [];

  if (!fse.existsSync(configJsonPath)) {
    fileWrites.push(fse.writeJson(
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
    ));
  }

  if (!fse.existsSync(collectionsJsonPath)) {
    fileWrites.push(fse.writeJson(
      collectionsJsonPath,
      [
        {
          name: 'Favoritos',
          description: 'Minhas séries favoritas.',
          coverImage: '',
          series: [],
          updatedAt: new Date().toISOString(),
        },
        {
          name: 'Recentes',
          description: 'Séries lidas recentemente',
          coverImage: '',
          series: [],
          comments: [],
          updatedAt: new Date().toISOString(),
        },
      ],
      { spaces: 2 },
    ));
  }

  await Promise.all(fileWrites);
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    frame: false,
    show: false, // Inicia oculta
    backgroundColor: '#131313', // Cor do fundo da sua Home (ajuste se necessário)
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      allowRunningInsecureContent: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  downloadManager = new DownloadManager(win);

  // Exibe a janela apenas quando o conteúdo inicial estiver renderizado
  win.once('ready-to-show', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    // Dev mode
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // Production
    win.loadFile(path.join(__dirname, '../dist/index.html'));
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
  // Inicializamos as pastas vitais primeiro (é rápido com Promise.all)
  await ensureAppFolders().catch(err => console.error('Erro folders:', err));
  
  // Registros síncronos de handlers e protocolos
  mediaServer.register();
  registerHandlers();
  
  createWindow();
});

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).toString();
