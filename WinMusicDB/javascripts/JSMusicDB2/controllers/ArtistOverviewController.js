jsmusicdb.controller('ArtistOverviewController', ['$scope', '$routeParams', '$log', '$rootScope', '$timeout',
function($scope, $routeParams, $log, $rootScope, $timeout) {'use strict';

	window.scrollTo(0,0);

	if ($routeParams.letter) {
		$rootScope.$watch(function () {
			return $rootScope.parsed;
		}, function (n,o) {
			if (n) {
				var letter = $routeParams.letter;

				for (var letterObject in $scope.letters) {
					$scope.letters[letterObject].active = false;
				}
				if (letter) {
					$scope.letters[letter].active = true;
					$scope.viewArtists = angular.copy($scope.letters[letter].artists);

					var unique = {};
					angular.forEach($scope.viewArtists, function (artist) {
						unique[artist.name.toLowerCase()] = artist;
					});
					var artists = Object.keys(unique);
					var uniqueArray = [];
					angular.forEach(artists, function (val) {
						uniqueArray.push(unique[val]);
					});
					$scope.viewArtists = uniqueArray;

					$rootScope.path = $rootScope.platform + 'MusicDB2: ' + letter;

					$scope.niceScroll.resize();
				}
			}
		});
	}

	$scope.back = function () {
		// go to overview
		var letter = $routeParams.letter;
		document.location = "#/";
	};

	$scope.$on("$destroy", function () {
		$("body header").css("background-color", "");
		$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "");
		$rootScope.path = $rootScope.platform + 'MusicDB2';
	});

}]);
