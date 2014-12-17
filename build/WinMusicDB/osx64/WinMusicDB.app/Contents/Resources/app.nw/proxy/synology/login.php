<?
// TODO: set base url and port in the settings of the player.
$content = file_get_contents($_GET["server"] . '/webapi/auth.cgi?api=SYNO.API.Auth&version=2&method=login&account=' . $_GET["account"] . '&passwd=' . $_GET["passwd"] . '&otp_code=' . $_GET["opt_code"] . '&format=sid');
if ($content !== FALSE) {
	ob_start('ob_gzhandler');
	header('Content-type: application/json');
	// print the SID so the player can store it as the session token
	echo $content;
}
?>