<?

// proxy the range header and cookie to the synology streaming script
$requestHeader = "COOKIE: id=" . $_GET["sid"] . "\r\n";

function emu_getallheaders() {
	foreach($_SERVER as $h=>$v)
		if(ereg('HTTP_(.+)',$h,$hp))
		$headers[$hp[1]]=$v;
	return $headers;
}

foreach (emu_getallheaders() as $name => $value) {
	if ($name == "Range") {
		$requestHeader = $requestHeader . "Range: " . $offset . "-\r\n";
	} else if ($name !== "COOKIE"){
		$requestHeader = $requestHeader . $name . ": " . $value . "\r\n";
	}
}

$opts = array('http' => array('method' => "GET", 'header' => $requestHeader));

// print_r($opts);


// set a default context; for the header request to get the file size
stream_context_set_default(array('http' => array('header' => "Cookie: id=" . $_GET["sid"] . "\r\n")));

// replace certain characters in a way the streaming script can still find the file
$path = str_replace(array(" ", "+", "&", "#"), array("%20", "%2B", "%26", "%23"), $_GET["path"]);
// use the transcoder
$ext = "mp3";
if (strrpos($path, ".m4a") > 0) {
	$ext = "m4a";
}

if (strrpos($path, ".ogg") > 0) {
	$ext = "ogg";
}

if (strrpos($path, ".mp4") > 0) {
	$ext = "m4a";
}

// transcode
// /webman/3rdparty/AudioStation/webUI/audio_transcode.cgi/0.mp3?sid=[sid]&songpath=[path]&type=mp3
// mp3
// /webman/3rdparty/AudioStation/webUI/audio_stream.cgi/0.mp3?sid=[sid]&action=streaming&songpath=[path]
$url = $_GET["server"] . '/webman/3rdparty/AudioStation/webUI/audio_stream.cgi/0.'.$ext.'?action=streaming&songpath=' . $path . '&sid=' . $_GET["sid"];
if ($ext != "mp3") {
	$url = $_GET["server"] . '/webman/3rdparty/AudioStation/webUI/audio_transcode.cgi/0.mp3?type=mp3&songpath=' . $path . '&sid=' . $_GET["sid"];
}

$headers = get_headers($url, 1);
$content_length = $headers["Content-Length"];
$context = stream_context_create($opts);

file_put_contents('php://stderr', print_r('opening ' . $url, TRUE));

// open a handle for the response of the streaming script
$file = fopen($url, "r", false, $context);

if (isset($_SERVER['HTTP_RANGE']) && $ext == "mp3") {// do it for any device that supports byte-ranges not only iPhone
	rangeDownload($file, $content_length, $ext);
} else {
	// header("Content-Length: " . strlen(fread($file, -1)));
	directDownload($file, $content_length, $ext);
}

function rangeDownload($file, $content_length, $ext) {

	$fp = $file;

	$size = $content_length;
	// File size
	$length = $size;
	// Content length
	$start = 0;
	// Start byte
	$end = $size - 1;
	// End byte
	// Now that we've gotten so far without errors we send the accept range header
	/* At the moment we only support single ranges.
	 * Multiple ranges requires some more work to ensure it works correctly
	 * and comply with the spesifications: http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.2
	 *
	 * Multirange support annouces itself with:
	 * header('Accept-Ranges: bytes');
	 *
	 * Multirange content must be sent with multipart/byteranges mediatype,
	 * (mediatype = mimetype)
	 * as well as a boundry header to indicate the various chunks of data.
	 */
	header("Accept-Ranges: 0-$length");
	// header('Accept-Ranges: bytes');
	// multipart/byteranges
	// http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.2
	if (isset($_SERVER['HTTP_RANGE'])) {

		$c_start = $start;
		$c_end = $end;
		// Extract the range string
		list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
		// Make sure the client hasn't sent us a multibyte range
		if (strpos($range, ',') !== false) {

			// (?) Shoud this be issued here, or should the first
			// range be used? Or should the header be ignored and
			// we output the whole content?
			header('HTTP/1.1 416 Requested Range Not Satisfiable');
			header("Content-Range: bytes $start-$end/$size");
			// (?) Echo some info to the client?
			exit ;
		}
		// If the range starts with an '-' we start from the beginning
		// If not, we forward the file pointer
		// And make sure to get the end byte if spesified
		if ($range0 == '-') {

			// The n-number of the last bytes is requested
			$c_start = $size - substr($range, 1);
		} else {

			$range = explode('-', $range);
			$c_start = $range[0];
			$c_end = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $size;
		}
		/* Check the range and make sure it's treated according to the specs.
		 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
		 */
		// End bytes can not be larger than $end.
		$c_end = ($c_end > $end) ? $end : $c_end;
		// Validate the requested range and return an error if it's not correct.
		if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {

			header('HTTP/1.1 416 Requested Range Not Satisfiable');
			header("Content-Range: bytes $start-$end/$size");
			// (?) Echo some info to the client?
			exit ;
		}
		$start = $c_start;
		$end = $c_end;
		$length = $end - $start + 1;
		// Calculate new content length
		fseek($fp, $start);
		header('HTTP/1.1 206 Partial Content');
	}
	// Notify the client the byte range we'll be outputting
	header('Content-type: audio/mpeg');
	header("Content-Range: bytes $start-$end/$size");
	header("Content-Length: $length");
	header('Content-Encoding: none');

	// Start buffered download
	$buffer = 1024 * 8;
	while (!feof($fp) && ($p = ftell($fp)) <= $end) {

		if ($p + $buffer > $end) {

			// In case we're only outputtin a chunk, make sure we don't
			// read past the length
			$buffer = $end - $p + 1;
		}
		set_time_limit(0);
		// Reset time limit for big files
		echo fread($fp, $buffer);
		flush();
		// Free up memory. Otherwise large files will trigger PHP's memory limit.
	}

	fclose($fp);

}

function directDownload($file) {
	header('Content-type: audio/mpeg');
	while (!feof($file)) {
		set_time_limit(0);
		echo fread($file,8192);
		flush();
	}
	fclose($file);
}
?>