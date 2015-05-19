var jsmusicdb = angular.module('jsmusicdb', ['ngRoute', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ui.bootstrap', 'JSMusicDB.RestService', 'JSMusicDB.ModelService', 'JSMusicDB.ImageService', 'JSMusicDB.PlatformService', 'TimeFilters', 'VersionFilters', 'PrefixZeroFilters', 'tmh.dynamicLocale', 'pascalprecht.translate']).config(['$routeProvider', '$translateProvider', '$compileProvider',
function($routeProvider, $translateProvider, $compileProvider) {
	$routeProvider.when('/letter/:letter', {
		templateUrl : 'templates/artistoverview.html',
		needsLogin : true
	}).when('/year/:year', {
		templateUrl : 'templates/yearoverview.html',
		needsLogin : true
	}).when('/letter/:letter/artist/:artist', {
		templateUrl : 'templates/artistview.html',
		needsLogin : true
	}).when("/letter/:letter/artist/:artist/album/:album*", {
		templateUrl : 'templates/albumview.html',
		needsLogin : true
	}).when("/playlist/:id?", {
		templateUrl : 'templates/playlist.html',
		needsLogin : true
	}).when("/settings", {
		templateUrl : 'templates/settings.html',
		needsLogin : true
	}).when("/nowplaying", {
		templateUrl : 'templates/nowplaying.html',
		needsLogin : false
	}).when("/about", {
		templateUrl : 'templates/about.html',
		needsLogin : true
	}).when("/search/:filter?/:query?", {
		templateUrl : "templates/searchResults.html",
		needsLogin : true
	}).when("/login", {
		templateUrl : "templates/isLoggingIn.html",
		needsLogin : true
	}).when("/logout", {
		templateUrl : "templates/logout.html",
		needsLogin : false
	}).when("/settings", {
		templateUrl : "templates/settings.html",
		needsLogin : true
	}).otherwise({
		templateUrl : 'templates/overview.html',
		needsLogin : true
	});

	// setup translations
	$translateProvider.useStaticFilesLoader({
		prefix : 'translations/',
		suffix : '.json'
	});
	$translateProvider.preferredLanguage('en');
	$translateProvider.fallbackLanguage(['en']);

	// disable debug info
	$compileProvider.debugInfoEnabled(false);

}]);

jsmusicdb.run(['$rootScope', '$location', 'PlatformService',
function($rootScope, $location, PlatformService) {
	$rootScope.$on("$routeChangeStart", function(event, next, current) {
		var user = $rootScope.user || localStorage.getItem("user");
		if (user) {
			if (user instanceof Object) {
				//
			} else {
				$rootScope.user = JSON.parse(user);
			}
			if (!$rootScope.user.account && next.needsLogin) {
				$rootScope.$broadcast("login");
				event.preventDefault();
			} else {
				if (!$rootScope.loggedIn) {
					if ($rootScope.user.twoFactor) {
						$rootScope.user.opt_code = null;
						$rootScope.$broadcast("login");
						event.preventDefault();
					} else {
						$rootScope.$broadcast("authenticate", $rootScope.user);
						if (!$rootScope.parsed) {
							$rootScope.$broadcast("music.get");
						}
					}
				}
			}
		} else if (next.needsLogin) {
			$rootScope.$broadcast("login");
			event.preventDefault();
		}
	});
	PlatformService.setPlatform();
}]);

var setResponsive = function() {
	if ($(window).width() < 768) {
		$("body").addClass("mobile").removeClass("desktop");
	} else {
		$("body").removeClass("mobile").addClass("desktop");
	}
};
$(window).on("resize", function() {
	setResponsive();
});
setResponsive();

// WinMusicDB specific
var gui = require('nw.gui');
var win = gui.Window.get();

var tray, trayTooltip;
/*
win.on('minimize', function() {
	// Hide window
	this.hide();

	// Show tray
	tray = new gui.Tray({
		icon : '/icon.png',
		title : 'LinMusicDB2'
	});
	tray.tooltip = trayTooltip || 'LinMusicDB2';

	// Show window and remove tray when clicked
	tray.on('click', function() {
		win.show();
		win.restore();
		this.remove();
		tray = null;
	});

});
*/
// YouTube
var onYouTubePlayerReady = function () {
	console.log("youtube ready");
};
