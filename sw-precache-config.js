module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/webcomponents-lite.min.js'
  ],
  runtimeCaching: [{
    urlPattern: '/^https://fonts.googleapis.com//',
    handler: 'cacheFirst'
  }],
  navigateFallback: '/index.html'
};
