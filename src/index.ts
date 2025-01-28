import { app, BrowserWindow, ipcMain, Menu } from "electron";
import chaptersHandlers from "./handlers/chaptersHandlers";
import collectionHandlers from "./handlers/collectionsHandlers";
import downloadHandlers from "./handlers/downloadHandler";
import seriesHandlers from "./handlers/seriesHandlers";
import uploadHandlers from "./handlers/uploadHandlers";
import userHandlers from "./handlers/userHandlers";
import ConfigHandlers from "./handlers/ConfigHandlers";
import createContextMenu from "./contextMenu";

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
  event.returnValue = `Received ${arg.length} paths.`;
})

app.on("ready", () => {
  createWindow();
  createContextMenu(ipcMain);
  seriesHandlers(ipcMain)
  uploadHandlers(ipcMain)
  chaptersHandlers(ipcMain)
  collectionHandlers(ipcMain)
  downloadHandlers(ipcMain)
  userHandlers(ipcMain)
  ConfigHandlers(ipcMain)
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