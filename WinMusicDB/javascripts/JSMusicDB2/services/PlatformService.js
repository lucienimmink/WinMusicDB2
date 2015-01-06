angular.module('JSMusicDB.PlatformService', []).factory('PlatformService', ['$log', '$rootScope', '$http', '$interval', 'ModelService',
function($log, $rootScope, $http, $interval, ModelService) {

	var gui = require('nw.gui'), python, pypath;
	var win = gui.Window.get();
	var factory = {};

	factory.setPlatform = function() {
		var dataPath = gui.App.dataPath;
		$rootScope.platform = 'Win';
		if (dataPath.indexOf("/.config/") !== -1) {
			$rootScope.platform = 'Lin';
		} else if (dataPath.indexOf('/Library/Application') !== -1) {
			$rootScope.platform = 'Mac';
		} else if (dataPath.indexOf('\AppData\Local') !== -1) {
			$rootScope.platform = 'Win';
		}
		/*
		python = "python.exe";
		if ($rootScope.platform === 'Lin' || $rootScope.platform === 'Mac') {
			python = 'python';
		}
		var exec = require('child_process').exec;
		var child = exec(python + ' --version', function(error, stdout, stderr) {
			if (error != null) {
				$rootScope.hasPython = false;
			} else {
				if (stderr.indexOf("Python 2.7") === -1) {
					$rootScope.hasPython = false;
				} else {
					$rootScope.hasPython = true;
				}
			}
		});
		*/
		if ($rootScope.platform === 'Win') {
			$rootScope.hasPython = false;
			var exec = require('child_process').exec;
			var child = exec('reg query HKLM\\Software\\Addasoft\\WinMusicDB2\\Settings /v InstallPath', function(error, stdout, stderr) {
				if (stdout) {
					$rootScope.basePath = $.trim(stdout.split("  ")[6]);
					$rootScope.pythonPath = $rootScope.basePath + "\\python\\python.exe";
					var child2 = exec('"' + $rootScope.pythonPath + '" --version', function (err,o,e) {
					console.log(err,o,e);
						if (e.indexOf("Python 2.7") === 0) {
							$rootScope.hasPython = true;
						}
					});
				}
			});
		}
	};

	factory.scan = function($scope, folder, progressPoll) {
		var exec = require('child_process').exec;
		var path = $rootScope.basePath + "\\scanner.py";
		if ($rootScope.platform === 'Lin') {
			var dataPath = gui.App.dataPath;
			var user = dataPath.substring(6);
			user = user.substring(0, user.indexOf('/'));
			path = "/home/" + user + "/LinMusicDB/scanner.py";
		} else if ($rootScope.platform === 'Mac') {
			// TODO
			path = null;
		}
		if (path) {
			var start = new Date();
			var child = exec('"' + $rootScope.pythonPath + '" "' + path + '" "' + folder + '"', function(error, stdout, stderr) {
				if (error != null) {
					console.log(error, stderr);
					// error handling & exit
				} else {
					$rootScope.debug = $rootScope.debug || {};
					$rootScope.debug.getJSONLocal = new Date().getTime() - start;
					$http.get(folder + "/music.json").success(function(json) {
						ModelService.parse(json, $scope, $rootScope, true);
						win.setProgressBar(-1);
					});
					$interval.cancel(progressPoll);
					progressPoll = null;
				}
				$scope.loadingLocalFolder = false;
			});
		} else {
			// we can't scan; fail the paython check
			$rootScope.hasPython = false;
		}
	};

	return factory;
}]);
