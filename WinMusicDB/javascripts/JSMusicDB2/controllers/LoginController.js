jsmusicdb.controller('LoginController', ['$scope', '$modalInstance', '$rootScope',
function($scope, $modalInstance, $rootScope) {'use strict';

	$scope.hasError = false;

	$scope.inTwoFactor = false;

	if ($rootScope.user && $rootScope.user.twoFactor) {
		$scope.inTwoFactor = true;
	}

	$scope.login = $rootScope.user || {
		account: null,
		passwd: null,
		serverport: null,
		serverurl: null,
		lastfmuser: null,
		opt_code: null,
		twoFactor: false,
		remember: false
	};

	$scope.doLogin = function () {
		if ($scope.login.account !== null && $scope.login.passwd !== null && $scope.login.serverport !== null ) {
			// TODO: check credentials on server
    		$modalInstance.close($scope.login);
    	} else {
    		$scope.hasError = true;
    	}
  	};
}]);
