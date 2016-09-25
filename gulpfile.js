var gulp = require('gulp');
var packager = require('electron-packager');
//packager(options, function done_callback (err, appPaths) { /* … */ })

gulp.task('package', function (cb) {
    packager({
        'dir': '.',
        'app-copyright': 'Copyright (C) ' + new Date().getFullYear() + ' AddaSoft All rights served',
        'arch': 'x64',
        'icon': 'images/icon.ico',
        'name': 'WinMusicDBNext',
        'overwrite': true,
        'platform': 'all',
        'version': '1.4.1',
        'app-category-type': 'public.app-category.music',
        'win32metadata': {
            'CompanyName': 'AddaSoft',
            'FileDescription': 'Advanced music player by AddaSoft',
            'OriginalFilename': 'WinMusicDB.exe',
            'ProductName': 'WinMusicDB'
        }
    }, function (err, appPaths) {
        if (err) {
            console.error('build failed', err);
        }
        console.log('Packages build in', appPaths);
    })
});