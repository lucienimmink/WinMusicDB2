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
			angular.extend($scope.both, $scope.local);
			angular.extend($scope.both, $scope.cloud);
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

				if (line.AlbumArtiest && (line.Naam.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
					var collectionLetter = factory.getFirstLetter(line.AlbumArtiest);
					if (!context.letters[collectionLetter]) {
						var letter = new Letter(collectionLetter);
						context.letters[letter.letter] = letter;
					}

				} else {
					if (!context.letters[firstLetter]) {
						var letter = new Letter(firstLetter);
						context.letters[letter.letter] = letter;
					}
				}
				// add artist
				if (line.AlbumArtiest && (line.Naam.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
					var collectionName = factory.stripThe(line.AlbumArtiest);
					var collectionLetter = factory.getFirstLetter(line.AlbumArtiest);
					// this is part of a collection; we add the collection
					if (!context.artists[collectionName]) {
						var artist = new Artist(line, collectionName, collectionLetter);
						artist.collection = true;
						context.artists[collectionName] = artist;
						context.letters[collectionLetter].artists.push(artist);
						artist.letterNode = context.letters[collectionLetter];
					}

				} else {
					if (!context.artists[artistName]) {
						var artist = new Artist(line, artistName, firstLetter);
						context.artists[artistName] = artist;
						context.letters[firstLetter].artists.push(artist);
						artist.letterNode = context.letters[firstLetter];
					}
				}
			}
			break;
		}
		case 'album': {
			if (line.Album && line.Artiest) {
				var firstLetter = factory.getFirstLetter(line.Artiest), artistName = factory.stripThe(line.Artiest);

				// add album
				if (line.AlbumArtiest && (line.Naam.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
					var collectionName = factory.stripThe(line.AlbumArtiest);
					var collectionLetter = factory.getFirstLetter(line.AlbumArtiest);

					if (!context.albums[collectionName + "-" + line.Album.toLowerCase()]) {
						var album = new Album(line, collectionName, collectionLetter);
						album.collection = true;
						context.albums[collectionName + "-" + $.trim(line.Album.toLowerCase())] = album;
						if (!context.artists[collectionName]) {
							if (!context.letters[collectionLetter]) {
								var letter = new Letter(collectionLetter);
								context.letters[letter.letter] = letter;
							}
							var artist = new Artist(line, collectionName, collectionLetter);
							artist.collection = true;
							context.artists[collectionName] = artist;
							context.letters[collectionLetter].artists.push(artist);
							artist.letterNode = context.letters[collectionLetter];
						}
						context.artists[collectionName].albums.push(album);
						context.year[album.year] = context.year[album.year] || [];
						context.year[album.year].push(album);
						album.artistNode = context.artists[collectionName];
					}

				} else {
					if (!context.albums[artistName + "-" + line.Album.toLowerCase()]) {
						var album = new Album(line, artistName, firstLetter);
						context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())] = album;
						if (!context.artists[artistName]) {
							if (!context.letters[firstLetter]) {
								var letter = new Letter(firstLetter);
								context.letters[letter.letter] = letter;
							}
							if (!context.artists[artistName]) {
								var artist = new Artist(line, artistName, firstLetter);
								context.artists[artistName] = artist;
								context.letters[firstLetter].artists.push(artist);
								artist.letterNode = context.letters[firstLetter];
							}
						}
						context.artists[artistName].albums.push(album);
						context.year[album.year] = context.year[album.year] || [];
						context.year[album.year].push(album);
						album.artistNode = context.artists[artistName];
					}
				}
			}
			break;
		}
		case 'track': {
			var firstLetter = factory.getFirstLetter(line.Artiest), artistName = factory.stripThe(line.Artiest);
			if (line.AlbumArtiest && (line.Artiest.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
				var collectionName = factory.stripThe(line.AlbumArtiest);
				var collectionLetter = factory.getFirstLetter(line.AlbumArtiest);

				if (!context.tracks[collectionName + "-" + $.trim(line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()]) {
					if (context.albums[collectionName + "-" + $.trim(line.Album.toLowerCase())]) {
						// part of an album
						var track = new Track(line, collectionName, isLocal);
						track.collection = true;
						context.albums[collectionName + "-" + $.trim(line.Album.toLowerCase())].tracks.push(track);
						track.albumNode = context.albums[collectionName + "-" + $.trim(line.Album.toLowerCase())];
						context.tracks[collectionName + "-" + $.trim(line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()] = track;
						context.tracks[line.id] = track;
					}
				}
			} else {
				if (!context.tracks[artistName + "-" + $.trim(line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()]) {
					if (context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())]) {
						// part of an album
						var track = new Track(line, artistName, isLocal);
						context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())].tracks.push(track);
						track.albumNode = context.albums[artistName + "-" + $.trim(line.Album.toLowerCase())];
						context.tracks[artistName + "-" + $.trim(line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()] = track;
						context.tracks[line.id] = track;
					}
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
