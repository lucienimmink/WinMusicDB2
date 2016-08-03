(function () {
    const {ipcRenderer} = require('electron');

    document.querySelector('mdb-player').addEventListener('external.mdbplaying', function (e) {
        let details = {
            artist: e.detail.trackArtist,
            album: e.detail.album.name,
            title: e.detail.title,
            number: e.detail.number
        };
        ipcRenderer.send('mdbplaying', details);
    });

    document.querySelector('mdb-player').addEventListener('external.mdbstopped', function (e) {
        ipcRenderer.send('mdbstopped');
    });
    document.querySelector('mdb-player').addEventListener('external.mdbpaused', function (e) {
        let details = {
            artist: e.detail.trackArtist,
            album: e.detail.album.name,
            title: e.detail.title,
            number: e.detail.number
        };
        ipcRenderer.send('mdbpaused', details);
    });

    ipcRenderer.on('ipc-togglePlay', (event, arg) => {
        document.querySelector('mdb-player').dispatchEvent(new Event('external.mdbtoggle'));
    });
    ipcRenderer.on('ipc-prev', (event, arg) => {
        document.querySelector('mdb-player').dispatchEvent(new Event('external.mdbprev'));
    });
    ipcRenderer.on('ipc-next', (event, arg) => {
        document.querySelector('mdb-player').dispatchEvent(new Event('external.mdbnext'));
    });

})();