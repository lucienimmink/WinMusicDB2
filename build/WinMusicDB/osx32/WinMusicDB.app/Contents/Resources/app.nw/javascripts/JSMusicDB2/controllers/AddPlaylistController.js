jsmusicdb.controller('AddPlaylistController', ['$scope', '$modalInstance', 'playlistName',
function($scope, $modalInstance, playlistName) {'use strict';

	$scope.hasError = false;
	
	$scope.addPlaylist = $scope.addPlaylist || {};
	$scope.addPlaylist.playlistName = playlistName || '';
	
	if (playlistName) {
		$scope.inEdit = true;
	}

	$scope.doAddPlaylist = function () {
		$scope.hasError = false;
		if ($scope.addPlaylist.playlistName !== null && $scope.addPlaylist.playlistName !== "") {
    		$modalInstance.close($scope.addPlaylist.playlistName);
    	} else {
    		$scope.hasError = true;
    	}
  	};
}]);
