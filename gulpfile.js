const gulp = require('gulp')
const packager = require('electron-packager')
const inno = require('innosetup-compiler')
const del = require('del')
const rename = require('gulp-rename')
const replace = require('gulp-replace')
// var installer = require('electron-installer-debian')
var createDMG = require('electron-installer-dmg')

gulp.task('clean', (cb) => {
    del(['app/**/*', 'Output/**/*', 'WinMusicDBNext-win32-x64/**/*'])
    cb()
})

gulp.task('update-base', (cb) => {
    gulp.src(['./app/index.html'])
        .pipe(replace('<base href="/" />', '<base href="." />'))
        // remove modules
        .pipe(replace(new RegExp('<script (src="[^"]+?")[ ]type="module"></script>', 'g'), ''))
        // and use old es5 style scripts
        .pipe(replace(new RegExp(' nomodule>', 'g'), '>'))
        .pipe(gulp.dest('app/'))
    cb()
})

gulp.task('copy', () => gulp
    .src(
        [
            'node_modules/jsmusicdbnext-prebuilt/**/*',
            '!node_modules/jsmusicdbnext-prebuilt/*-latest*',
        ],
        {
            base: '.',
        },
    )
    .pipe(
        rename((path) => {
            let { dirname } = path
            dirname = dirname.split('\\')
            if (dirname.length === 4) {
                dirname = `${dirname[2]}\\${dirname[3]}`
            } else if (dirname.length === 3) {
                dirname = dirname[2]
            } else {
                dirname = ''
            }
            path.dirname = dirname
        }),
    )
    .pipe(gulp.dest('./app')))

gulp.task('package', () => packager({
    dir: '.',
    appCopyright: `Copyright (C) ${new Date().getFullYear()} AddaSoft All rights served`,
    arch: 'x64',
    icon: 'images/icon',
    name: 'WinMusicDBNext',
    overwrite: true,
    platform: 'win32',
    appCategoryType: 'public.app-category.music',
    win32metadata: {
        CompanyName: 'AddaSoft',
        FileDescription: 'WinMusicDB Next',
        OriginalFilename: 'WinMusicDB.exe',
        ProductName: 'WinMusicDB Next',
    },
}))
gulp.task('package-mac', () => packager({
    dir: '.',
    appCopyright: `Copyright (C) ${new Date().getFullYear()} AddaSoft All rights served`,
    arch: 'x64',
    icon: 'images/icon.icns',
    name: 'MacMusicDB Next',
    overwrite: true,
    platform: 'darwin',
    appCategoryType: 'public.app-category.music',
}))

gulp.task('win-setup', (cb) => {
    inno(
        'win32-x64-setup.iss',
        {
            gui: false,
            verbose: false,
        },
        (error) => {
            if (error) {
                // eslint-disable-next-line no-console
                console.error('packing failed', error)
                return
            }
            // console.log('windows setup file created');
            cb()
        },
    )
})

gulp.task('mac-setup', async cb => {
    const created = await createDMG({
        appPath: 'MacMusicDB Next-darwin-x64/MacMusicDB Next.app',
        name: 'MacMusicDB Next',
        title: 'MacMusicDB Next',
        icon: 'images/icon.icns',
        out: 'output'
    });
    cb();
});

gulp.task(
    'update',
    gulp.series('clean', 'copy', 'update-base', (cb) => {
        cb()
    }),
)

gulp.task(
    'build',
    gulp.series('update', 'package', 'win-setup', (cb) => {
        cb()
    }),
)

gulp.task(
    'build-mac',
    gulp.series('update', 'package-mac', 'mac-setup', (cb) => {
        cb()
    }),
)
