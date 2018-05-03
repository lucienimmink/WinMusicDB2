(function() {
    const { ipcRenderer } = require('electron');
    const remote = require('electron').remote;

    document.querySelector('mdb-player').addEventListener('external.mdbplaying', function(e) {
        let details = {
            artist: e.detail.trackArtist,
            album: e.detail.album.name,
            title: e.detail.title,
            number: e.detail.number
        };
        ipcRenderer.send('mdbplaying', details);
    });

    document.querySelector('mdb-player').addEventListener('external.mdbstopped', function(e) {
        ipcRenderer.send('mdbstopped');
    });
    document.querySelector('mdb-player').addEventListener('external.mdbpaused', function(e) {
        let details = {
            artist: e.detail.trackArtist,
            album: e.detail.album.name,
            title: e.detail.title,
            number: e.detail.number
        };
        ipcRenderer.send('mdbpaused', details);
    });
    document.querySelector('mdb-player').addEventListener('external.mdbscanstart', function(e) {
        ipcRenderer.send('mdbscanstart');
    });
    document.querySelector('mdb-player').addEventListener('external.mdbscanning', function(e) {
        ipcRenderer.send('mdbscanning', e.detail);
    });
    document.querySelector('mdb-player').addEventListener('external.mdbscanstop', function(e) {
        ipcRenderer.send('mdbscanstop');
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
    ipcRenderer.on('ipc-stop', (event, arg) => {
        document.querySelector('mdb-player').dispatchEvent(new Event('external.mdbstop'));
    });

    const customHeader = document.createElement("div");
    customHeader.innerHTML = `<div id="title-bar">
          <div id="title-bar-btns">
               <button id="min-btn" title="Minimize">🗕</button>
               <button id="max-btn" title="Maximize/unmaximize">🗖</button>
               <button id="full-btn" title="Toggle fullscreen">🆜</button>
               <button id="close-btn" title="Close">⨯</button>
          </div>
     </div>`;
    document.querySelector('body').insertBefore(customHeader, document.querySelector('body').firstChild);

    document.getElementById("min-btn").addEventListener("click", function(e) {
        const window = remote.getCurrentWindow();
        window.minimize();
    });

    document.getElementById("max-btn").addEventListener("click", function(e) {
        const window = remote.getCurrentWindow();
        if (!window.isMaximized()) {
            window.maximize();
        } else {
            window.unmaximize();
        }
    });

    document.getElementById("close-btn").addEventListener("click", function(e) {
        const window = remote.getCurrentWindow();
        window.close();
    });

    let isFullScreen = false;
    document.getElementById("full-btn").addEventListener("click", function(e) {
        const window = remote.getCurrentWindow();
        isFullScreen = !isFullScreen;
        window.setFullScreen(isFullScreen);
    });
})();