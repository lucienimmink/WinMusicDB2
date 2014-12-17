<?
$requestHeader="";
$opts = array('http' => array('method' => "GET", 'header' => $requestHeader));

$url = $_GET["server"] . '/webman/3rdparty/VideoStation/cgi/folder_manage.cgi';
$postOptions = "action=reindex-noupdate&share=music";

$options = array('http' => array('header' => "Content-type: application/x-www-form-urlencoded\r\n" . "Cookie: id=" . $_GET["sid"] . "\r\n", 'method' => 'POST', 'content' => $postOptions), );

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
ob_start('ob_gzhandler');
header('Content-type: application/json');
echo $result;
?>