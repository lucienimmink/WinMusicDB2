var gulp = require('gulp');
var packager = require('electron-packager');
var inno = require("innosetup-compiler");
var del = require('del');
var rename = require('gulp-rename');
// var installer = require('electron-installer-debian')

gulp.task('clean', function(cb) {
    del([
        'app/**/*',
        'Output/**/*',
        'WinMusicDBNext-win32-x64/**/*'
    ]);
    cb();
});

gulp.task('copy', function(cb) {
    // copy files and folders
    return gulp.src([
        'node_modules/jsmusicdbnext-prebuilt/**/*'
    ], {
        base: "."
    }).pipe(
        rename(function(path) {
            var dirname = path.dirname;
            dirname = dirname.split('\\');
            if (dirname.length === 4) {
                dirname = dirname[2] + '\\' + dirname[3];
            } else if (dirname.length === 3) {
                dirname = dirname[2];
            } else {
                dirname = '';
            }
            path.dirname = dirname;
        })
    ).pipe(
        gulp.dest('./app')
    );
});

gulp.task('copy-and-rename', function(cb) {
    return gulp.src('node_modules/jsmusicdbnext-prebuilt/electron.html').pipe(
        rename(function(path) {
            path.dirname = '';
            path.basename = 'index';
        })
    ).pipe(
        gulp.dest('./app')
    );
})

gulp.task('package', function(cb) {
    packager({
        'dir': '.',
        'appCopyright': 'Copyright (C) ' + new Date().getFullYear() + ' AddaSoft All rights served',
        'arch': 'x64',
        'icon': 'images/icon',
        'name': 'WinMusicDBNext',
        'overwrite': true,
        'platform': 'win32',
        'appCategoryType': 'public.app-category.music',
        'win32metadata': {
            'CompanyName': 'AddaSoft',
            'FileDescription': 'WinMusicDB Next',
            'OriginalFilename': 'WinMusicDB.exe',
            'ProductName': 'WinMusicDB Next'
        }
    }, function(err, appPaths) {
        if (err) {
            console.error('build failed', err);
            return;
        }
        // console.log('Packages build in', appPaths);
        cb();
    })
});

gulp.task('win-setup', function(cb) {
    inno("win32-x64-setup.iss", {
        gui: false,
        verbose: false
    }, function(error) {
        if (error) {
            console.error('packing failed', error);
            return;
        }
        //console.log('windows setup file created');
        cb();
    });
});

gulp.task('linux-setup', function(cb) {
    installer({
        src: 'WinMusicDBNext-linux-x64/',
        dest: 'Output/',
        arch: 'amd64'
    }, function(error) {
        if (error) {
            console.error('deb failed', error);
            return;
        }
        cb();
    })
});

gulp.task('update', gulp.series('clean', 'copy', function(cb) { 
    cb();
}));

gulp.task('build', gulp.series('update', 'package', 'win-setup', function(cb) { 
    cb();
}));