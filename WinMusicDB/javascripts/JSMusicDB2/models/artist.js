var Artist = function (line, artistName, firstLetter, fromAlbum) {
	this.name = line.AlbumArtiest || line.Naam;
	if (fromAlbum) {
		this.name = line.Artiest;
	}
	this.albumArtist = line.AlbumArtiest;
	this.sortName = artistName;
	this.albums = [];
	this.isVisible = true;
	this.isVarious = false;
	this.artistURL = function () {
		return "letter/" + firstLetter + "/artist/" + artistName.toLowerCase();
	};
	this.raw = {
		name: line.Naam
	};
};