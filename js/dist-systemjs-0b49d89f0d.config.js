/**
 * System configuration for Angular 2 samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
    // map tells the System loader where to look for things
    var map = {
        'app': 'dist/app', // 'dist',
        '@angular': 'node_modules/@angular',
        'rxjs': 'node_modules/rxjs',
        'lodash': 'node_modules/lodash',
        'angular2-jwt': 'node_modules/angular2-jwt',
        'ng2-bootstrap': 'node_modules/ng2-bootstrap',
        'moment': './node_modules/moment',
        'pouchdb': './node_modules/pouchdb'
    };
    // packages tells the System loader how to load when no filename and/or no extension
    var packages = {
        'app': { main: 'main.js', defaultExtension: 'js' },
        'rxjs': { defaultExtension: 'js' },
        'lodash': { main: 'lodash.js', defaultExtension: 'js' },
        'angular2-in-memory-web-api': { main: 'index.js', defaultExtension: 'js' },
        'angular2-jwt': { main: 'angular2-jwt.js', defaultExtension: 'js' },
        'ng2-bootstrap': { main: 'ng2-bootstrap.js', defaultExtension: 'js' },
        'moment': { main: 'moment.js', defaultExtension: 'js' },
        'pouchdb': { main: 'dist/pouchdb.js', defaultExtension: 'js' }
    };
    var meta = {
        'pouchdb': { format: 'commonjs' }
    }
    var ngPackageNames = [
        'common',
        'compiler',
        'core',
        'forms',
        'http',
        'platform-browser',
        'platform-browser-dynamic',
        'router',
        'router-deprecated',
        'upgrade'
    ];
    // Individual files (~300 requests):
    function packIndex(pkgName) {
        packages['@angular/' + pkgName] = { main: 'index.js', defaultExtension: 'js' };
    }
    // Bundled (~40 requests):
    function packUmd(pkgName) {
        packages['@angular/' + pkgName] = { main: '/bundles/' + pkgName + '.umd.js', defaultExtension: 'js' };
    }
    // Most environments should use UMD; some (Karma) need the individual index files
    var setPackageConfig = System.packageWithIndex ? packIndex : packUmd;
    // Add package entries for angular packages
    ngPackageNames.forEach(setPackageConfig);
    var config = {
        map: map,
        packages: packages,
        meta: meta
    }
    System.config(config);
})(this);
