var Track = function (line, artistName, isLocal) {
	this.id = line.id;
	this.file = line.Naam,
	this.artist = line.Artiest;
	this.artistID = artistName;
	this.album = $.trim(line.Album);
	this.time = line.Duur;
	this.title = line.Titel;
	this.number = Number(line.Track || '');
	this.path = line.Pad;
	this.disc = Number(line.Disk || '');
	this.isPlaying = false;
	this.filename = function () {
		var name = line.path.split('/');
		return name[name.length - 1];
	};
	this.seconds = line.seconds;

	this.raw = {
		artist : line.Artiest,
		album : line.Album,
		title: line.Titel
	};
	this.localPath = (isLocal) ? line.Pad : null;
};