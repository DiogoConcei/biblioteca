import { app, BrowserWindow, ipcMain, Menu } from "electron";
import seriesHandlers from "./handlers/seriesHandlers";
import uploadHandlers from "./handlers/uploadHandlers";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = async (): Promise<void> => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    frame: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  Menu.setApplicationMenu(null)
  mainWindow.webContents.openDevTools();

  ipcMain.handle("minimize-window", () => {
    mainWindow.minimize()
  })

  ipcMain.handle("fullScreen-window", () => {
    mainWindow.setFullScreen(true)
  })

  ipcMain.handle("close-window", () => {
    mainWindow.close()
  })
};

ipcMain.on('captureFile', (event, arg) => {
  ('Dropped File(s):', arg);
  event.returnValue = `Received ${arg.length} paths.`;
})

app.on("ready", () => {
  createWindow();
  seriesHandlers(ipcMain)
  uploadHandlers(ipcMain)
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});