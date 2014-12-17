var lastfm = {
	// signing is alphabetical
    signtoken : function(api_key, method, token) {
        return hex_md5('api_key' + api_key + 'method' + method + 'token' + token + lastfm.secret);
    },
    signscrobble : function(artist, album, track, ts) {
        var method = "track.scrobble", sk = localStorage.getItem("key");
        if (album) {
        	return hex_md5('album' + album + 'api_key' + lastfm.api_key + 'artist' + artist + 'method' + method + 'sk' + sk + 'timestamp' + ts + 'track' + track + lastfm.secret);
        } else {
        	return hex_md5('api_key' + lastfm.api_key + 'artist' + artist + 'method' + method + 'sk' + sk + 'timestamp' + ts + 'track' + track + lastfm.secret);
        }

    },
    signplayinglove : function(artist, album, track, method) {
        var sk = localStorage.getItem("key");
        if (album) {
        	return hex_md5('album' + album + 'api_key' + lastfm.api_key + 'artist' + artist + 'method' + method + 'sk' + sk + 'track' + track + lastfm.secret);
        } else {
        	return hex_md5('api_key' + lastfm.api_key + 'artist' + artist + 'method' + method + 'sk' + sk + 'track' + track + lastfm.secret);
        }
    },
    api_key : '956c1818ded606576d6941de5ff793a5',
    secret : '4d183e73f7578dee78557665e9be3acc'
};

$(function() {'use strict';
    var token = document.location.search;
    if (token) {
        token = token.split("=")[1];
        var api_key = lastfm.api_key, api_sig = lastfm.signtoken(api_key, 'auth.getSession', token), url = 'http://ws.audioscrobbler.com/2.0/', data = {
            method : 'auth.getSession',
            api_key : api_key,
            token : token,
            api_sig : api_sig
        };

        $.get(url, data, function(xml) {
            var key = $("key", xml).text();
            localStorage.setItem("key", key);
            // reload
            window.location.href = 'index.html';
        }, "xml");
    }
});
