import { app, BrowserWindow, Menu, MenuItemConstructorOptions, dialog, ipcMain } from "electron"
import * as path from "path";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow;
let filePath: string;
let isSaved: boolean = true;

function updateTitle(window: BrowserWindow) {
    let title = "无标题";
    if (filePath) {
        title = path.basename(filePath);
    }
    title = title + " - 记事本";
    if (!isSaved) {
        title = title + "*";
    }
    window.setTitle(title);
}

let template: MenuItemConstructorOptions[] = [{
    label: "文件",
    submenu: [{
        label: "新建",
        accelerator: "CmdOrCtrl+N",
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                focusedWindow.webContents.send("new");
                filePath = null;
                isSaved = true;
                updateTitle(focusedWindow);
            }
        }
    }, {
        label: "打开",
        accelerator: "CmdOrCtrl+O",
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                dialog.showOpenDialog({
                    filters: [{
                        name: "文本文档", extensions: ["txt"]
                    }, {
                        name: "所有文件", extensions: ["*"]
                    }]
                }, files => {
                    if (files) {
                        let file: string = files[0];
                        focusedWindow.webContents.send("open", file);
                        filePath = file;
                        isSaved = true;
                        updateTitle(focusedWindow);
                    }
                });
            }
        }
    }, {
        label: "保存",
        accelerator: "CmdOrCtrl+S",
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                if (filePath) {
                    focusedWindow.webContents.send("save", filePath);
                    isSaved = true;
                    updateTitle(focusedWindow);
                } else {
                    dialog.showSaveDialog({
                        filters: [{
                            name: "文本文档", extensions: ["txt"]
                        }, {
                            name: "所有文件", extensions: ["*"]
                        }]
                    }, file => {
                        if (file) {
                            focusedWindow.webContents.send("save", file);
                            filePath = file;
                            isSaved = true;
                            updateTitle(focusedWindow);
                        }
                    });
                }
            }
        }
    }, {
        label: "另存为",
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                dialog.showSaveDialog({}, file => {
                    if (file) {
                        focusedWindow.webContents.send("save", file);
                        filePath = file;
                        isSaved = true;
                        updateTitle(focusedWindow);
                    }
                });
            }
        }
    }, {
        label: "退出",
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                focusedWindow.close();
                return;
                if (!isSaved) {
                    dialog.showMessageBox({
                        message: "是否将更改保存到 " + (filePath || "无标题") + "?",
                        type: "info",
                        title: "记事本",
                        buttons: ["保存", "不保存", "取消"]
                    }, index => {
                        if (index === 0) {
                            if (filePath) {
                                focusedWindow.webContents.send("save", filePath);
                            } else {
                                dialog.showSaveDialog({}, file => {
                                    if (file) {
                                        focusedWindow.webContents.send("save", file);
                                        focusedWindow.close();
                                    }
                                });
                            }
                        } else if (index === 1) {
                            focusedWindow.close();
                        }
                    });
                } else {
                    focusedWindow.close();
                }
            }
        }
    }]
}/*, {
    label: "编辑",
    submenu: [{
        label: "撤消",
        accelerator: "CmdOrCtrl+Z",
        role: "undo"
    }, {
        type: "separator"
    }, {
        label: "剪切",
        accelerator: "CmdOrCtrl+X",
        role: "cut"
    }, {
        label: "复制",
        accelerator: "CmdOrCtrl+C",
        role: "copy"
    }, {
        label: "粘贴",
        accelerator: "CmdOrCtrl+V",
        role: "paste"
    }, {
        type: "separator"
    }, {
        label: "全选",
        accelerator: "CmdOrCtrl+A",
        role: "selectall"
    }]
}*/];

ipcMain.on("changed", () => {
    isSaved = false;
    updateTitle(mainWindow);
});

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        title: "无标题 - 记事本"
    });

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "../index.html"));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    mainWindow.on("close", e => {
        if (!isSaved) {
            e.preventDefault();
            dialog.showMessageBox({
                message: `是否将更改保存到 ${filePath || "无标题"}?`,
                type: "info",
                title: "记事本",
                buttons: ["保存", "不保存", "取消"]
            }, index => {
                if (index === 0) {
                    if (filePath) {
                        mainWindow.webContents.send("save", filePath);
                        isSaved = true;
                        updateTitle(mainWindow);
                        mainWindow.close();
                    } else {
                        dialog.showSaveDialog({
                            filters: [{
                                name: "文本文档", extensions: ["txt"]
                            }, {
                                name: "所有文件", extensions: ["*"]
                            }]
                        }, file => {
                            if (file) {
                                mainWindow.webContents.send("save", file);
                                filePath = file;
                                isSaved = true;
                                updateTitle(mainWindow);
                                mainWindow.close();
                            }
                        });
                    }
                } else if (index === 1) {
                    app.exit();
                }
            });
        }
    });

    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
});

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.