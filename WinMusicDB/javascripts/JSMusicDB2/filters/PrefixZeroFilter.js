angular.module('PrefixZeroFilters', []).filter('PrefixZeroFilter', function() {

	return function(num) {
		if (Number(num) < 10) {
			return "0" + num;
		}
		return num;
	};
});
