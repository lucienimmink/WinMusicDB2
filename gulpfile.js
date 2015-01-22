var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	usemin = require('gulp-usemin'),
	ngmin = require('gulp-ngmin'),
	rev = require('gulp-rev'),
	minifyHtml = require('gulp-minify-html'),
	minifyCss = require('gulp-minify-css'),
	ngHtml2Js = require("gulp-ng-html2js"),
	imagemin = require('gulp-imagemin'),
	clean = require('gulp-clean'),
	cssmin = require('gulp-cssmin'),
	cmq = require('gulp-combine-media-queries'),
	ngAnnotate = require('gulp-ng-annotate'),
	jsonminify = require('gulp-jsonminify');
var NwBuilder = require('node-webkit-builder');
var exec = require('child_process').exec;
var path = require('path');
// copy files
gulp.task('cp', function () {
	return gulp.src('./WinMusicDB/**/*').pipe(gulp.dest('./dist/'));
});
// clean folder
gulp.task('clean', function () {
	return gulp.src('./dist/**/*', { read: false}).pipe(clean());
});

gulp.task('patch', function (cb) {
   //win32
   console.log("copying over meta files");
   gulp.src('./win32/ffmpegsumo.dll').pipe(gulp.dest('./build/WinMusicDB/win32/'));
   gulp.src('./win32/python/**/**').pipe(gulp.dest('./build/WinMusicDB/win32/python/'));
   gulp.src('./eyed3/**/**').pipe(gulp.dest('./build/WinMusicDB/win32/eyed3/'));
   gulp.src('./scanner.py').pipe(gulp.dest('./build/WinMusicDB/win32/'));
   //win64
   gulp.src('./win64/ffmpegsumo.dll').pipe(gulp.dest('./build/WinMusicDB/win64/'));
   gulp.src('./win64/python/**/**').pipe(gulp.dest('./build/WinMusicDB/win64/python/'));
   gulp.src('./eyed3/**/**').pipe(gulp.dest('./build/WinMusicDB/win64/eyed3/'));
   gulp.src('./scanner.py').pipe(gulp.dest('./build/WinMusicDB/win64/'));
   
   //lin32
   gulp.src('./lin32/libffmpegsumo.so').pipe(gulp.dest('./build/WinMusicDB/linux32/'));
   gulp.src('./lin32/.desktop').pipe(gulp.dest('./build/WinMusicDB/linux32/'));
   gulp.src('./eyed3/**/**').pipe(gulp.dest('./build/WinMusicDB/linux32/eyed3/'));
   gulp.src('./scanner.py').pipe(gulp.dest('./build/WinMusicDB/linux32/'));
   gulp.src('./WinMusicDB/icon.png').pipe(gulp.dest('./build/WinMusicDB/linux32/'));
   //lin64
   gulp.src('./lin64/libffmpegsumo.so').pipe(gulp.dest('./build/WinMusicDB/linux64/'));
   gulp.src('./lin64/.desktop').pipe(gulp.dest('./build/WinMusicDB/linux64/'));
   gulp.src('./eyed3/**/**').pipe(gulp.dest('./build/WinMusicDB/linux64/eyed3/'));
   gulp.src('./scanner.py').pipe(gulp.dest('./build/WinMusicDB/linux64/'));
   gulp.src('./WinMusicDB/icon.png').pipe(gulp.dest('./build/WinMusicDB/linux64/'));
});

gulp.task('nw', function(cb) {
	setTimeout(function () {
		var nw = new NwBuilder({
		files: './dist/**/**', // use the glob format
		platforms: ['win', 'linux'],
		winIco: './icon.ico',
		version: '0.11.1' // use this version we have a shadow around the frame
		// macIcns: './icon.icns'
	});

	// Log stuff you want
	nw.on('log',  console.log);

	// Build returns a promise
	nw.build().then(function () {
		   cb();
		
	}).catch(function (error) {
		console.error(error);
		cb();
	});
	}, 5000);
	
});
// Default
gulp.task('default', ['cp', 'nw']);