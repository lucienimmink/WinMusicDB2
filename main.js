const Config = require('electron-config')

const config = new Config()

const {
    Menu, Tray, MenuItem, BrowserWindow, globalShortcut, app, ipcMain,
} = require('electron')

let tray = null

process.env.GOOGLE_API_KEY = 'AIzaSyDNIncH70uAPgdUK_hZfQ9EQBDPwhuOYmM'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const size = JSON.parse(config.get('size') || '[500, 780]')

const communicator = {
    sendToggleWindow() {
        const isMinimized = mainWindow.isMinimized()
        if (isMinimized) {
            mainWindow.restore()
            mainWindow.focus()
        } else {
            mainWindow.minimize()
        }
    },
    sendTogglePlay() {
        mainWindow.webContents.send('ipc-togglePlay')
    },
    sendPrev() {
        mainWindow.webContents.send('ipc-prev')
    },
    sendNext() {
        mainWindow.webContents.send('ipc-next')
    },
    sendQuit() {
        app.quit()
    },
}

const addTray = function addTray() {
    const trayMenu = new Menu()
    trayMenu.append(new MenuItem({
        label: 'Show/hide window',
        click: communicator.sendToggleWindow,
    }))
    trayMenu.append(new MenuItem({
        type: 'separator',
    }))
    trayMenu.append(new MenuItem({
        label: 'Play/Pause',
        click: communicator.sendTogglePlay,
    }))
    trayMenu.append(new MenuItem({
        label: 'Next',
        click: communicator.sendNext,
    }))
    trayMenu.append(new MenuItem({
        label: 'Previous',
        click: communicator.sendPrev,
    }))
    trayMenu.append(new MenuItem({
        type: 'separator',
    }))
    trayMenu.append(new MenuItem({
        label: 'Quit',
        click: communicator.sendQuit,
    }))
    tray = new Tray(`${__dirname}/images/icon-32.png`)
    tray.setContextMenu(trayMenu)
    tray.setToolTip('JSMusicDB Next')
    tray.on('click', communicator.sendToggleWindow)
}

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: size[0],
        height: size[1],
        minWidth: 500,
        minHeight: 780,
        title: 'JSMusicDB next',
        autoHideMenuBar: true,
        icon: `${__dirname}/images/icon-32.png`,
        frame: false,
    })
    mainWindow.webContents.session.clearCache(() => {
        // clear cache on start-up.
    })

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/app/index.html`)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    mainWindow.on('resize', () => {
        config.set('size', JSON.stringify(mainWindow.getSize()))
    })

    // register mediakeys
    globalShortcut.register('medianexttrack', () => {
        mainWindow.webContents.send('ipc-next')
    })
    globalShortcut.register('mediaplaypause', () => {
        mainWindow.webContents.send('ipc-togglePlay')
    })
    globalShortcut.register('mediaprevioustrack', () => {
        mainWindow.webContents.send('ipc-prev')
    })
    globalShortcut.register('mediastop', () => {
        mainWindow.webContents.send('ipc-stop')
    })

    // inject a new JS file with the electron specific javascript
    mainWindow.webContents.executeJavaScript(`
    var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", "../electron-scripts.js");
    document.getElementsByTagName("head")[0].appendChild(fileref)
  `)

    // add tray
    addTray()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

app.on('minimize', () => {
    mainWindow.hide()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('mdbplaying', (event, arg) => {
    // now we can use this info for something awesome; let's use the data to set a tray icon
    tray.setToolTip(`Playing: ${arg.title} by ${arg.artist}`)
    mainWindow.setOverlayIcon(
        `${__dirname}/images/play-button.png`,
        `Playing: ${arg.title} by ${arg.artist}`,
    )
    mainWindow.setTitle(`${arg.title} by ${arg.artist} - JSMusicDB next`)
})
ipcMain.on('mdbpaused', (event, arg) => {
    // now we can use this info for something awesome; let's use the data to set a tray icon
    tray.setToolTip(`Paused: ${arg.title} by ${arg.artist}`)
    mainWindow.setOverlayIcon(null, '')
})
ipcMain.on('mdbstopped', () => {
    // now we can use this info for something awesome; let's use the data to set a tray icon
    tray.setToolTip('JSMusicDB Next')
    mainWindow.setTitle('JSMusicDB next')
})

// use the scan events to update the progress in the taskbar
ipcMain.on('mdbscanstart', () => {
    mainWindow.setProgressBar(0)
})
ipcMain.on('mdbscanning', (event, arg) => {
    mainWindow.setProgressBar(arg.percentage / 100)
})
ipcMain.on('mdbscanstop', () => {
    mainWindow.setProgressBar(-1) // remove indicator
})
