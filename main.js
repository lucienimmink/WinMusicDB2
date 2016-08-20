const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const globalShortcut = electron.globalShortcut;

const {Menu, Tray, MenuItem} = require('electron')
let tray = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// only run this in development mode; we don't want to remove the app in prod (need to find out how this can be programmed!)
/*
var del = require('delete');
var symlinkOrCopySync = require('symlink-or-copy').sync;
var _ = require("lodash");

var filesAndFolders = ['css', 'fonts', 'global', 'js', 'electron.html', 'manifest.json'];
// remove current build if present; this ensures we have the most up2date prebuilt binaries on all platforms
_.forEach(filesAndFolders, function (value) {
    del.sync('app/' + value);
    symlinkOrCopySync('node_modules/jsmusicdbnext-prebuilt/' + value, 'app/' + value);
});
del.sync('./sw.js');
symlinkOrCopySync('node_modules/jsmusicdbnext-prebuilt/sw.js', 'sw.js'); // service worker must be in root.
// rename electron.html to index.html
*/

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 500, height: 780, title: 'JSMusicDB Next', autoHideMenuBar: true, icon: `${__dirname}/images/logo-32.png` });
    mainWindow.webContents.session.clearCache(function(){
        // clear cache on start-up.
    });

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/app/index.html`)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });

    // register mediakeys
    var registered = globalShortcut.register('medianexttrack', function () {
        mainWindow.webContents.send('ipc-next');
    });

    var registered = globalShortcut.register('mediaplaypause', function () {
        mainWindow.webContents.send('ipc-togglePlay');
    });

    var registered = globalShortcut.register('mediaprevioustrack', function () {
        mainWindow.webContents.send('ipc-prev');
    });

    // inject a new JS file with the electron specific javascript
    mainWindow.webContents.executeJavaScript(`
    var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", "../electron-scripts.js");
    document.getElementsByTagName("head")[0].appendChild(fileref)
  `);

    // add tray
    addTray();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

app.on('minimize', function () {
    mainWindow.hide();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


const {ipcMain} = require('electron')
ipcMain.on('mdbplaying', (event, arg) => {
    // now we can use this info for something awesome; let's use the data to set a tray icon
    tray.setToolTip(`Playing: ${arg.title} by ${arg.artist}`);
});
ipcMain.on('mdbpaused', (event, arg) => {
    // now we can use this info for something awesome; let's use the data to set a tray icon
    tray.setToolTip(`Paused: ${arg.title} by ${arg.artist}`);
});
ipcMain.on('mdbstopped', (event, arg) => {
    // now we can use this info for something awesome; let's use the data to set a tray icon
    tray.setToolTip(`JSMusicDB Next`);
});


var addTray = function () {
    var trayMenu = new Menu();
    trayMenu.append(new MenuItem({
        label: 'Show/hide window',
        click: communicator.sendToggleWindow
    }));
    trayMenu.append(new MenuItem({
        type: 'separator'
    }));
    trayMenu.append(new MenuItem({
        label: 'Play/Pause',
        click: communicator.sendTogglePlay
    }));
    trayMenu.append(new MenuItem({
        label: 'Next',
        click: communicator.sendNext
    }));
    trayMenu.append(new MenuItem({
        label: 'Previous',
        click: communicator.sendPrev
    }));
    trayMenu.append(new MenuItem({
        type: 'separator'
    }));
    trayMenu.append(new MenuItem({
        label: 'Quit',
        click: communicator.sendQuit
    }));
    tray = new Tray(`${__dirname}/images/logo-32.png`);
    tray.setContextMenu(trayMenu);
    tray.setToolTip(`JSMusicDB Next`);
    tray.on('click', communicator.sendToggleWindow);
}

var communicator = {
    sendToggleWindow: function () {
        var isMinimized = mainWindow.isMinimized();
        if (isMinimized) {
            mainWindow.restore();
            mainWindow.focus();
        } else {
            mainWindow.minimize();
        }
    },
    sendTogglePlay: function () {
        mainWindow.webContents.send('ipc-togglePlay');
    },
    sendPrev: function () {
        mainWindow.webContents.send('ipc-prev');
    },
    sendNext: function () {
        mainWindow.webContents.send('ipc-next');
    },
    sendQuit: function () {
        app.quit();
    }
}