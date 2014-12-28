jsmusicdb.controller('AppController', ['$scope', '$http', '$rootScope', '$location', '$routeParams', '$modal', 'RestService', 'ModelService', 'tmhDynamicLocale', '$translate', '$interval', 'PlatformService',
function($scope, $http, $rootScope, $location, $routeParams, $modal, RestService, ModelService, tmhDynamicLocale, $translate, $interval, PlatformService) {

	$scope.version = 37;

	// version checker
	$http.get("http://www.arielext.org/version.txt?ts="+new Date().getTime()).success(function(remote) {
		$scope.hasNewVersion = $scope.version < remote;
		$scope.newVersion = remote;
	});

	$scope.downloadlink = function () {
		gui.Shell.openExternal('http://www.jsmusicdb.com/' + $rootScope.platform  + 'musicdb/');
	};

	$scope.niceScroll = $("html").niceScroll({
		scrollspeed : 80,
		mousescrollstep : 60,
		oneaxismousemode : false,
		zindex : 100,
		cursorwidth : 5,
		cursorborderradius : "0px",
		horizrailenabled : false,
		cursorcolor: '#455a64',
		cursorborder: '1px solid #607d8b'
	});

	// show popup if we need to login first
	$scope.$on("login", function() {
		var modalInstance = $modal.open({
			templateUrl : 'templates/login.html',
			controller : 'LoginController',
			backdrop : 'static'
		});

		modalInstance.result.then(function(login) {
			RestService.Login.doLogin(login, function(json) {
				if (json.success) {
					$rootScope.loggedIn = true;
					$scope.login = login;
					$rootScope.user = login;
					if (login.twoFactor && !login.opt_code) {
						login.twoFactor = false;
						// ignore twoFactor
					}
					if (login.remember) {
						localStorage.setItem("user", JSON.stringify(login));
					} else {
						localStorage.removeItem("user");
					}
					$rootScope.$broadcast("music.get");
				} else {
					// login failed
					$rootScope.$broadcast("login");
				}
			});
		});
	});

	$scope.$on("authenticate", function(e, login) {
		RestService.Login.doLogin(login, function(json) {
			if (json.success) {
				$rootScope.loggedIn = true;
				$scope.login = login;
			} else {
				// login failed
				$rootScope.$broadcast("login");
			}
		});
	});

	$scope.logout = function() {
		if ($scope.login) {
			$scope.login.account = undefined;
			$scope.login.passwd = undefined;
			$scope.login.lastfmuser = undefined;
			$scope.login.twoFactor = undefined;
			$scope.login.opt_code = undefined;
			localStorage.setItem("user", JSON.stringify($scope.login));
		}
		$rootScope.loggedIn = false;
		$location.url("/logout");
	};

	$rootScope.path = $rootScope.platform + 'MusicDB2';

	$scope.viewMode = localStorage.getItem("viewMode") || "grid";
	$scope.toggleView = function(value) {
		if (!value) {
			$scope.viewMode = ($scope.viewMode === "grid") ? "list" : "grid";
		} else {
			$scope.viewMode = value;
		}
		localStorage.setItem("viewMode", $scope.viewMode);
	};
	
	
	$rootScope.imageMode = localStorage.getItem("imageMode") || "spotify";
	$scope.toggleImage = function(value) {
		// TODO: purge cache
		$rootScope.cachedImages = [];
		if (!value) {
			$rootScope.imageMode = ($rootScope.imageMode === "spotify") ? "lastfm" : "spotify";
		} else {
			$rootScope.imageMode = value;
		}
		localStorage.setItem("imageMode", $rootScope.imageMode);
	};

	Notify.requestPermission();

	$scope.letters = {};
	$scope.artists = {};
	$scope.albums = {};
	$scope.tracks = {};
	$scope.trackByPath = {};
	$scope.years = {};
	$scope.playing = {};
	$scope.playlist = {};

	$scope.local = {
		totals : {},
		letters : {},
		artists : {},
		albums : {},
		year : {},
		tracks : {},
		trackByPath : {}
	};
	$scope.cloud = {
		totals : {},
		letters : {},
		artists : {},
		albums : {},
		year : {},
		tracks : {},
		trackByPath : {}
	};

	$scope.both = {
		totals : {},
		letters : {},
		artists : {},
		albums : {},
		year : {},
		tracks : {},
		trackByPath : {}
	};
	$scope.sync = function() {
		// initiate a rescan
		window.jsonCache = null;
		// forgot our current cached file
		$rootScope.$broadcast("music.get");
	};

	var cb = document.location.href;
	if (cb.indexOf("#") !== -1) {
		cb = cb.substring(0, cb.indexOf("#"));
	}
	if (cb.indexOf("index.html") === -1) {
		cb = cb + "index.html";
	}
	$scope.lastfmLink = 'http://www.last.fm/api/auth/?api_key=956c1818ded606576d6941de5ff793a5&cb=' + cb;
	$scope.hasLastFm = false;

	var lastfmkey = localStorage.getItem("key");
	if (lastfmkey) {
		$scope.hasLastFm = lastfmkey;
	}

	$scope.authorizeLastFM = function() {
		var api_key = lastfm.api_key;
		$http.get('http://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=' + api_key + '&format=json').success(function(json) {
			var token = json.token;
			var win = gui.Window.open('http://www.last.fm/api/auth?api_key=' + api_key + "&token=" + token, {
				frame: true,
				width: 960,
				height: 740
			});
			win.requestAttention(3);
			win.on('close', function() {
				this.hide();
				var api_sig = hex_md5('api_key' + api_key + 'methodauth.getSession' + 'token' + token + lastfm.secret);
				$http.get('http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=' + api_key + '&token=' + token + '&api_sig=' + api_sig + '&format=json').success(function(json) {
					var session = json.session.key;
					localStorage.setItem("key", session);
					$scope.hasLastFm = session;
				});
				this.close();
			});
		});
	};

	$scope.language = window.navigator.userLanguage || window.navigator.language;
	if ($scope.language.indexOf("-") !== -1) {
		$scope.language = $scope.language.substring(0, $scope.language.indexOf("-"));
	}
	var storedLanguage = localStorage.getItem("language");
	if (storedLanguage)
		$scope.language = storedLanguage;
	tmhDynamicLocale.set($scope.language);
	$translate.use($scope.language);

	$scope.setLanguage = function(language) {
		$translate.use(language);
		tmhDynamicLocale.set(language);
		localStorage.setItem("language", language);
	};

	String.prototype.capitalize = function() {
		return this.replace(/(^|\s)([a-z])/g, function(m, p1, p2) {
			return p1 + p2.toUpperCase();
		});
	};

	RestService.Overview.changelog(function(txt) {
		$scope.changelog = txt;
	});

	$scope.setMusicSource = function(src) {
		if ($scope[src]) {
			$scope.totals = $scope[src].totals;
			$scope.letters = $scope[src].letters;
			if (src === "both") {
				angular.forEach($scope.local.letters, function(localLetter) {
					var cloudHasLocal = false;
					angular.forEach($scope.letters, function(cloudLetter) {
						if (cloudLetter.letter === localLetter.letter) {
							cloudHasLocal = true;
						}
					});
					if (!cloudHasLocal) {
						$scope.letters[localLetter.letter] = localLetter;
					}
				});
			}
			$scope.artists = $scope[src].artists;
			$scope.albums = $scope[src].albums;
			$scope.tracks = $scope[src].tracks;
			$scope.trackByPath = $scope[src].trackByPath;
			$scope.year = $scope[src].year;
			$scope.musicSource = src;
			$scope.currentSrc = $scope.musicSource;
			localStorage.setItem("musicSource", $scope.musicSource);
		}
	};

	$scope.musicSource = localStorage.getItem("musicSource") || 'cloud';
	// default to cloud (rewrite to localStorage)

	$rootScope.$watch(function() {
		return $rootScope.parsed;
	}, function(n, o) {
		if (n) {
			if (!$scope.musicSource) {
				$scope.musicSource = localStorage.getItem("musicSource") || 'cloud';
			}
			$scope.setMusicSource($scope.musicSource);
		}
	});

	var preferYouTube = localStorage.getItem("youtube");
	if (preferYouTube && preferYouTube !== "false") {
		$scope.preferYouTube = true;
	}

	$scope.togglePreferYouTube = function () {
		$scope.preferYouTube = !$scope.preferYouTube;
		localStorage.setItem("youtube", $scope.preferYouTube);
	};

	$scope.$on("music.get", function(e, force) {
		$scope.debug = $scope.debug || {};
		var start = new Date().getTime();
		$scope.parsing = true;
		//if (localStorage.getItem("music") && !force) {
		//	$scope.music = JSON.parse(localStorage.getItem("music"));
		//	$scope.debug.getJSON = new Date().getTime() - start;
		//	ModelService.parse($scope.music, $scope, $rootScope);
		//} else {
		RestService.Music.get(function(json) {
			try {
				localStorage.setItem("music", JSON.stringify(json));
			} catch (e) {
			}// ignore if we have no more space
			$scope.debug = $scope.debug || {};
			$scope.debug.getJSON = new Date().getTime() - start;
			ModelService.parse(json, $scope, $rootScope);
		});
		//}
	});

	var doScan = function(folder) {
		$scope.loadingLocalFolder = true;
		localStorage.setItem("localFolder", folder);
		$scope.folder = folder;
		$scope.debug = $scope.debug || {};
		var start = new Date().getTime();

		// parse cached data
		$http.get(folder + "/music.json").success(function(json) {
			ModelService.parse(json, $scope, $rootScope, true);
			$scope.loadingLocalFolder = false;
		}).error(function () {
			$scope.syncLocal();
		});
	};

	$scope.syncLocal = function() {
		var gui = require('nw.gui');
		var win = gui.Window.get();
		$scope.loadingLocalFolder = true;
		$scope.scanProgress = null;
		$scope.scanETA = null;
		var start = new Date().getTime();
		var progressPoll = $interval(function() {
			$http.get($scope.folder + "/progress.txt").success(function(response) {
				if (response) {
					$scope.scanProgress = response.split("|")[0];
					win.setProgressBar($scope.scanProgress / 100);
					$scope.scanETA = response.split("|")[1];
				}
			});
		}, 1000);
		PlatformService.scan($scope, $scope.folder, progressPoll);
	};

	$scope.scanFolder = function() {
		var folder = $("#fileBrowser").val();
		doScan(folder);
	};

	$scope.resetFolder = function() {
		$scope.folder = null;
		$scope.loadingLocalFolder = false;
		localStorage.removeItem("folder");
	};

	if (localStorage.getItem("localFolder")) {
		$scope.loadingLocalFolder = true;
		$scope.folder = localStorage.getItem("localFolder");
		$("#fileBrowser").val($scope.folder);
		doScan($scope.folder);
	}

	$scope.minimize = function () {
		win.minimize();
		win.setAlwaysOnTop(false);
	};
	$scope.maximize = function () {
		win.maximize();
		win.setAlwaysOnTop(false);
	};
	$scope.resize = function () {
		win.resizeTo(400, 640);
		win.setAlwaysOnTop(true);
	};
	$scope.restore = function () {
		win.unmaximize();
		win.setAlwaysOnTop(false);
	};
	$scope.close = function () {
		win.close();
	};

	$scope.restoreDefault = function () {
		win.resizeTo(1200, 800);
		win.setAlwaysOnTop(false);
	};

	win.on('maximize', function () {
		$scope.$apply(function () {
			$scope.maximized = true;
		});
	});
	win.on('unmaximize', function () {
		$scope.$apply(function () {
			$scope.maximized = false;
		});
	});

	$("html").on("mouseleave", function (e) {
		$scope.$apply(function () {
			$scope.focused = false;
		});
	});
	$("html").on("mouseenter", function (e) {
		$scope.$apply(function () {
			$scope.focused = true;
		});
	});
}]);
