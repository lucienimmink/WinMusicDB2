var Artist = function (line, artistName, firstLetter) {
	this.name = line.Naam;
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