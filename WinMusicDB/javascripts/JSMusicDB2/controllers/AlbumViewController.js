/* global jsmusicdb */
/// <reference path="../../../../typings/angularjs/angular.d.ts"/>
/// <reference path="../../../../typings/jquery/jquery.d.ts"/>
jsmusicdb.controller('AlbumViewController', ['$scope', '$routeParams', '$log', '$rootScope', 'RestService', '$modal', '$timeout', '$sce', 
function($scope, $routeParams, $log, $rootScope, RestService, $modal, $timeout, $sce) {
	'use strict';

	window.scrollTo(0, 0);
	$("body").addClass("fancyAlbum");

	$scope.loading = {};

	/*
	$(window).scroll(function () {
		var scroll = $(window).scrollTop();
		var depthMultiplier = -0.25;
		$(".fullArt").css("transform", "translateY(" + depthMultiplier * scroll + "px)");
	});
	*/

	$scope.$on("$destroy", function () {
		$("body").removeClass("fancyAlbum");
		// reset to default header
		/*
		$("body header").css("background-color", "");
		$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "");
		$(window).off("scroll");
		*/
		$rootScope.path = $rootScope.platform + 'MusicDB2';
	});

	if ($routeParams.letter) {
		$rootScope.$watch(function() {
			return $rootScope.parsed;
		}, function(n, o) {
			if (n) {
				var letter = $routeParams.letter,
				artist = $scope.artists[$routeParams.artist.toUpperCase()] || $scope.local.artists[$routeParams.artist.toUpperCase()],
				album = $scope.albums[$routeParams.artist.toUpperCase() + "-" + $routeParams.album.toLowerCase()] || $scope.local.albums[$routeParams.artist.toUpperCase() + "-" + $routeParams.album.toLowerCase()];
				var source = '';
				if ($scope.currentSrc === 'both') {
					if ($scope.local && $scope.local.albums[$routeParams.artist.toUpperCase() + "-" + $routeParams.album.toLowerCase()]) {
						source = "fa fa-desktop fa-fw";
					}
					if ($scope.cloud && $scope.cloud.albums[$routeParams.artist.toUpperCase() + "-" + $routeParams.album.toLowerCase()]) {
						source = (!source) ? "fa fa-cloud fa-fw" : "fa fa-globe fa-fw";
					}
				} else {
					source = ($scope.currentSrc === 'local') ? "fa fa-desktop fa-fw" : "fa fa-cloud fa-fw";
				}
				$scope.source = source;
				for (var letterObject in $scope.letters) {
					$scope.letters[letterObject].active = false;
				}
				if ($scope.letters[letter]) {
					$scope.letters[letter].active = true;
				}
				if (album) {
					if (album.tracks.length === 0) {
						$rootScope.fetchingTracks = true;
						RestService.Music.getTracksForAlbum(album, function (json) {
							json.sort(function(a, b) {
								var totalNumberA = 0, totalNumberB = 0;
								if (a.disc) {
									totalNumberA = a.disc * 100 + a.number;
								} else {
									totalNumberA = 100 + a.number;
								}
								if (b.disc) {
									totalNumberB = b.disc * 100 + b.number;
								} else {
									totalNumberB = 100 + b.number;
								}
								if (totalNumberA < totalNumberB) {
									return -1;
								} else {
									return 1;
								}
							});
							var multiDisc = false;
							var test;
							angular.forEach(json, function (v,i) {
								v.albumNode = album;
								if (!test) {
									test = v.disc;
								} else if (test !== v.disc) {
									multiDisc = true;
								}
							});
							album.multiDisc = multiDisc;
							album.tracks = json;
							$rootScope.fetchingTracks = false;



						});
					} else {
						var multiDisc = false;
						var test;
						angular.forEach(album.tracks, function (v,i) {
							if (!test) {
								test = v.disc;
							} else if (test !== v.disc) {
								multiDisc = true;
							}
						});
						album.multiDisc = multiDisc;
					}

					$scope.viewAlbum = album;
					
					$rootScope.path = $sce.trustAsHtml(
						'<a href="#/letter/' + letter + '">' + letter + '</a> - ' + 
						'<a href="#/letter/' + letter + '/artist/' + $routeParams.artist + '">' + (artist.albumartist || artist.name) + '</a> - ' + 
						album.album
					);
					if ($scope.viewAlbum.collection) {
						$scope.albumart = $scope.viewAlbum.artistNode.name + "|" + $scope.viewAlbum.album;
					} else {
						$scope.albumart = $scope.viewAlbum.artistNode.name;
					}

					// get current playlists
					RestService.Playlists.getPlaylists(function(json) {
						$scope.playlists = json;
					});

					// get dominant color
					/*
					RestService.Music.getDominantColor($rootScope, artist.name, function(color) {
						//$("body header").css("background-color", "rgba(" + color[0] + "," + color[1] + "," +color[2] + ", 0.9)");
						$("body header").css("background-color", "rgb(" + color[0] + "," + color[1] + "," +color[2] + ")");
						$timeout(function () {
							$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "rgba(" + color[0] + "," + color[1] + "," +color[2] + ", 0.5)");
							//$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "rgb(" + color[0] + "," + color[1] + "," +color[2] + ")");
						}, 10);
					});
					*/
					$timeout(function () {
						$scope.niceScroll.resize();
					}, 100);
				} else {
					console.log('no album found');
				}

			}
		});
	}

	$scope.back = function() {
		// go to album overview
		var letter = $routeParams.letter, artist = $routeParams.artist;
		document.location.hash = "/letter/" + letter + "/artist/" + artist;
	};

	$scope.playTrack = function(track, playlist) {
		if (track.state !== 'secondary') {
			if ($scope.playing.track) {
				$scope.playing.track.isPlaying = false;
				$scope.playing.track = null;
			}
			$scope.playing.track = track;
			if (!playlist) {
				$rootScope.playingList = null;
				$rootScope.$broadcast('play.track', track);
			} else {
				var playlingList = {
					items: playlist
				};
				$rootScope.$broadcast('play.track', track, playlingList);
			}
		}
	};

	$scope.addToPlaylist = function(playlist, track, callback) {
		$scope.loading.addToPlaylist = true;
		RestService.Playlists.addTrackToPlaylist(playlist, track, callback ||
		function(json) {
			track.state = 'primary';
			$scope.loading.addToPlaylist = false;
		});
	};
	$scope.addAlbumToPlaylist = function(playlist, album) {
		var index = 0;
		$scope.loading.addAlbumToPlaylist = true;

		var submitNext = function(track) {
			$scope.addToPlaylist(playlist, track, function() {
				if (album.tracks[index + 1]) {
					submitNext(album.tracks[index + 1]);
					index++;
				} else {
					$scope.loading.addAlbumToPlaylist = false;
					album.state = 'primary';
				}
			});
		};
		submitNext(album.tracks[index]);
	};

	$scope.addToNewPlaylist = function(track) {
		// create playlist
		var modalInstance = $modal.open({
			templateUrl : 'templates/addPlaylist.html',
			controller : 'AddPlaylistController',
			resolve : {
				playlistName : function() {
					return null;
				}
			}
		});

		modalInstance.result.then(function(playlistName) {
			if (playlistName) {
				RestService.Playlists.addPlaylist(playlistName, function(json) {
					RestService.Playlists.getPlaylists(function(json) {
						$scope.playlists = json;

						// and add the track to the newly created playlist
						angular.forEach(json.data.playlists, function(playlist) {
							if (playlist.name === playlistName) {
								$scope.addToPlaylist(playlist, track);
							}
						});
					});
				});
			}
		});
	};

	$scope.addAlbumToNewPlaylist = function(album) {
		// create playlist
		var modalInstance = $modal.open({
			templateUrl : 'templates/addPlaylist.html',
			controller : 'AddPlaylistController',
			resolve : {
				playlistName : function() {
					return null;
				}
			}
		});

		modalInstance.result.then(function(playlistName) {
			if (playlistName) {
				RestService.Playlists.addPlaylist(playlistName, function(json) {
					RestService.Playlists.getPlaylists(function(json) {
						$scope.playlists = json;

						// and add the track to the newly created playlist
						angular.forEach(json.data.playlists, function(playlist) {
							if (playlist.name === playlistName) {
								$scope.addAlbumToPlaylist(playlist, album);
							}
						});
					});
				});
			}
		});
	};

	$scope.shuffleState = 'shuffle';
	$scope.shuffle = function() {
		function shuffle(array) {
			var currentIndex = array.length, temporaryValue, randomIndex;

			// While there remain elements to shuffle...
			while (0 !== currentIndex) {

				// Pick a remaining element...
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				// And swap it with the current element.
				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			}

			return array;
		}

		if ($scope.shuffleState === 'shuffle') {
			shuffle($scope.viewAlbum.tracks);
			$scope.shuffleState = 'in order';
		} else {
			$scope.viewAlbum.tracks.sort(function(a, b) {
				var totalNumberA = 0, totalNumberB = 0;
				if (a.disc) {
					totalNumberA = a.disc * 100 + a.number;
				} else {
					totalNumberA = 100 + a.number;
				}
				if (b.disc) {
					totalNumberB = b.disc * 100 + b.number;
				} else {
					totalNumberB = 100 + b.number;
				}
				if (totalNumberA < totalNumberB) {
					return -1;
				} else {
					return 1;
				}
			});
			$scope.shuffleState = 'shuffle';
		}
	};
}]);
