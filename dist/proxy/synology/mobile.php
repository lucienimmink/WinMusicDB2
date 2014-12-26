<?

// proxy the range header and cookie to the synology streaming script
$requestHeader = "Cookie: id=" . $_GET["sid"] . "\r\n";

function emu_getallheaders() {
	foreach($_SERVER as $h=>$v)
		if(ereg('HTTP_(.+)',$h,$hp))
		$headers[$hp[1]]=$v;
	return $headers;
}

foreach (emu_getallheaders() as $name => $value) {
	echo "$name: $value\n";
	if ($name == "Range") {
		$requestHeader = $requestHeader . "Range: " . $offset . "-\r\n";
	}
}

$opts = array('http' => array('method' => "GET", 'header' => $requestHeader));

// set a default context; for the header request to get the file size
stream_context_set_default(array('http' => array('header' => "Cookie: id=" . $_GET["sid"] . "\r\n")));

// replace certain characters in a way the streaming script can still find the file
// $path = str_replace(array(" ", "+", "&", "#"), array("%20", "%2B", "%26", "%23"), $_GET["path"]);
// TODO: set base url and port in the settings of the player.
#$url = $_GET["server"] . '/webman/3rdparty/AudioStation/webUI/audio_stream.cgi/0.mp3?action=streaming&songpath=' . $path;
$url = $_GET["server"] . '/webapi/AudioStation/stream.cgi/0.mp3?sid=' . $_GET["sid"] . '&api=SYNO.AudioStation.Stream&version=2&method=stream&id=music_' . $_GET["id"];
$headers = get_headers($url, 1);
$content_length = $headers["Content-Length"];
$context = stream_context_create($opts);
echo $content_length;


// open a handle for the response of the streaming script
$handle = fopen($url, "r", false, $context);


// add headers
foreach ($http_response_header as $h) {
	header($h);
	header('Content-type: audio/mpeg');
	header('Keep-Alive: timeout=5, max=100');
	header('Content-length: ' . $content_length);
	header('X-Pad: avoid browser bug');
	header('Cache-Control: no-cache');
}
$start_point = 0;
$end_point = $content_length - 1;

// this does stream in chrome

while (!feof($handle)) {
	$buffer = fread($handle, 4096);
	echo $buffer;
	flush();
}
fclose($handle);

?>