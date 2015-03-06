jsmusicdb.controller('PlaylistController', ['$scope', '$routeParams', '$log', 'RestService', '$rootScope', 'ModelService', '$modal', '$translate', '$timeout',
function($scope, $routeParams, $log, RestService, $rootScope, ModelService, $modal, $translate, $timeout) {
	'use strict';
	window.scrollTo(0, 0);
	// get Playlists
	$rootScope.$watch(function() {
		return $rootScope.parsed;
	}, function(n, o) {
		if (n) {
			$scope.loading.playlists = true;
			RestService.Playlists.getPlaylists(function(json) {
				$timeout(function() {
					$scope.playlists = json;
					$scope.loading.playlists = false;

					if ($routeParams.id) {
						$scope.setPlaylist($routeParams.id);
					}

				}, 10);
			});
		}
	});

	$scope.loading = {};

	$scope.$on("$destroy", function () {
		$("body").removeClass("fancyAlbum");
		// reset to default header
		$("body header").css("background-color", "");
		$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "");
		$(window).off("scroll");
		$rootScope.path = $rootScope.platform + 'MusicDB2';
	});

	$scope.addPlaylist = function() {
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
					$timeout(function() {
						$scope.loading.playlists = true;
						RestService.Playlists.getPlaylists(function(json) {
							$timeout(function() {
								$scope.playlists = json;
								$scope.loading.playlists = false;
							}, 10);
						});
					}, 10);
				});
			}
		});
	};

	$scope.renamePlaylist = function(playlistID, playlistName) {
		var modalInstance = $modal.open({
			templateUrl : 'templates/addPlaylist.html',
			controller : 'AddPlaylistController',
			backdrop : 'static',
			resolve : {
				playlistName : function() {
					return playlistName;
				}
			}
		});

		modalInstance.result.then(function(playlistName) {
			if (playlistName) {
				RestService.Playlists.renamePlaylist(playlistID, playlistName, function(json) {
					$timeout(function() {
						$scope.loading.playlists = true;
						RestService.Playlists.getPlaylists(function(json) {
							$timeout(function() {
								$scope.playlists = json;
								$scope.loading.playlists = false;

								if ($scope.viewPlaylist && $scope.viewPlaylist.id == playlistID) {
									$scope.viewPlaylist.title = playlistName;
								}
							}, 10);
						});
					}, 10);
				});
			}
		});
	};

	$scope.removePlaylist = function(playlistName) {
		RestService.Playlists.removePlaylist(playlistName, function(json) {
			$timeout(function() {
				$scope.loading.playlists = true;
				RestService.Playlists.getPlaylists(function(json) {
					$timeout(function() {
						$scope.playlists = json;
						$scope.loading.playlists = false;
						if ($scope.viewPlaylist && $scope.viewPlaylist.id === playlistName) {
							$scope.viewPlaylist = null;
						}
					}, 10);
				});
			}, 10);
		});
	};
	$scope.removeFromPlaylist = function(playlist, track, $index) {
		$scope.loading.removeFromPlaylist = true;
		if (playlist.id) {
			RestService.Playlists.removeFromPlaylist(playlist, track, $index, function(json) {
				$timeout(function() {
					$scope.loading.removeFromPlaylist = false;
					playlist.items.splice($index, 1);
				}, 10);
				// remove the item from the view
			});
		} else {
			// last.fm
			var url = 'http://ws.audioscrobbler.com/2.0/', data = {
				method : 'track.unlove',
				api_key : '956c1818ded606576d6941de5ff793a5',
				artist : track.artist,
				track : track.title,
				sk : localStorage.getItem("key"),
				api_sig : lastfm.signplayinglove(track.artist, null, track.title, 'track.unlove')
			};
			$.post(url, data, function() {
				$scope.$apply(function() {
					$scope.loading.removeFromPlaylist = false;
					playlist.items.splice($index, 1);
					// remove the item from the view
				});
			});

		}
	};

	$scope.setPlaylist = function(playlist) {
		$scope.loading.playlist = true;
		$scope.viewPlaylist = {};
		$scope.canSavePlaylist = false;
		$scope.chooseArtist = false;
		if (playlist.name) {
			// server based playlist
			$rootScope.path = playlist.name;
			RestService.Playlists.getPlaylist(playlist.id, function(json) {
				$timeout(function() {
					var tmplist = [];
					angular.forEach(json.data.playlists[0].additional.songs, function(t) {
						var track = $scope.tracks[t.id.substring(6)];
						if (track) {
							tmplist.push(track);
						}
					});
					$scope.viewPlaylist = {
						title : playlist.name,
						items : tmplist,
						id : playlist.id,
						item_id : playlist.item_id
					};
					$scope.loading.playlist = false;
					$scope.niceScroll.resize();
				}, 10);
			});
		} else if (playlist === 'last.fm') {
			// last.fm loved playlist
			$translate('playlists.lists.lastfmName').then(function(translation) {
				$rootScope.path = translation + " " + $rootScope.user.lastfmuser;
				RestService.Playlists.getLastFMLovedPlaylist($rootScope.user.lastfmuser, function(json) {
					var tmplist = [], tracksAdded = [], duplicates = [];
					angular.forEach(json.lovedtracks.track, function(fmtrack) {
						var artistName = fmtrack.artist.name, title = fmtrack.name, artistName = ModelService.stripThe(artistName.toUpperCase()), mbid = fmtrack.mbid;
						if (RestService.Playlists.getTrackIdByKey(artistName + (title.toLowerCase()))) {
							var track = $scope.tracks[RestService.Playlists.getTrackIdByKey(artistName + (title.toLowerCase()))];
							if (track) {
								tmplist.push(track);
							} else {
								// remove from cache
								RestService.Playlists.removeByKey(artistName + (title.toLowerCase()));
								if (artist) {
									var uniqueTrack = null, duplicate = false;
									// TODO: use mbid in fmtrack to get the album from lastfm and store that data in the cache
									angular.forEach(artist.albums, function(album) {
										angular.forEach(album.tracks, function(track) {
											if (track.title.toLowerCase() === title.toLowerCase()) {
												if (tracksAdded[artistName + title]) {
													// duplicate
													duplicate = true;
												} else {
													// unique
													uniqueTrack = track;
												}
												tracksAdded[artistName + title] = track;
											}
										});
									});
									if (uniqueTrack && !duplicate) {
										RestService.Playlists.storeIdByKey(artistName + (title.toLowerCase()), uniqueTrack);
										tmplist.push(uniqueTrack);
									} else {
										// get data from last.fm using the mbid
										RestService.Playlists.getLastFMTrackInfo(mbid, function(mbidtrack) {
											if (mbidtrack.track && mbidtrack.track.album) {
												var albumName = mbidtrack.track.album.title;
												// do we have this album in the collection?
												angular.forEach(artist.albums, function(album) {
													if (album.album === albumName.toLowerCase()) {
														// we do!
														tracksAdded[artistName + title] = null;
														// reset the duplicate counter for this track
														duplicate = false;
														angular.forEach(album.tracks, function(track) {
															if (track.title.toLowerCase() === title.toLowerCase()) {
																if (tracksAdded[artistName + title]) {
																	// duplicate
																	duplicate = true;
																} else {
																	// unique
																	uniqueTrack = track;
																}
																tracksAdded[artistName + title] = track;
															}
														});
														if (uniqueTrack && !duplicate) {
															RestService.Playlists.storeIdByKey(artistName + (title.toLowerCase()), uniqueTrack);
															tmplist.push(uniqueTrack);
														}
													}
												});
											}
										});
									}
								} else {
									$log.debug("artist not found", artistName);
								}
							}
						} else {
							var artist = $scope.artists[artistName];
							if (artist) {
								var uniqueTrack = null, duplicate = false;
								// TODO: use mbid in fmtrack to get the album from lastfm and store that data in the cache
								angular.forEach(artist.albums, function(album) {
									angular.forEach(album.tracks, function(track) {
										if (track.title.toLowerCase() === title.toLowerCase()) {
											if (tracksAdded[artistName + title]) {
												// duplicate
												duplicate = true;
											} else {
												// unique
												uniqueTrack = track;
											}
											tracksAdded[artistName + title] = track;
										}
									});
								});
								if (uniqueTrack && !duplicate) {
									RestService.Playlists.storeIdByKey(artistName + (title.toLowerCase()), uniqueTrack);
									tmplist.push(uniqueTrack);
								} else {
									// get data from last.fm using the mbid
									RestService.Playlists.getLastFMTrackInfo(mbid, function(mbidtrack) {
										if (mbidtrack.track && mbidtrack.track.album) {
											var albumName = mbidtrack.track.album.title;
											// do we have this album in the collection?
											angular.forEach(artist.albums, function(album) {
												if (album.album === albumName.toLowerCase()) {
													// we do!
													tracksAdded[artistName + title] = null;
													// reset the duplicate counter for this track
													duplicate = false;
													angular.forEach(album.tracks, function(track) {
														if (track.title.toLowerCase() === title.toLowerCase()) {
															if (tracksAdded[artistName + title]) {
																// duplicate
																duplicate = true;
															} else {
																// unique
																uniqueTrack = track;
															}
															tracksAdded[artistName + title] = track;
														}
													});
													if (uniqueTrack && !duplicate) {
														RestService.Playlists.storeIdByKey(artistName + (title.toLowerCase()), uniqueTrack);
														tmplist.push(uniqueTrack);
													}
												}
											});
										}
									});
								}
							} else {
								$log.debug("artist not found", artistName);
							}
						}
					});
					$scope.viewPlaylist = {
						title : translation + " " + $rootScope.user.lastfmuser,
						items : tmplist,
						duplicates : duplicates
					};
					$scope.niceScroll.resize();
					$scope.loading.playlist = false;
					$scope.canSavePlaylist = true;
				});
			});
		} else if (playlist === "random") {
			$translate('playlists.lists.random').then(function(translation) {
				var tmplist = [];
				var keys = Object.keys($scope.tracks);
				keys = shuffle(keys);
				keys = keys.splice(0, 50);
				$rootScope.path = translation;
				angular.forEach(keys, function(value) {
					var track = $scope.tracks[value];
					if (track) {
						tmplist.push(track);
					}
				});
				$scope.viewPlaylist = {
					title : translation,
					items : tmplist
				};
				$scope.niceScroll.resize();
				$scope.loading.playlist = false;
				$scope.canSavePlaylist = true;
			});
		} else if (playlist === 'current') {
			$translate('playlists.lists.current').then(function(translation) {
				$rootScope.path = translation;
				$scope.viewPlaylist = {
					title : translation,
					items : ($rootScope.playingList) ? $rootScope.playingList.items : $scope.playing.track.albumNode.tracks
				};
				$scope.niceScroll.resize();
				$scope.loading.playlist = false;
				$scope.canSavePlaylist = true;
			});
		} else if (playlist === 'artistradio') {
			$translate('playlists.lists.radio').then(function(translation) {
				$rootScope.path = translation;
				$scope.niceScroll.resize();
				$scope.loading.playlist = false;
				$scope.chooseArtist = true;
				var artists = Object.keys($scope.artists);
				var list = [];
				angular.forEach(artists, function(value) {
					list.push($scope.artists[value]);
				});
				list.sort(function(a, b) {
					if (a.sortName < b.sortName) {
						return -1;
					} else {
						return 1;
					}
				});
				$scope.chooseArtistList = list;
				$scope.viewPlaylist = {
					title : translation,
					items : []
				};
				$scope.noMoreSimilarArtists = false;
			});
		} else if (playlist === 'radio') {
			var highRotation = [],
					mediumRotation = [];
			RestService.Playlists.getLastFMTopArtists($rootScope.user.lastfmuser, function(json) {
				angular.forEach(json.topartists.artist, function (v, i) {
					var artistName = ModelService.stripThe(v.name.toUpperCase());
					if (i < 7) {
						highRotation.push($scope.artists[artistName]);
					} else {
						mediumRotation.push($scope.artists[artistName]);
					}
				});
				$scope.generateRadio(highRotation, mediumRotation);
			});
		}
	};

	$scope.setPreferredTrack = function(track) {
		RestService.Playlists.storeIdByKey(track.artistID + (track.title.toLowerCase()), track);
	};

	$scope.playTrack = function(track, playlist) {
		if ($scope.playing.track) {
			$scope.playing.track.isPlaying = false;
		}
		$scope.playing.track = track;
		$rootScope.$broadcast('play.track', $scope.playing.track, playlist);
	};

	$scope.shuffleState = 'shuffle';
	$scope.shuffle = function() {
		if ($scope.shuffleState === 'shuffle') {
			shuffle($scope.viewPlaylist.items);
		}
	};

	$scope.savePlaylist = function () {
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
				var songs = [];
				angular.forEach($scope.viewPlaylist.items, function (track) {
					songs.push("music_" + track.id);
				});
				RestService.Playlists.addPlaylist(playlistName, function(json) {
					$timeout(function() {
						$scope.loading.playlists = true;
						RestService.Playlists.getPlaylists(function(json) {
							$timeout(function() {
								$scope.playlists = json;
								$scope.loading.playlists = false;
							}, 10);
						});
					}, 10);
				}, songs.join(","));
			}
		});
	};

	$scope.setStartArtist = function(artist) {
		$scope.loading.radio = true;
		// get a single random track for this artist
		var tracks = [];
		angular.forEach(artist.albums, function(album) {
			angular.forEach(album.tracks, function(track) {
				tracks.push(track);
			});
		});
		tracks = shuffle(tracks);
		var song = tracks[0];
		$scope.viewPlaylist.items = [song];
		$scope.usedArtists = [artist];
		// generate playlist items
		generatePlaylistItem(artist, 1);
		$scope.chooseArtist = false;
	};

	function generatePlaylistItem(artist, index) {

		RestService.Playlists.getLastFMSimilarArtists(artist, function(json) {
			var foundArtists = [];
			if (json.similarartists && json.similarartists.artist && json.similarartists.artist.length > 10) {
				var mostSimilar = json.similarartists.artist;
				angular.forEach(mostSimilar, function(name) {
					var lfmartist = name.name;
					if ($scope.artists[stripThe(lfmartist)]) {
						foundArtists.push(stripThe(lfmartist));
					}
				});
				// only use the top 5 found artists so we stay in roughly the same genre.
				if (foundArtists.length > 5) {
					foundArtists = foundArtists.splice(0,5);
				}
				foundArtists = shuffle(foundArtists);
				var newArtist = $scope.artists[foundArtists[0]];
				if (newArtist) {
					// get a song for this new artist
					var tracks = [];
					angular.forEach(newArtist.albums, function(album) {
						angular.forEach(album.tracks, function(track) {
							tracks.push(track);
						});
					});
					tracks = shuffle(tracks);
					var song = tracks[0];
					$scope.viewPlaylist.items.push(song);
					$scope.usedArtists.push(artist);
					// rinse and repeat while index < 50
					index++;
					if (index < 50) {
						generatePlaylistItem(newArtist, index);
					} else {
						$timeout(function() {
							$scope.loading.radio = false;
						}, 10);
						$scope.canSavePlaylist = true;
					}
				} else {
					// no similar artists found for this artist; let's try an older one
					if ($scope.usedArtists.length > 1) {
						var oldArtist = $scope.usedArtists[$scope.usedArtists.length - 1];
						if (oldArtist) {
							generatePlaylistItem(oldArtist, index);
						} else {
							$scope.noMoreSimilarArtists = true;
							$timeout(function() {
								$scope.loading.radio = false;
							}, 10);
						}
					} else {
						$scope.noMoreSimilarArtists = true;
						$timeout(function() {
							$scope.loading.radio = false;
						}, 10);
					}
				}
			} else {
				// no similar artists found for this artist; let's try an older one
				if ($scope.usedArtists.length > 1) {
					var oldArtist = $scope.usedArtists[$scope.usedArtists.length - 1];
					if (oldArtist) {
						generatePlaylistItem(oldArtist, index);
					} else {
						$scope.noMoreSimilarArtists = true;
						$timeout(function() {
							$scope.loading.radio = false;
						}, 10);
					}
				} else {
					$scope.noMoreSimilarArtists = true;
					$timeout(function() {
						$scope.loading.radio = false;
					}, 10);
				}
			}
		});
	};

	$scope.generateRadio = function (h,m) {
		// generate 50 items
		var playlist = [];
		for (var i = 0; i < 50; i++) {
			if (i % 3 === 0 || i % 4 === 0) {
				var a = $scope.getRandomArtistFromList(h);
				if (a && a.albums) {
					playlist.push($scope.getTrackFromArtist(a));
				}
			} else if (i % 5 === 0 || i % 7 === 0) {
				var a = $scope.getRandomArtistFromList(h);
				if (a && a.albums) {
					playlist.push($scope.getTrackFromArtist(a));
				}
			} else {
				var a = $scope.getRandomArtistFromList($scope.artists, true);
				if (a && a.albums) {
					playlist.push($scope.getTrackFromArtist(a));
				}
			}
		}
		$scope.viewPlaylist = {
			title : "Radio",
			items : playlist
		};
		$scope.loading.playlist = false;
		$scope.canSavePlaylist = true;
		$scope.niceScroll.resize();
	};

	$scope.getTrackFromArtist = function (artist) {
		var tracks = [];
		if (artist && artist.albums) {
			angular.forEach(artist.albums, function(album) {
				angular.forEach(album.tracks, function(track) {
					tracks.push(track);
				});
			});
			tracks = shuffle(tracks);
			return tracks[0];
		} else {
			console.error(artist);
		}
	};

	$scope.getRandomArtistFromList = function (list, isAllArtists) {
		var max = list.length;
		var random = Math.random();
		random = Math.floor(random * max);
		if (isAllArtists) {
			var artists = Object.keys($scope.artists);
			max = artists.length;
			random = Math.random();
			random = Math.floor(random * max);
			var key = artists[random];
			return list[key];
		}
		return list[random];
	};

}]);

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

var stripThe = function(name) {
	if (name) {
		name = $.trim(name.toUpperCase());
		name = (name.indexOf('THE ') === 0) ? name.substring(4) : name;
		return name;
	}
};
