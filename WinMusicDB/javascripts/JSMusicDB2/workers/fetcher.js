var httpRequest;
var context = {
	totals : {},
	letters : {},
	artists : {},
	albums : {},
	tracks : {},
	year : {}
};
var isLocal = false;


addEventListener('message', function(e) {
	postMessage({status: "fetching"});
	var data = e.data, url = data.url, params = data.params, interval = data.interval;

	httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = alertContents;

	setInterval(function () {
		var getUrl = url;
		httpRequest.open('GET', getUrl);
		httpRequest.send();
		postMessage({status: "fetching"});
	}, interval); // check every 5 minutes

	httpRequest.open('GET', url + new Date().getTime());
	httpRequest.send();
});

function alertContents() {
	if (httpRequest.readyState === 4) {
		if (httpRequest.status === 200) {
			postMessage({status: "fetched"});
			// alert(httpRequest.responseText);
			var json = JSON.parse(httpRequest.responseText);
			if (json.tree) {
				postMessage(json);
				// this is a precompiled tree
			} else {
				parse(json);
			}
		} else {
			alert('There was a problem with the request.');
		}
	}
}

function parse(json) {
	json.forEach(function (line) {
		switch(line.Type) {
			case 'totals': {
				parseTotals(line);
				break;
			}
			case 'artist': {
				parseArtist(line);
				break;
			}
			case 'album': {
				parseAlbum(line);
				break;
			}
			case 'track': {
				parseTrack(line);
				break;
			}
		}
	});
	postMessage(context);
}




// lineparser
var parseTotals = function(line) {
	context.totals = line.totals;
};
var parseArtist = function(line) {
	if (line.Naam) {

		if (line.AlbumArtiest && (line.Naam.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
			var collectionLetter = getFirstLetter(line.AlbumArtiest);
			if (!context.letters[collectionLetter]) {
				var letter = new Letter(collectionLetter);
				context.letters[letter.letter] = letter;
			}

		} else {
			var firstLetter = getFirstLetter(line.Naam), artistName = stripThe(line.Naam);
			if (!context.letters[firstLetter]) {
				var letter = new Letter(firstLetter);
				context.letters[letter.letter] = letter;
			}
		}
		// add artist
		if (line.AlbumArtiest && (line.Naam.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
			var collectionName = stripThe(line.AlbumArtiest);
			var collectionLetter = getFirstLetter(line.AlbumArtiest);
			// this is part of a collection; we add the collection
			if (!context.artists[collectionName]) {
				var artist = new Artist(line, collectionName, collectionLetter);
				artist.collection = true;
				context.artists[collectionName] = artist;
				context.letters[collectionLetter].artists.push(artist);
				artist.letterNode = context.letters[collectionLetter];
			}

		} else {
			var firstLetter = getFirstLetter(line.Naam), artistName = stripThe(line.Naam);
			if (!context.artists[artistName]) {
				var artist = new Artist(line, artistName, firstLetter);
				context.artists[artistName] = artist;
				context.letters[firstLetter].artists.push(artist);
				artist.letterNode = context.letters[firstLetter];
			}
		}
	}
};
var parseAlbum = function(line) {
	if (line.Album && line.Artiest) {
		var firstLetter = getFirstLetter(line.Artiest), artistName = stripThe(line.Artiest);

		// add album
		if (line.AlbumArtiest && (line.Artiest.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
			var collectionName = stripThe(line.AlbumArtiest);
			var collectionLetter = getFirstLetter(line.AlbumArtiest);

			if (!context.albums[collectionName + "-" + line.Album.toLowerCase()]) {
				var album = new Album(line, collectionName, collectionLetter);
				album.collection = true;
				context.albums[collectionName + "-" + (line.Album.toLowerCase())] = album;
				if (!context.artists[collectionName]) {
					if (!context.letters[collectionLetter]) {
						var letter = new Letter(collectionLetter);
						context.letters[letter.letter] = letter;
					}
					var artist = new Artist(line, collectionName, collectionLetter, true);
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
				context.albums[artistName + "-" + (line.Album.toLowerCase())] = album;
				if (!context.artists[artistName]) {
					if (!context.letters[firstLetter]) {
						var letter = new Letter(firstLetter);
						context.letters[letter.letter] = letter;
					}
					if (!context.artists[artistName]) {
						var artist = new Artist(line, artistName, firstLetter, true);
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
};
var parseTrack = function(line) {
	var firstLetter = getFirstLetter(line.Artiest), artistName = stripThe(line.Artiest);
	if (line.AlbumArtiest && (line.Artiest.toLowerCase() !== line.AlbumArtiest.toLowerCase())) {
		var collectionName = stripThe(line.AlbumArtiest);
		var collectionLetter = getFirstLetter(line.AlbumArtiest);

		if (!context.tracks[collectionName + "-" + (line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()]) {
			if (context.albums[collectionName + "-" + (line.Album.toLowerCase())]) {
				// part of an album
				var track = new Track(line, collectionName, isLocal);
				track.collection = true;
				context.albums[collectionName + "-" + (line.Album.toLowerCase())].tracks.push(track);
				track.albumNode = context.albums[collectionName + "-" + (line.Album.toLowerCase())];
				context.tracks[collectionName + "-" + (line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()] = track;
				context.tracks[line.id] = track;
			}
		}
	} else {
		if (!context.tracks[artistName + "-" + (line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()]) {
			if (context.albums[artistName + "-" + (line.Album.toLowerCase())]) {
				// part of an album
				var track = new Track(line, artistName, isLocal);
				context.albums[artistName + "-" + (line.Album.toLowerCase())].tracks.push(track);
				track.albumNode = context.albums[artistName + "-" + (line.Album.toLowerCase())];
				context.tracks[artistName + "-" + (line.Album.toLowerCase()) + "-" + line.Titel.toLowerCase()] = track;
				context.tracks[line.id] = track;
			}
		}
	}
};

// utils
var getFirstLetter = function(name) {
	if (name) {
		name = stripThe(name);
		var specialChars = [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'], firstLetter = name.charAt(0);
		if (specialChars.indexOf(firstLetter) !== -1) {
			firstLetter = '1';
		}
		return "" + firstLetter;
	}
};
var stripThe = function(name) {
	if (name) {
		// name = (name.toUpperCase());
		name = name.toUpperCase();
		name = (name.indexOf('THE ') === 0) ? name.substring(4) : name;
		return name;
	}
};

// models needed in parser
var Letter = function(letter) {
	this.letter = letter;
	this.artists = [];
	this.isActive = false;
	this.isVisible = true;
};
var Artist = function(line, artistName, firstLetter, fromAlbum) {
	if (!fromAlbum) {
		this.name = line.AlbumArtiest || line.Naam;
	}
	if (fromAlbum) {
		this.name = line.AlbumArtiest || line.Artiest;
	}
	this.albumArtist = line.AlbumArtiest;
	this.sortName = artistName;
	this.albums = [];
	this.isVisible = true;
	this.isVarious = false;
	this.artistURL = "letter/" + firstLetter + "/artist/" + artistName.toLowerCase();
	this.raw = {
		name : line.Naam
	};
};
var Album = function(line, artistName, firstLetter) {
	this.album = (line.Album);
	this.year = (line.Jaar !== 'null') ? line.Jaar : null;
	this.artist = artistName;
	this.tracks = [];
	this.isVisible = true;
	this.albumURL = "letter/" + firstLetter + "/artist/" + artistName.toLowerCase() + "/album/" + (line.Album);
	this.raw = {
		artist : line.Artiest,
		album : line.Album
	};
};
var Track = function(line, artistName, isLocal) {
	this.id = line.id;
	this.file = line.Naam, this.artist = line.Artiest;
	this.albumArtist = line.AlbumArtiest;
	this.artistID = artistName;
	this.album = (line.Album);
	this.time = line.Duur;
	this.title = line.Titel;
	this.number = Number(line.Track || '');
	this.path = line.Pad;
	this.disc = Number(line.Disk || '');
	this.isPlaying = false;
	this.seconds = line.seconds;

	this.raw = {
		artist : line.Artiest,
		album : line.Album,
		title : line.Titel
	};
	this.localPath = (isLocal) ? line.Pad : null;
};
