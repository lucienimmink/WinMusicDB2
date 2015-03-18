jsmusicdb.controller('ArtistViewController', ['$scope', '$routeParams', '$log', '$rootScope', 'RestService', '$timeout',
function($scope, $routeParams, $log, $rootScope, RestService, $timeout) {'use strict';

	window.scrollTo(0,0);

	if ($routeParams.letter) {
		$rootScope.$watch(function () {
			return $rootScope.parsed;
		}, function (n,o) {
			if (n) {
				var letter = $routeParams.letter,
						artist = $scope.artists[$routeParams.artist.toUpperCase()] || $scope.local.artists[$routeParams.artist.toUpperCase()];
				for (var letterObject in $scope.letters) {
					$scope.letters[letterObject].active = false;
				}
				$scope.letters[letter].active = true;
				$scope.viewAlbums = angular.copy(artist.albums);
				if ($scope.currentSrc === "both") {
					if ($scope.local.artists[$routeParams.artist.toUpperCase()]) {
						angular.forEach($scope.local.artists[$routeParams.artist.toUpperCase()].albums, function (localAlbum) {
							var cloudHasLocal = false;
							angular.forEach($scope.viewAlbums, function (cloudAlbum) {
								if ($.trim(localAlbum.album.toLowerCase()) === $.trim(cloudAlbum.album.toLowerCase())) {
									cloudHasLocal = true;
								}
							});
							if (!cloudHasLocal) {
								$scope.viewAlbums.push(localAlbum);
							}
						});
					}
				}
				$scope.artist = artist;

				$rootScope.path = artist.albumartist||artist.name;

				// get dominant color
				RestService.Music.getDominantColor($rootScope, artist.name, function(color) {
					$("body header").css("background-color", "rgb(" + color[0] + "," + color[1] + "," +color[2] + ")");
					$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "rgba(" + color[0] + "," + color[1] + "," +color[2] + ", 0.5)");
				});

				$timeout(function () {
					$scope.niceScroll.resize();
				}, 100);
			}
		});
	}

	$scope.$on("$destroy", function () {
		$("body header").css("background-color", "");
		$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "");
		$rootScope.path = $rootScope.platform + 'MusicDB2';
	});

	$scope.back = function () {
		// go to artist overview
		var letter = $routeParams.letter;
		document.location = "#/letter/" + letter;
	};

}]);
