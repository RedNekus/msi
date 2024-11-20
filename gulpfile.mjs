import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import pug  from 'gulp-pug';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import eslint from 'gulp-eslint';
import babelify from 'babelify';

const sass = gulpSass(dartSass);

function buildStyles() {
  return gulp.src('./src/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./build/css/'));
};

function buildHTML() {
    return gulp.src('./src/*.pug')
        .pipe(pug({pretty: true}))
        .pipe(gulp.dest('./build/'));
};

function lintJs() {
    return gulp.src('./src/js/script.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
};

function buildJS() {
    return browserify({
            debug: true,
            entries: ['./src/js/script.js'],
            transform: [
                [
                  "babelify"
                ]
            ]
        })
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('./build/js/'));
};

function copyJS() {
    return gulp.src('./src/js/!(script).js')
        .pipe(gulp.dest('./build/js/'));
}

const watch = function () {
    gulp.watch('./src/sass/**/*.scss',  gulp.series('buildStyles'));
    gulp.watch('./src/**/*.pug',  gulp.series('buildHTML'));
    gulp.watch('./src/js/*.js',  gulp.series('lintJs', 'buildJS', 'copyJS'))
}

export { buildStyles, buildHTML, buildJS, lintJs, copyJS, watch };