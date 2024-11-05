import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import pug  from 'gulp-pug';
import browserify from 'browserify';
import source from 'vinyl-source-stream';

const sass = gulpSass(dartSass);

function buildStyles() {
  return gulp.src('./src/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
};

function buildHTML() {
    return gulp.src('./src/*.pug')
        .pipe(pug({pretty: true}))
        .pipe(gulp.dest('./'));
};
function buildJS() {
    return browserify('./src/js/script.js')
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest('./js/'));
};
function copyJS() {
    return gulp.src('./src/js/!(script).js')
        .pipe(gulp.dest('./js/'))
}

const watch = function () {
    gulp.watch('./src/sass/**/*.scss',  gulp.series('buildStyles'));
    gulp.watch('./src/**/*.pug',  gulp.series('buildHTML'));
    gulp.watch('./src/js/*.js',  gulp.series('buildJS', 'copyJS'))
}

export { buildStyles, buildHTML, buildJS, copyJS, watch };