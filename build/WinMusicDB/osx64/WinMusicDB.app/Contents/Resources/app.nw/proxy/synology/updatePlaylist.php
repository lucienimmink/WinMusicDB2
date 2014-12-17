<?
$requestHeader="";
$opts = array('http' => array('method' => "GET", 'header' => $requestHeader));

$url = $_GET["server"] . '/webman/3rdparty/AudioStation/webUI/audio_playlist.cgi';
$postOptions = "action=update&playlist=" . $_GET["playlist"] . "&library=shared&id_info_list=" . $_GET["trackList"] . "&start=0&limit=1000";

$options = array('http' => array('header' => "Content-type: application/x-www-form-urlencoded\r\n" . "Cookie: id=" . $_GET["sid"] . "\r\n", 'method' => 'POST', 'content' => $postOptions), );

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
// ob_start('ob_gzhandler');
header('Content-type: application/json');
echo $result;
?>