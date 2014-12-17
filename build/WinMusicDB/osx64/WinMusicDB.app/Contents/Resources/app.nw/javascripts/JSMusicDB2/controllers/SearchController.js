jsmusicdb.controller('SearchController', ['$scope', '$http', '$rootScope', '$location', '$routeParams', '$modal', 'RestService', 'ModelService', 'tmhDynamicLocale', '$translate', '$window',
function($scope, $http, $rootScope, $location, $routeParams, $modal, RestService, ModelService, tmhDynamicLocale, $translate, $window) {

	window.scrollTo(0, 0);

	$scope.tooMany = false;
	$scope.searchString = $routeParams.query;
	$scope.searchfor = $routeParams.filter || "artists";
	$scope.results = null;
	$scope.maxYield = 48;
	$scope.loading = {};

	$translate("search." + $scope.searchfor).then(function (translated) {
		$scope.translatedSearch = translated;
	});

	$scope.doSearch = function() {
		$scope.loading.search = true;
		$scope.results = null;
		var querylist = $scope[$scope.searchfor];
		var filteredList = [];
		setTimeout(function() {
			angular.forEach(querylist, function(value, key) {
				key = key.toLowerCase();
				if ($scope.searchfor === 'albums') {
					key = key.substring(key.lastIndexOf("-"));
				}
				if ($scope.searchfor === 'tracks') {
					key = value.title.toLowerCase();
				}
				if ($scope.searchfor === 'year') {
					key = key;
					if (key === $scope.searchString) {
						// value is the array
						filteredList = value;
					}
				} else if (key.indexOf($scope.searchString.toLowerCase()) !== -1) {
					filteredList.push(value);
				}
			});
			if (filteredList.length > $scope.maxYield) {
				$scope.tooMany = true;
				filteredList = filteredList.splice(0, $scope.maxYield);
			}
			$scope.$apply(function () {
				$window.location = "#/search/" + $scope.searchfor + "/" + $scope.searchString;
				$scope.results = filteredList;
				$scope.loading.search = false;
			});
		}, 10);
	};

	$rootScope.$watch(function() {
		return $rootScope.parsed;
	}, function(n, o) {
		if (n) {
			// get current playlists
			RestService.Playlists.getPlaylists(function(json) {
				$scope.playlists = json;
			});
			if ($scope.searchString && $scope.searchfor) {
				$scope.doSearch();
			}
		}
	});

	$scope.setFilter = function (filter) {
		$scope.searchfor = filter;
		$translate("search." + filter).then(function (translated) {
			$scope.results = null;
			$scope.translatedSearch = translated;
		});

	};

	$scope.$watch(function () {
		return $scope.searchString;
	}, function (n, o) {
		$scope.results = null;
	});

}]);
