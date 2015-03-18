angular.module('JSMusicDB.ImageService', []).factory('ImageService', ['$log', '$http', '$rootScope', '$sce',
function($log, $http, $rootScope, $sce) {

	var baseArtistUrl = "https://api.spotify.com/v1/search?q={0}&type=artist&limit=1",
			baseAlbumUrl = "https://api.spotify.com/v1/search?q=album:{1}+artist:{0}&type=album&limit=1";

	var synologyAlbumUrl = sessionStorage.getItem("synoServer") + "/webapi/AudioStation/cover.cgi?api=SYNO.AudioStation.Cover&output_default=true&is_hr=true&version=2&library=shared&method=getcover&view=album&album_name={1}&album_artist_name={0}";

	var factory = {};

	factory.getArt = function(art, callback) {
		if (art && art !== '|') {
			// spotify -> lastfm

			/*
			factory.getSynologyArt(art, function (blob) {
				if (blob) {
					callback(URL.createObjectURL(blob));
				}
			});
			*/

			if ($rootScope.imageMode === 'spotify') {
				factory.getSpotifyArt(art, function(url) {
					if (url) {
						callback(url);
					} else {
						factory.getLastFMArt(art, function(url) {
							if (url) {
								callback(url);
							} else {
								callback(null);
							}
						});
					}
				});
			} else if ($rootScope.imageMode === 'lastfm') {
				factory.getLastFMArt(art, function(url) {
					if (url) {
						callback(url);
					} else {
						callback(null);
					}
				});
			}
		} else {
			callback(null);
		}
	};

	factory.getSynologyArt = function (art, callback) {
		var artist, album;
		artist = factory.filter(art);
		if (art.indexOf("|") !== -1) {
			artist = factory.filter(art.split("|")[0]);
			album = factory.filter(art.split("|")[1]);
		}
		var query;
		query = synologyAlbumUrl.replace("{1}", encodeURIComponent(album)).replace("{0}", encodeURIComponent(artist));
		$http.get(query, {responseType:'blob'}).success(function(blob) {
			callback(blob);
		}).error(function() {
			callback(null);
		});
	};

	factory.getSpotifyArt = function(art, callback) {
		var artist, album;
		artist = factory.filter(art);
		if (art.indexOf("|") !== -1) {
			artist = factory.filter(art.split("|")[0]);
			album = factory.filter(art.split("|")[1]);
		}
		var query;
		if (album) {
			query = baseAlbumUrl.replace("{1}", encodeURIComponent(album)).replace("{0}", encodeURIComponent(artist));
		} else {
			query = baseArtistUrl.replace("{0}", encodeURIComponent(artist));
		}
		if (artist) {
			$http.get(query).success(function(json) {
				if (json && json.albums && json.albums.items && json.albums.items.length > 0 && json.albums.items[0].images[0]) {
					callback(json.albums.items[0].images[0].url || "images/nocover.webp");
				} else if (json && json.artists && json.artists.items && json.artists.items.length > 0 && json.artists.items[0].images[0]) {
					callback(json.artists.items[0].images[0].url || "images/nocover.webp");
				} else {
					callback(null);
				}
			}).error(function() {
				callback(null);
			});
		} else {
			callback(null);
		}
	};
	factory.getLastFMArt = function(art, callback) {
		var artist, album;
		artist = factory.filter(art);
		if (art.indexOf("|") !== -1) {
			artist = factory.filter(art.split("|")[0]);
			album = factory.filter(art.split("|")[1]);
		}
		var query = {
			method : 'artist.getinfo',
			api_key : '956c1818ded606576d6941de5ff793a5',
			artist : artist,
			format : 'json',
			autoCorrect : true
		};
		if (album) {
			query.method = 'album.getinfo';
			query.album = album;
		}
		if (artist) {
			$http.get('http://ws.audioscrobbler.com/2.0/', {
				params : query
			}).success(function(json) {
				if (json && json.album) {
					angular.forEach(json.album.image, function(e) {
						if (e.size === "mega") {
							callback(e["#text"] || "images/nocover.webp");
						}
					});
				} else if (json && json.artist) {
					angular.forEach(json.artist.image, function(e) {
						if (e.size === "mega") {
							callback(e["#text"] || "images/nocover.webp");
						}
					});
				} else {
					callback(null);
				}
			}).error(function() {
				callback(null);
			});
		} else {
			callback(null);
		}
	};

	factory.filter = function(s) {
		s = s.replace("%", "");
		s = s.replace("\"", "");
		s = s.replace("/", " & ");
		return s;
	};

	return factory;
}]);
