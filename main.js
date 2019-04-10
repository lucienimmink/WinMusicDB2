const { app, BrowserWindow } = require('deskgap')

app.once('ready', () => {
    const win = new BrowserWindow({
        width: 900,
        height: 780,
        minWidth: 500,
        minHeight: 780,
        title: 'WinMusicDB next',
        menu: null,
        icon: `${__dirname}/images/icon-32.png`,
        frame: true,
        titleBarStyle: 'hidden',
    })
    win.loadFile('app/index.html')
})
