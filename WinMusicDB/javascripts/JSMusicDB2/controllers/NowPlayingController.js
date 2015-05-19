jsmusicdb.controller('NowPlayingController', ['$scope', '$routeParams', '$log', '$rootScope', 'RestService', '$modal', '$timeout',
function($scope, $routeParams, $log, $rootScope, RestService, $modal, $timeout) {
	'use strict';

	$scope.$on("$destroy", function() {
		// reset to default header
		$("body header").css("background-color", "");
		$rootScope.path = $rootScope.platform + 'MusicDB2';
	});

	$scope.$watch(function () {
		return $scope.playing && $scope.playing.track;
	}, function (n, o) {
		if (n) {
			// get dominant color for this track
			RestService.Music.getDominantColor($rootScope, n.albumArt, function(color) {
				$("body header").css("background-color", "rgb(" + color[0] + "," + color[1] + "," +color[2] + ")");
			});
			$rootScope.path = n.artist + " - " + n.title;
		} else {
			$("body header").css("background-color", "");
			$rootScope.path = $rootScope.platform + 'MusicDB2';
		}
	});

}]);
