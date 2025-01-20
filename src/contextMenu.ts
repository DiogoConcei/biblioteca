import { Menu, BrowserWindow, IpcMain } from "electron";

export default function createContextMenu(ipcMain: IpcMain) {
    ipcMain.on("show-context-menu", (event) => {
        const menu = Menu.buildFromTemplate([
            {
                label: "Excluir",
                click: () => {
                    event.sender.send("context-menu-action", "context-menu-excluir");
                },
            },
            {
                label: "Deletar",
                click: () => {
                    event.sender.send("context-menu-action", "context-menu-deletar");
                },
            },
            {
                label: "Renomear",
                click: () => {
                    event.sender.send("context-menu-action", "context-menu-renomear");
                },
            },
        ]);

        const window = BrowserWindow.fromWebContents(event.sender);
        menu.popup({ window: window! });
    });
};
