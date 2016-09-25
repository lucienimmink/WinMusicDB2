var gulp = require('gulp');
var packager = require('electron-packager');
var inno = require("innosetup-compiler");
var runSequence = require('run-sequence');
var del = require('del');

gulp.task('clean', function (cb) {
    del([
        'Output/**/**.*',
        'WinMusicDBNext-win32--x64/**/**.*'
    ]);
    cb();
});

gulp.task('package', function (cb) {
    packager({
        'dir': '.',
        'app-copyright': 'Copyright (C) ' + new Date().getFullYear() + ' AddaSoft All rights served',
        'arch': 'x64',
        'icon': 'images/icon.ico',
        'name': 'WinMusicDBNext',
        'overwrite': true,
        'platform': 'win32',
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
            return;
        }
        // console.log('Packages build in', appPaths);
        cb();
    })
});

gulp.task('win-setup', function (cb) {
    inno("win32-x64-setup.iss", {
        gui: false,
        verbose: false
    }, function (error) {
        if (error) {
            console.error('packing failed', error);
            return;
        }
        //console.log('windows setup file created');
        cb();
    });
});

gulp.task('build', function (cb) {
    runSequence('clean', 'package', 'win-setup');
});