angular.module('VersionFilters', []).filter('versionFilter', function($translate) {

	return function(version) {
		var ret = "";
		if (version < 100) {
			ret = "0.";
		}
		ret += (""+version).split("").join(".");
		return ret;
	};
});
