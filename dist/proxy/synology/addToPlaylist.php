<?
$requestHeader="";
$opts = array('http' => array('method' => "GET", 'header' => $requestHeader));

$url = $_GET["server"] . '/webapi/AudioStation/playlist.cgi';
$postOptions = "api=SYNO.AudioStation.Playlist&method=updatesongs&offset=-1&version=2&id=" . $_GET["playlist"] . "&songs=music_" . $_GET["trackID"];

$options = array('http' => array('header' => "Content-type: application/x-www-form-urlencoded\r\n" . "Cookie: id=" . $_GET["sid"] . "\r\n" . "X-SYNO-TOKEN:" . $_GET["sid"] . "\r\n", 'method' => 'POST', 'content' => $postOptions), );

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
ob_start('ob_gzhandler');
header('Content-type: application/json');
echo $result;
?>