jsmusicdb.controller('OverviewController', ['$scope', 'RestService', '$rootScope', 'ModelService', '$translate', '$interval', '$timeout',
function($scope, RestService, $rootScope, ModelService, $translate, $interval, $timeout) {
	'use strict';

	$scope.upcommingAlbums = [];

	$scope.loading = {};

	$rootScope.path = $rootScope.platform + "MusicDB2";

	var getFirstLetter = function(name) {
		name = $.trim(name).toUpperCase();
		name = (name.indexOf('THE ') === 0) ? name.substring(4) : name;
		var specialChars = [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'], firstLetter = name.charAt(0);
		if ($.inArray(firstLetter, specialChars) > -1) {
			firstLetter = '1';
		}
		return "" + firstLetter;
	};

	var stripThe = function(name) {
		name = $.trim(name.toUpperCase());
		name = (name.indexOf('THE ') === 0) ? name.substring(4) : name;
		return name.toLowerCase();
	};

	$scope.recentTracks = $rootScope.recentTracks;
	$scope.recentlyAdded = $rootScope.recentlyAdded;
	$scope.upcommingAlbums = $rootScope.upcommingAlbums;

	var timer = null;

	$scope.$on('$destroy', function() {
		// remove interval listener
		$interval.cancel(timer);
	});

	$scope.loadRecent = function(n) {
		if (!n)
			n = $rootScope.user.lastfmuser;
		RestService.Overview.recent(n, function(json) {
			$timeout(function() {

				$scope.loading.recent = false;
				if (json.recenttracks) {
					var tmplist = [], tracksAdded = [], duplicates = [];
					angular.forEach(json.recenttracks.track, function(fmtrack) {
						var artistName = fmtrack.artist["#text"], title = fmtrack.name, albumName = fmtrack.album["#text"];
						artistName = ModelService.stripThe(artistName.toUpperCase());
						if (RestService.Playlists.getTrackIdByKey(artistName + (title.toLowerCase()))) {
							var track = $scope.tracks[RestService.Playlists.getTrackIdByKey(artistName + (title.toLowerCase()))];
							if (track) {
								if (fmtrack.date) {
									track.lastPlayed = parseInt(fmtrack.date.uts) * 1000;
								} else {
									$translate('overview.listening').then(function(translation) {
										track.lastPlayed = translation;
									});
								}
								tmplist.push(track);
							} else {
								// cached but no hit on trackDB -> remove from cache and use last.fm
								if (title) {
									try {
										RestService.Playlists.removeTrackIdByKey(artistName + (title.toLowerCase()));
									} catch (e) {};
								}
								var track = {
									artist : artistName.toLowerCase(),
									title : title,
								};
								if (fmtrack.date) {
									track.lastPlayed = parseInt(fmtrack.date.uts) * 1000;
								} else {
									$translate('overview.listening').then(function(translation) {
										track.lastPlayed = translation;
									});
								}
								tmplist.push(track);
							}
						} else {
							var album = $scope.albums[artistName + "-" + albumName.toLowerCase()];
							if (album && track) {
								angular.forEach(album.tracks, function(track) {
									if (track.title.toLowerCase() === title.toLowerCase()) {
										RestService.Playlists.storeIdByKey(artistName + (title.toLowerCase()), track);
										if (fmtrack.date) {
											track.lastPlayed = parseInt(fmtrack.date.uts) * 1000;
										} else {
											$translate('overview.listening').then(function(translation) {
												track.lastPlayed = translation;
											});
										}
										tmplist.push(track);
									}
								});
							} else {
								var track = {
									artist : artistName.toLowerCase(),
									title : title,
								};
								if (fmtrack.date) {
									track.lastPlayed = parseInt(fmtrack.date.uts) * 1000;
								} else {
									$translate('overview.listening').then(function(translation) {
										track.lastPlayed = translation;
									});
								}
								tmplist.push(track);
							}
						}
					});
					$scope.recentTracks = tmplist;
					$rootScope.recentTracks = tmplist;
				}
			}, 10);
		});
	};

	$rootScope.$watch(function() {
		return $rootScope.parsed;
	}, function(n, o) {
		if (n) {
			for (var letterObject in $scope.letters) {
				$scope.letters[letterObject].active = false;
			}
			var tmplist = [];
			if (!$rootScope.recentlyAdded) {
				$scope.loading.recentAdded = true;
			}
			RestService.Overview.recentlyAdded(function(json) {
				$timeout(function() {
					$scope.loading.recentAdded = false;
					if (json) {
						angular.forEach(json.data.albums, function(album) {
							var exists = false;
							angular.forEach(tmplist, function(tmpalbum) {
								if ((tmpalbum.artist === (album.artist || album.album_artist).toLowerCase()) && (tmpalbum.album === (album.album_name || album.name).toLowerCase())) {
									// already in the list; skip
									exists = true;
								}
							});
							if (!exists) {
								var recentAlbum = {
									artist : (album.artist || album.album_artist).toLowerCase(),
									album : (album.album_name || album.name).toLowerCase(),
									letter : getFirstLetter(album.artist || album.album_artist),
									url : '/letter/' + getFirstLetter(album.artist || album.album_artist) + '/artist/' + stripThe((album.artist || album.album_artist)) + '/album/' + (album.album_name || album.name).toLowerCase()
								};
								tmplist.push(recentAlbum);
							}
						});
						$scope.recentlyAdded = tmplist;
						$rootScope.recentlyAdded = $scope.recentlyAdded;
					}
				}, 10);
			});
			$scope.$watch(function() {
				return $rootScope.user && $rootScope.user.lastfmuser;
			}, function(n, o) {
				if (n) {
					var tmplist = [];
					if (!$rootScope.upcommingAlbums) {
						$scope.loading.upcomming = true;
					}
					RestService.Overview.upcomming(n, function(json) {
						$scope.loading.upcomming = false;
						if (json.albums) {
							angular.forEach(json.albums.album, function(album) {
								var upcommingAlbum = {
									artist : album.artist.name,
									album : album.name,
									image : album.image[album.image.length -1]["#text"],
									releaseDate : album["@attr"].releasedate.substring(0, album["@attr"].releasedate.indexOf(' 00:'))
								};
								tmplist.push(upcommingAlbum);
							});
						}
						$scope.upcommingAlbums = tmplist;
						$rootScope.upcommingAlbums = $scope.upcommingAlbums;
					});
					if (!$rootScope.recentTracks) {
						$scope.loading.recent = true;
					}
					$scope.loadRecent(n);
					timer = $interval(function() {
						$scope.loadRecent(n);
					}, 1000 * 5);
				}
			});
		}
	});
}]);
