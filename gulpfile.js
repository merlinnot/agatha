const browserSync = require('browser-sync');
const del = require('del');
const gulp = require('gulp');
const ampValidator = require('gulp-amphtml-validator');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const plumber = require('gulp-plumber');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const merge = require('merge-stream');
const { join, parse } = require('path');
const through = require('through2');

/*
 * Helpers
 */
const browserSyncInstance = browserSync.create();

const inlineCss = () => {
  const htmlFiles = {};
  const cssFiles = {};

  const onFile = function(file, _, callback) {
    const { ext, dir, name } = parse(file.relative);
    if (['.css', '.html'].includes(ext)) {
      if (ext === '.html') {
        htmlFiles[join(dir, name)] = file;
        callback();
      } else {
        cssFiles[join(dir, name)] = file;
        callback();
      }
    } else {
      callback(new Error(`Invalid extension: ${ext}.`));
    }
  };

  const onEnd = function(callback) {
    Object.entries(htmlFiles).forEach(([key, htmlFile]) => {
      if (key in cssFiles) {
        const cssFileContents = cssFiles[key].contents.toString();
        const customStyleTag = `<style amp-custom>${cssFileContents}</style>`;
        const customCssRegex = /<style amp-custom>(.*)<\/style>/;

        const newHtmlFileContents = htmlFile.contents
          .toString()
          .replace(customCssRegex, customStyleTag);

        htmlFile.contents = new Buffer.from(newHtmlFileContents);
      }

      this.push(htmlFile);
    });

    callback();
  };

  return through.obj(onFile, onEnd);
};

/*
 * Tasks
 */
gulp.task('clean', () => del(['dist/**', '!dist'], { force: true }));

gulp.task('build:assets', () =>
  gulp.src('src/assets/**/*', { base: 'src' }).pipe(gulp.dest('dist')),
);

gulp.task('build:pages', () => {
  const htmlStream = gulp
    .src('src/templates/pages/**/*.pug', { base: 'src/templates/pages' })
    .pipe(plumber())
    .pipe(pug())
    .pipe(plumber.stop());

  const stylesStream = gulp
    .src('src/styles/**/*.scss', { base: 'src/styles' })
    .pipe(plumber())
    .pipe(sass())
    .pipe(plumber.stop())
    .pipe(autoprefixer())
    .pipe(cssnano());

  return merge(htmlStream, stylesStream)
    .pipe(plumber())
    .pipe(inlineCss())
    .pipe(plumber.stop())
    .pipe(ampValidator.validate())
    .pipe(ampValidator.format())
    .pipe(gulp.dest('dist'));
});

gulp.task('build', gulp.series('clean', 'build:assets', 'build:pages'));

gulp.task(
  'watch',
  gulp.series('build', () => {
    browserSyncInstance.init({
      open: false,
      port: 8080,
      server: {
        baseDir: 'dist',
        serveStaticOptions: {
          extensions: ['html'],
        },
      },
    });

    gulp
      .watch(
        ['src/templates/**/*.pug', 'src/styles/**/*.scss'],
        gulp.series('build'),
      )
      .on('change', browserSyncInstance.reload);
  }),
);

gulp.task('default', gulp.series('watch'));
