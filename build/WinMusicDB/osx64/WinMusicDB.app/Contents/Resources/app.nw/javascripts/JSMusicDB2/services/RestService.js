angular.module('JSMusicDB.RestService', []).factory('RestService', ['$http', '$log', '$location',
function($http, $log, $location) {

	var serverType = {
		type : 'synology',
		extension : 'php'
	};
	var cache = {
		sid : null,
		server : null,
		url : null
	};
	var getPlaySrc = function($scope, path, id, track) {
		var src;
		if ($scope.currentSrc === "both") {
			// do we have a local version?
			if ($scope.local.tracks[track.artistID + "-" + track.album.toLowerCase() + "-" + track.title.toLowerCase()]) {
				$scope.playing.track.source = "ion-monitor";
				$scope.playing.track.sourceString = "local";
				src = $scope.local.tracks[track.artistID + "-" + track.album.toLowerCase() + "-" + track.title.toLowerCase()].path;
			} else {
				// if not play the cloud based version
				$scope.playing.track.source = "ion-cloud";
				$scope.playing.track.sourceString = "cloud";
				src = cache.server + "/webapi/AudioStation/stream.cgi/0.mp3?sid=" + cache.clientSID + "&api=SYNO.AudioStation.Stream&version=2&method=stream&id=music_" + id;
			}
		} else if ($scope.currentSrc === "cloud") {
			$scope.playing.track.source = "ion-cloud";
			$scope.playing.track.sourceString = "cloud";
			src = cache.server + "/webapi/AudioStation/stream.cgi/0.mp3?sid=" + cache.clientSID + "&api=SYNO.AudioStation.Stream&version=2&method=stream&id=music_" + id;
		} else {
			$scope.playing.track.source = "ion-monitor";
			$scope.playing.track.sourceString = "local";
			src = path;
		}
		return src;
	};

	return {
		Login : {
			doLogin : function(user, callback) {
				cache.server = user.serverurl + ":" + user.serverport;
				cache.jsmusicdb = user.serverurl + "/jsmusicdb/";

				$http.get(cache.server + '/webapi/query.cgi?api=SYNO.API.Info&version=1&method=query&query=all').success(function(json) {
					// session should be AudioStation but the api is broken
					$http.get(cache.server + '/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=' + user.account + '&passwd=' + user.passwd + '&otp_code=' + user.opt_code + '&session=AudioStation').success(function(json) {
						if (json.data) {
							cache.clientSID = json.data.sid;
							cache.sid = json.data.sid;
							document.cookie = "id=" + cache.sid + "; path=/";
						}
						callback(json);
					});
				});
			}
		},
		Overview : {
			upcomming : function(username, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/?method=user.getnewreleases&user=' + username + '&api_key=' + lastfm.api_key + '&format=json').success(function(json) {
					callback(json);
				});
			},
			recent : function(username, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + username + '&api_key=' + lastfm.api_key + '&format=json').success(function(json) {
					callback(json);
				});
			},
			recentlyAdded : function(callback) {
				$http.get(cache.server + '/webapi/AudioStation/album.cgi', {
					params : {
						limit : 8,
						method : 'list',
						library : 'shared',
						api : 'SYNO.AudioStation.Album',
						sort_by : 'time',
						sort_direction : 'desc',
						version : 2
					}
				}).success(function(json) {
					callback(json);
				});
			},
			changelog : function(callback) {
				$http.get('changelog.txt').success(function(txt) {
					callback(txt);
				});
			}
		},
		Music : {
			get : function(callback) {
				$http.get(cache.jsmusicdb + 'proxy/' + serverType.type + '/getJSON.' + serverType.extension, {
					params : {
						sid : cache.sid,
						server : cache.server
					}
				}).success(function(json) {
					callback(json);
				});
			},
			play : function($scope, track, callback) {
				if (track) {
					console.log(track);
					var playerURL = getPlaySrc($scope, track.path, track.id, track);
					callback(playerURL);
				}
			},
			getTrackInfo : function(track, username, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/?method=track.getInfo&username=' + username + '&api_key=' + lastfm.api_key + '&format=json&artist=' + track.artist + '&track=' + track.title).success(function(json) {
					callback(json);
				});
			},
			getYouTube: function(track, callback) {
				var q = track.artist + " - " + track.title;
				$http.get('https://www.googleapis.com/youtube/v3/search?part=snippet&q='+encodeURI(q)+'&key=AIzaSyBlkYNvrCRt29oMhTrhAdoLFJHXLvZs-VE').success(function (json) {
					callback(json);
				});
			},
			rescan : function(callback) {
				$http.get(cache.jsmusicdb + 'proxy/' + serverType.type + '/rescan.' + serverType.extension, {
					params : {
						sid : cache.sid,
						server : cache.server
					}
				}).success(function() {
					callback();
				});
			},
			getAlbumArt : function(track, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/', {
					params : {
						method : 'album.getinfo',
						api_key : '956c1818ded606576d6941de5ff793a5',
						artist : track.artist,
						album : track.albumNode.album,
						format : 'json',
						autoCorrect : true
					}
				}).success(function(json) {
					if (json.album) {
						var artlist = json.album.image;
						$.each(artlist, function() {
							if (this.size === 'extralarge') {
								var url = this["#text"];
								var imgUrl = url || "images/nocover.webp";
								callback(imgUrl);
							}
						});
					}
				});
			},
			getDominantColor : function($rootScope, key, callback) {
				if (localStorage.getItem("color-" + key)) {
					var color = JSON.parse(localStorage.getItem("color-" + key));
					callback(color);
				} else {
					if ($rootScope.cachedImages[key]) {
						var colorThief = new ColorThief();
						var img = $("<img src='" + $rootScope.cachedImages[key] + "'>");
						var color = colorThief.getColor(img.get(0));
						localStorage.setItem("color-" + key, JSON.stringify(color));
						callback(color);
					} else {
						var splitted = key.split("|");
						// get data
						$http.get('http://ws.audioscrobbler.com/2.0/', {
							params : {
								method : 'album.getinfo',
								api_key : '956c1818ded606576d6941de5ff793a5',
								artist : splitted[0],
								album : splitted[1],
								format : 'json',
								autoCorrect : true
							}
						}).success(function(json) {
							if (json.album) {
								var artlist = json.album.image;
								$.each(artlist, function() {
									if (this.size === 'extralarge') {
										var url = this["#text"];
										var imgUrl = url || "images/nocover.webp";
										var colorThief = new ColorThief();
										var img = $("<img src='" + imgUrl + "'>");
										img.on("load", function() {
											var color;
											try {
												color = colorThief.getColor(img.get(0));
											} catch (e) {
												color = [96, 125, 139];
											}
											localStorage.setItem("color-" + key, JSON.stringify(color));
											callback(color);
										});
										return false;
									}
								});
							}
						});
					}
				}
			}
		},
		Playlists : {
			getPlaylists : function(callback) {
				$http.get(cache.server + '/webapi/AudioStation/playlist.cgi', {
					params : {
						offset : 0,
						limit : 1000,
						method : 'list',
						api : 'SYNO.AudioStation.Playlist',
						library : 'all',
						sort_direction : 'ASC',
						version : 2
					}
				}).success(function(json) {
					callback(json);
				});
			},
			getPlaylist : function(playlistID, callback) {
				$http.get(cache.server + '/webapi/AudioStation/playlist.cgi', {
					params : {
						offset : 0,
						id : playlistID,
						method : 'getinfo',
						api : 'SYNO.AudioStation.Playlist',
						library : 'all',
						version : 2,
						additional : "songs_song_tag,songs_song_audio"
					}
				}).success(function(json) {
					callback(json);
				});
			},
			getLastFMLovedPlaylist : function(username, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/?method=user.getlovedtracks&user=' + username + '&api_key=' + lastfm.api_key + '&format=json&limit=-1').success(function(json) {
					callback(json);
				});
			},
			getLastFMTrackInfo : function(mbid, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=' + lastfm.api_key + '&format=json&mbid=' + mbid).success(function(json) {
					callback(json);
				});
			},
			getLastFMSimilarArtists : function(artist, callback) {
				$http.get('http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=' + artist.name + "&api_key=" + lastfm.api_key + '&format=json').success(function(json) {
					callback(json);
				});
			},
			storeIdByKey : function(key, track) {
				localStorage.setItem(key, track.id);
			},
			getTrackIdByKey : function(key) {
				return localStorage.getItem(key);
			},
			removeByKey : function(key) {
				localStorage.removeItem(key);
			},
			addPlaylist : function(playlistName, callback, songs) {
				$http.post(cache.server + '/webapi/AudioStation/playlist.cgi', $.param({
					method : 'create',
					api : 'SYNO.AudioStation.Playlist',
					library : 'shared',
					version : 2,
					name : playlistName,
					songs : songs
				}), {
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				}).success(function(json) {
					callback(json);
				});
			},
			renamePlaylist : function(playlistID, playlistName, callback) {
				$http.get(cache.server + '/webapi/AudioStation/playlist.cgi', {
					params : {
						method : 'rename',
						api : 'SYNO.AudioStation.Playlist',
						library : 'shared',
						version : 2,
						id : playlistID,
						new_name : playlistName
					}
				}).success(function(json) {
					callback(json);
				});
			},
			removePlaylist : function(playlistName, callback) {
				$http.get(cache.server + '/webapi/AudioStation/playlist.cgi', {
					params : {
						method : 'delete',
						api : 'SYNO.AudioStation.Playlist',
						library : 'shared',
						version : 2,
						id : playlistName
					}
				}).success(function(json) {
					callback(json);
				});
			},
			removeFromPlaylist : function(playlist, track, $index, callback) {
				$http.get(cache.server + '/webapi/AudioStation/playlist.cgi', {
					params : {
						method : 'updatesongs',
						api : 'SYNO.AudioStation.Playlist',
						library : 'shared',
						version : 2,
						limit : 1,
						id : playlist.id,
						offset : $index
					}
				}).success(function(json) {
					callback(json);
				});
			},
			addTrackToPlaylist : function(playlist, track, callback) {
				$http.get(cache.server + '/webapi/AudioStation/playlist.cgi', {
					params : {
						method : 'updatesongs',
						api : 'SYNO.AudioStation.Playlist',
						library : 'shared',
						version : 2,
						limit : 1,
						id : playlist.id,
						offset : -1,
						songs : 'music_' + track.id
					}
				}).success(function(json) {
					callback(json);
				});
			}
		}
	};
}]);

jsmusicdb.factory('myHttpInterceptor', function($rootScope, $q, $location) {
	return function(promise) {
		return promise.then(function(response) {
			return response;
		}, function(response) {
			var status = response.status;
			switch(status) {
			case 403:
				$rootScope.$broadcast("login.logout");
				break;
			case 404:
				// redirect to the 404 page; overwriting the entry in the history
				$location.path('404').replace();
				break;
			default:
				return $q.reject(response);
			}
			return $q.reject(response);
		});
	};
});
jsmusicdb.config(function($httpProvider) {
	$httpProvider.useApplyAsync(true);
	$httpProvider.interceptors.push('myHttpInterceptor');
});