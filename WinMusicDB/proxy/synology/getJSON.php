<?php
// Connecting, selecting database
$dbconn = pg_connect("host=localhost dbname=mediaserver user=postgres") or die('Could not connect: ' . pg_last_error());

// Performing SQL query
$query = 'SELECT id, path, artist, album, track, disc, year, title, duration FROM music';
$result = pg_query($query) or die('Query failed: ' . pg_last_error());

$artistArray = array();
$albumArray = array();

$jsonArray = array();

$artists = 0;
$albums = 0;
$tracks = 0;
$time = 0;

// artist class
class Artist {
	public $Type = "artist";
	public $Naam;

	function __construct($name) {
		$this -> Naam = $name;
	}

}

//album class
class Album {
	public $Type = "album";
	public $Artiest, $Album, $Jaar;

	function __construct($artist, $album, $year) {
		$this -> Artiest = $artist;
		$this -> Album = $album;
		$this -> Jaar = $year;
	}

}

//track class
class Track {
	public $Type = "track";
	public $id, $Artiest, $Album, $Jaar, $Track, $Titel, $Duur, $seconds, $Pad, $Disk;

	function __construct($id, $artist, $album, $year, $track, $title, $duration, $path, $disc) {
		$this -> id = $id;
		$this -> Artiest = $artist;
		$this -> Album = $album;
		$this -> Jaar = $year;
		$this -> Track = $track;
		$this -> Titel = $title;
		$this -> seconds = $duration;
		$this -> Pad = $path;
		$this -> Disk = $disc;

		$this -> Duur = gmdate("i:s", $duration);
	}

}

// totals class
class Totals {
	public $Type = "totals";
	public $totals;

	function __construct($artists, $albums, $tracks, $time) {
		$this -> totals["artists"] = $artists;
		$this -> totals["albums"] = $albums;
		$this -> totals["tracks"] = $tracks;
		$this -> totals["playingTime"] = $time;
		$this -> totals["timestamp"] = time();
	}

}

while ($line = pg_fetch_array($result, null, PGSQL_NUM)) {
	// echo implode("|", $line)."\n";
	// 217202|/volume1/music/The Feeling/Boy Cried Wolf/00 - Rescue.mp3|The Feeling|Boy Cried Wolf|3|1|2013|Rescue|216
	// id | path | artist | album | track | disc | year | title | duration
	$id = $line[0];
	$path = $line[1];
	$artist = strtolower($line[2]);
	$album = strtolower($line[3]);
	$track = $line[4];
	$disc = $line[5];
	$year = $line[6];
	$title = $line[7];
	$duration = $line[8];

	
	// create artist
	
	if (!isset($artistArray[$artist]) && $artist != '') {
		$t = new Artist($artist);
		$artistArray[$artist] = $t;
		array_push($jsonArray, $t);
		$artists = $artists + 1;
	}
    
	// create album
	if (!isset($albumArray[$artist . "-" . $album]) && $artist != '' && $album != '') {
		$t = new Album($artist, $album, $year);
		$albumArray[$artist . "-" . $album] = $t;
		array_push($jsonArray, $t);
		$albums = $albums + 1;
	}
	$t = new Track($id, $artist, $album, $year, $track, $title, $duration, $path, $disc);
	$tracks = $tracks + 1;
	$time += $duration;
	array_push($jsonArray, $t);	
}


// append totals
$totals = new Totals($artists, $albums, $tracks, $time);
array_push($jsonArray, $totals);

// print output and add some caching
ob_start('ob_gzhandler');
header('Content-type: application/json');
$now = time();
$then = gmstrftime("%a, %d %b %Y %H:%M:%S GMT", $now + 60 * 60 * 3);
header('Expires: ' . $then);
echo json_encode($jsonArray);

// Free resultset
pg_free_result($result);

// Closing connection
pg_close($dbconn);
?>