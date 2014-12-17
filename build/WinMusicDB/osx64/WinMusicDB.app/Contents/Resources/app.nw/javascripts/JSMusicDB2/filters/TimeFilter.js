angular.module('TimeFilters', []).filter('timeFilter', function($translate) {
	var prefixZero = function(n) {
		if (n < 10) {
			return "0" + n;
		}
		return n;
	};
	var daysString = 'days';
	$translate("about.days").then(function (translation) {
		daysString = translation;
	});
	return function(total) {
		if (isNaN(total) || total < 1 || total === Infinity) {
			return null;
		};
		var days = parseInt(total / (3600 * 24)), rest = parseInt(total % (3600 * 24)), hours = parseInt(rest / 3600), rest = parseInt(total % 3600), minutes = parseInt(rest / 60), seconds = parseInt(rest % 60);
		if (days === 0) {
			days = "";
		} else {
			/*
			$translate("about.days").then(function (translation) {
				days = days + " " + translation + ", ";
			});
			*/
			days = days + " " + daysString + ", ";
		}
		if (hours < 10) {
			hours = "0" + hours + ":";
		} else {
			hours = hours + ":";
		}
		if (days == "" && hours == "00:") {
			hours = "";
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		return days + hours + minutes + ":" + seconds;
	};
});
