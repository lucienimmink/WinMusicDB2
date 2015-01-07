var Album = function (line, artistName, firstLetter) {
	this.album = $.trim(line.Album);
	this.year = (line.Jaar !== 'null') ? line.Jaar : null;
	this.artist = artistName;
	this.tracks = [];
	this.isVisible = true;
	this.albumURL = function () {
		return "letter/" + firstLetter + "/artist/" + artistName.toLowerCase() + "/album/" + $.trim(line.Album);
	};
	this.raw = {
		artist : line.Artiest,
		album : line.Album
	};
};