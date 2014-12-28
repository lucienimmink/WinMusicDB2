angular.module('JSMusicDB.ModelService', []).factory('ModelService', ['$log', '$translate', '$timeout',
function($log, $translate, $timeout) {
	var factory = {};

	factory.parse = function(json, $scope, $rootScope, isLocal) {
		var start = new Date().getTime();
		$rootScope.parsed = false;
		if (json[0] !== "<") {
			angular.forEach(json, function(value) {
				factory.parseLine(value, $scope, isLocal);
			});
			// merge local and cloud music
			console.log("merging data local and cloud " + isLocal);
			angular.extend($scope.both, $scope.local);
			angular.extend($scope.both, $scope.cloud);
			// now both === cloud
			$timeout(function() {
				$rootScope.parsed = true;
			}, 0);
			$scope.parsing = false;
			$scope.debug.parseJSON = new Date().getTime() - start;
		}
	};

	factory.parseLine = function(line, $scope, isLocal) {
		var context = (isLocal) ? $scope.local : $scope.cloud;
		switch(line.Type) {
		case 'totals': {
			context.totals = line.totals;
			break;
		}
		case 'artist' : {
			if (line.Naam) {
				var firstLetter = factory.getFirstLetter(line.Naam), artistName = factory.stripThe(line.Naam);
				var isVarious = (factory.stripThe(line.AlbumArtiest) !== artistName) ? true : false;
				// add letter

				if (!context.letters[firstLetter]) {
					var letter = {
						letter : firstLetter,
						artists : [],
						isActive : false,
						isVisible : true
					};
					context.letters[letter.letter] = letter;
				}
				// add various
				if (isVarious && !context.letters['*']) {
					var letter = {
						letter : '*',
						artists : [],
						isActive : false,
						isVisible : true
					};
					context.letters[letter.letter] = letter;
				}
				// add artist
				if (!context.artists[artistName]) {
					var artist = {
						name : line.Naam,
						albumArtist : line.AlbumArtist,
						sortName : artistName,
						albums : [],
						url : 'http://ws.audioscrobbler.com/2.0/',
						data : {
							method : 'artist.getinfo',
							api_key : '956c1818ded606576d6941de5ff793a5',
							artist : line.Naam,
							format : 'json',
							autoCorrect : true
						},
						isVisible : true,
						isVarious: isVarious,
						artistURL : function() {
							return "letter/" + firstLetter + "/artist/" + artistName.toLowerCase();
						},
						raw : {
							name : line.Naam
						}
					};
					if (isVarious) {
						var variousArtist = {
							name : line.AlbumArtiest,
							albums : [],
							isVisible : true,
							artistURL : function() {
								return "letter/*/artist/" + line.AlbumArtiest.toLowerCase();
							}
						};
						context.letters["*"].artists.push(variousArtist);
						context.artists[line.AlbumArtiest] = variousArtist;
					}
					context.artists[artistName] = artist;
					context.letters[firstLetter].artists.push(artist);
					artist.letterNode = context.letters[firstLetter];
				}
			}
			break;
		}
		case 'album': {
			if (line.Album && line.Artiest) {
				var firstLetter = factory.getFirstLetter(line.Artiest), artistName = factory.stripThe(line.Artiest);
				var isVarious = (factory.stripThe(line.AlbumArtiest) !== artistName) ? true : false;

				// add album
				if (!context.albums[artistName + "-" + line.Album.toLowerCase()]) {
					var album = {
						album : $.trim(line.Album),
						year : (line.Jaar !== 'null') ? line.Jaar : null,
						artist : artistName,
						tracks : [],
						url : 'http://ws.audioscrobbler.com/2.0/',
						data : {
							method : 'album.getinfo',
							api_key : '956c1818ded606576d6941de5ff793a5',
							artist : line.Artiest,
							album : $.trim(line.Album),
							format : 'json',
							autoCorrect : true
						},
						isVisible : true,
						albumURL : function() {
							return "letter/" + firstLetter + "/artist/" + artistName.toLowerCase() + "/album/" + $.trim(line.Album);
						},
						raw : {
							artist : line.Artiest,
							album : line.Album
						}
					};
					context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())] = album;
					context.artists[artistName].albums.push(album);
					context.year[album.year] = context.year[album.year] || [];
					context.year[album.year].push(album);
					album.artistNode = context.artists[artistName];
				}
				if (isVarious && !context.albums["*-" + line.Album.toLowerCase()]) {
					var variousAlbum = {
						album: $.trim(line.Album),
						year : (line.Jaar !== 'null') ? line.Jaar : null,
						artist : line.AlbumArtiest,
						tracks : [],
						url : 'http://ws.audioscrobbler.com/2.0/',
						data : {
							method : 'album.getinfo',
							api_key : '956c1818ded606576d6941de5ff793a5',
							artist : line.Artiest,
							album : $.trim(line.Album),
							format : 'json',
							autoCorrect : true
						},
						isVisible : true,
						albumURL : function() {
							return "letter/*/artist/" + line.AlbumArtiest.toLowerCase() + "/album/" + $.trim(line.Album);
						},
						raw : {
							artist : line.Artiest,
							album : line.Album
						}
					};
					context.albums["*-" + $.trim(line.Album.toLowerCase())] = album;
					context.artists[line.AlbumArtiest].albums.push(album);
					// album.artistNode = context.artists[artistName];
				}
			}
			break;
		}
		case 'track': {
			var firstLetter = factory.getFirstLetter(line.Artiest), artistName = factory.stripThe(line.Artiest);
			if (!context.tracks[artistName + "-" + $.trim(line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()]) {
				if (context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())]) {
					// part of an album
					var track = {
						id : line.id,
						file : line.Naam,
						artist : line.Artiest,
						artistID : artistName,
						album : $.trim(line.Album),
						time : line.Duur,
						title : line.Titel,
						number : Number(line.Track || ''),
						path : line.Pad,
						disc : Number(line.Disk),
						isPlaying : false,
						filename : function() {
							var name = line.path.split('/');
							return name[name.length - 1];
						},
						seconds : line.seconds,
						raw : {
							artist : line.Artiest,
							album : line.Album,
							title : line.Titel
						}
					};
					if (isLocal) {
						track.localPath = line.Pad;
					}
					context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())].tracks.push(track);
					track.albumNode = context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())];
					context.tracks[artistName + "-" + $.trim(line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()] = track;
					context.tracks[line.id] = track;
				}
			}
			break;
		}
		}
	};
	factory.getFirstLetter = function(name) {
		if (name) {
			name = factory.stripThe(name);
			var specialChars = [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'], firstLetter = name.charAt(0);
			if ($.inArray(firstLetter, specialChars) > -1) {
				firstLetter = '1';
			}
			return "" + firstLetter;
		}
	};
	factory.stripThe = function(name) {
		if (name) {
			name = $.trim(name.toUpperCase());
			name = (name.indexOf('THE ') === 0) ? name.substring(4) : name;
			return name;
		}
	};

	return factory;
}]); 