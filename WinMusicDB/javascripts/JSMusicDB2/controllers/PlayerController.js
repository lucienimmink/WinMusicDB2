jsmusicdb.controller('PlayerController', ['$scope', '$rootScope', '$log', 'RestService', '$timeout', '$location', '$interval',
function($scope, $rootScope, $log, RestService, $timeout, $location, $interval) {
	'use strict';

	// set up audiotags
	var audiotags = [$("#player1").get(0), $("#player2").get(0)];
	// default player
	var audiotag = audiotags[0];

	// other player management
	var otherPlayerIdentifier = 1;

	var canUsePrebuffer = true;

	var busyScrobbling = false;

	var playedTrackArt = null;

	var tray = null;

	$scope.isPlaying = "ios-play";
	$scope.isRandom = "shuffle";
	$scope.isMuted = "volume-high";
	$rootScope.inPartyMode = false;
	$scope.prebufferPath = '';

	$scope.volume = 100;

	$scope.$watch(function() {
		return $scope.volume;
	}, function(n, o) {
		if ($scope.ytplayer && $scope.ytplayer.setVolume) {
			$scope.ytplayer.setVolume(n);
		}
		angular.forEach(audiotags, function(value) {
			value.volume = n / 100;
		});
		if (n < 25) {
			$scope.volumeIcon = "mute";
		} else if (n < 50) {
			$scope.volumeIcon = "low";
		} else if (n < 75) {
			$scope.volumeIcon = "medium";
		} else {
			$scope.volumeIcon = "high";
		}
	});

	$scope.hasLastFM = localStorage.getItem("key");

	/*
	 * Add native media shortcuts
	 */

	var gui = require('nw.gui');

	var playPause = new gui.Shortcut({
		key : 'MediaPlayPause',
		active : function() {
			$scope.playpause();
		},
		failed : function() {
			// nothing here
		}
	});

	var stop = new gui.Shortcut({
		key : 'MediaStop',
		active : function() {
			$scope.stop();
		},
		failed : function() {
			// nothing here
		}
	});

	var prevTrack = new gui.Shortcut({
		key : 'MediaPrevTrack',
		active : function() {
			$scope.prev();
		},
		failed : function() {
			// nothing here
		}
	});

	var nextTrack = new gui.Shortcut({
		key : 'MediaNextTrack',
		active : function() {
			$scope.next();
		},
		failed : function() {
			// nothing here
		}
	});

	gui.App.registerGlobalHotKey(playPause);
	gui.App.registerGlobalHotKey(stop);
	gui.App.registerGlobalHotKey(prevTrack);
	gui.App.registerGlobalHotKey(nextTrack);

	// private functions
	var scrobble = function() {
		if (localStorage.getItem("key") && !busyScrobbling) {
			busyScrobbling = true;
			var now = new Date(), ts = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + now.getTimezoneOffset(), now.getSeconds()) / 1000, url = 'http://ws.audioscrobbler.com/2.0/', data = {
				method : 'track.scrobble',
				api_key : '956c1818ded606576d6941de5ff793a5',
				artist : $scope.playing.track.artist,
				album : $scope.playing.track.album,
				track : $scope.playing.track.title,
				timestamp : ts,
				sk : localStorage.getItem("key"),
				api_sig : lastfm.signscrobble($scope.playing.track.artist, $scope.playing.track.album, $scope.playing.track.title, ts)
			};
			$.post(url, data, function() {
				busyScrobbling = false;
				$scope.$emit("refresh.recent");
			});
			$scope.scrobbeld = true;
		}
	};

	var scrobbleNowPlaying = function() {
		if (localStorage.getItem("key") && !busyScrobbling) {
			busyScrobbling = true;
			var url = 'http://ws.audioscrobbler.com/2.0/', data = {
				method : 'track.updateNowPlaying',
				api_key : '956c1818ded606576d6941de5ff793a5',
				artist : $scope.playing.track.artist,
				album : $scope.playing.track.album,
				track : $scope.playing.track.title,
				sk : localStorage.getItem("key"),
				api_sig : lastfm.signplayinglove($scope.playing.track.artist, $scope.playing.track.album, $scope.playing.track.title, 'track.updateNowPlaying')
			};
			$.post(url, data, function() {
				busyScrobbling = false;
			});
		}
	};

	var toggleLoved = function() {
		if (localStorage.getItem("key") && !busyScrobbling) {
			busyScrobbling = true;
			var url = 'http://ws.audioscrobbler.com/2.0/', data = {};
			if ($scope.playing.track.isLoved) {
				data = {
					method : 'track.unlove',
					api_key : '956c1818ded606576d6941de5ff793a5',
					artist : $scope.playing.track.artist,
					track : $scope.playing.track.title,
					sk : localStorage.getItem("key"),
					api_sig : lastfm.signplayinglove($scope.playing.track.artist, null, $scope.playing.track.title, 'track.unlove')
				};
			} else {
				data = {
					method : 'track.love',
					api_key : '956c1818ded606576d6941de5ff793a5',
					artist : $scope.playing.track.artist,
					track : $scope.playing.track.title,
					sk : localStorage.getItem("key"),
					api_sig : lastfm.signplayinglove($scope.playing.track.artist, null, $scope.playing.track.title, 'track.love')
				};
			}
			$.post(url, data, function() {
				busyScrobbling = false;
				$scope.playing.track.isLoved = !$scope.playing.track.isLoved;
			});
		}
	};

	$scope.$on('play.track', function(e, track, playlist) {
		if (playlist) {
			$scope.playingList = playlist;
			$rootScope.playingList = playlist;
		} else {
			$scope.playingList = null;
		}
		$scope.prebufferdTrack = null;
		$scope.play(track);
	});

	$scope.toggle = function(toggleType) {
		if (toggleType === 'partyMode') {
			$rootScope.inPartyMode = !$rootScope.inPartyMode;
			// trigger resize albumart
			if ($(".desktop").length === 1) {
				setTimeout(function() {
					$(".imageWrapper").width($(".inPartyMode").height());
				}, 200);
			} else {
				$(".imageWrapper").width('');
			}
		}
		if (toggleType == 'isPlaying') {
			$scope.playpause();
		}
		if (toggleType === 'isLoved') {
			toggleLoved();
		}
	};

	$scope.minimizePlayer = function () {
		$("footer").addClass("minimized");
	};
	$scope.releasePlayer = function () {
		$("footer").removeClass("minimized");
	};

	$scope.inVideoMode = false;
	$scope.toggleVideo = function() {
		if (!$scope.inVideoMode) {
			// get this video
			$scope.pause();
			// always pause the current song when we switch
			RestService.Music.getYouTube($scope.playing.track, function(json) {
				if (json && json.items) {
					var ytid = json.items[0].id.videoId;
					$scope.setVideo(ytid);
					$("#analyser_render").hide();
					$("#yt-player, #yt-playerMask").show();

					$scope.inVideoMode = true;
					$timeout(function() {
						$scope.playpause();
					}, 1500);

				}
			});
		}
	};

	var ytstates = [];
	$scope.setVideo = function(ytid) {
		if (!$scope.ytplayer) {
			$scope.ytplayer = new YT.Player('yt-player', {
				height : '100%',
				width : '100%',
				videoId : ytid,
				playerVars : {
					iv_load_policy : 3,
					controls : 2,
					rel : 0,
					showinfo : 0
				},
				events : {
					'onReady' : function(e) {
						$("#yt-player, #yt-playerMask").addClass("ytPlay");
						e.target.playVideo();
						$scope.$apply(function() {
							$scope.len = $scope.ytplayer.getDuration();
							$scope.buffpos = $scope.ytplayer.getDuration();
						});
					},
					'onStateChange' : function(e) {
						ytstates.push(e.data);
						if (e.data === 1) {
							// playing
							$scope.ytTime = $interval(function() {
								$scope.position = $scope.ytplayer.getCurrentTime();
							}, 250);
						} else if (e.data === 0) {
							$scope.next();
							ytstates = [];
						} else {
							if (ytstates.length !== 1) {
								if (ytstates[ytstates.length - 1] === -1 && ytstates[ytstates.length - 2] !== 1) {
									// we can't play this video; exit video mode
									$scope.resetVideo();
									$timeout(function() {
										audiotag.play();
										ytstates = [];
										$scope.cantPlayYT = true;
									}, 250);
								}
							}
						}
					}
				}
			});
		} else {
			ytstates = [];
			$scope.ytplayer.loadVideoById(ytid);
			$("#yt-player, #yt-playerMask").addClass("ytPlay");
		}
	};

	$scope.resetVideo = function() {
		if ($scope.ytplayer && $scope.ytplayer.stopVideo) {
			$scope.ytplayer.stopVideo();
		}
		$scope.inVideoMode = false;
		$interval.cancel($scope.ytTime);
		$("#analyser_render").show();
		$("#yt-player, #yt-playerMask").removeClass("ytPlay");
	};

	$scope.showPlaylist = function() {
		$location.url("/playlist/current");
	};

	$scope.toggleRandom = function() {
		function shuffle(array) {
			var currentIndex = array.length, temporaryValue, randomIndex;

			// While there remain elements to shuffle...
			while (0 !== currentIndex) {

				// Pick a remaining element...
				randomIndex = Math.floor(Math.random() * currentIndex);
				currentIndex -= 1;

				// And swap it with the current element.
				temporaryValue = array[currentIndex];
				array[currentIndex] = array[randomIndex];
				array[randomIndex] = temporaryValue;
			}

			return array;
		}

		if ($scope.isRandom === 'shuffle') {
			$scope.isRandom = 'arrow-right-a';
			if (!$scope.playingList) {
				shuffle($scope.playing.track.albumNode.tracks);
			} else {
				shuffle($scope.playingList.items);
			}
		} else {
			$scope.isRandom = "shuffle";
		}
	};

	$scope.stop = function() {
		if ($scope.ytplayer && $scope.ytplayer.stopVideo) {
			$scope.ytplayer.stopVideo();
		}
		$scope.inVideoMode = false;
		$interval.cancel($scope.ytTime);
		$("#analyser_render").show();
		$("#yt-player, #yt-playerMask").hide();
		if ($scope.playing.track) {
			$scope.playing.track.isPlaying = false;
			$scope.playing.track.isPaused = false;
		}
		angular.forEach(audiotags, function(value) {
			value.pause();
			value.src = null;
		});
		$scope.playing = {};
		canUsePrebuffer = false;
		$rootScope.inPartyMode = false;
		trayTooltip = 'WinMusicDB2';
		if (tray) {
			tray.tooltip = 'WinMusicDB2';
		}
	};

	$scope.play = function(track) {
		$scope.resetVideo();
		$scope.scrobbeld = false;
		$scope.cantPlayYT = false;
		canUsePrebuffer = true;
		if ($scope.playing.track) {
			$scope.playing.track.isPlaying = false;
			$scope.playing.track.isPaused = false;
		}
		$scope.playing.track = track;
		$scope.playing.nextTrack = $scope.upNext();
		$scope.playing.track.isPlaying = true;
		$scope.isPlaying = 'ios-pause';
		scrobbleNowPlaying();

		setTimeout(function() {
			$(".previousAlbumArt").addClass("animated");
		}, 2000);
		if ($rootScope.user) {
			RestService.Music.getTrackInfo($scope.playing.track, $rootScope.user.lastfmuser, function(json) {
				if (json.track.userloved && json.track.userloved === "1") {
					$scope.playing.track.isLoved = true;
				} else {
					$scope.playing.track.isLoved = false;
				}
			});
		}
		if ($scope.prebufferdTrack) {
			// play track; it's already buffered
			audiotag.play();
			$scope.prebufferdTrack = null;
		} else {
			// load new track
			RestService.Music.play($scope, track, function(playerURL) {
				audiotag.src = playerURL;
				audiotag.load();
				audiotag.play();
			});
		}
		if (tray) {
			RestService.Music.getAlbumArt($scope.playing.track, function(url) {
				var myNotification = new Notify('playing: ' + $scope.playing.track.title.capitalize(), {
					body : "'" + $scope.playing.track.albumNode.album.capitalize() + "' by '" + $scope.playing.track.artist.capitalize() + "'",
					timeout : 5,
					tag : 'JSMusicDB-nowPlaying',
					icon : url
				});
				//myNotification.show();
			});
			tray.tooltip = "Playing: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();
		}
		trayTooltip = "Playing: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();

		RestService.Music.getDominantColor($rootScope, $scope.playing.track.artist + "|" + $scope.playing.track.albumNode.album, function(color) {
			if (color[0] < 30 && color[1] < 30 && color[2] < 30) {
				// this is too dark; lighten it up!
				color[0] = color[0] + 30;
				color[1] = color[1] + 30;
				color[2] = color[2] + 30;
			} else if (color[0] > 225 && color[1] > 225 && color[2] > 225) {
				// this is too light; darken plz!
				color[0] = color[0] - 30;
				color[1] = color[1] - 30;
				color[2] = color[2] - 30;
			}
			$scope.dominantColor = color;
			if ($(".fancyPlaylist").length > 0) {
				$("body header").css("background-color", "rgba(" + color[0] + "," + color[1] + "," + color[2] + ", 0.9)");
				$timeout(function() {
					$(".navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > .active > a:focus, .navbar-default .navbar-nav > .active > a:hover").css("background-color", "rgba(" + color[0] + "," + color[1] + "," + color[2] + ", 0.5)");
				}, 10);
			}
		});
		if ($scope.preferYouTube) {
			$scope.toggleVideo();
		}

	};

	$scope.playpause = function() {
		if ($scope.isPlaying === 'ios-pause') {
			$scope.isPlaying = 'ios-play';
			$scope.playing.track.isPlaying = false;
			$scope.playing.track.isPaused = true;
			if ($scope.inVideoMode) {
				$interval.cancel($scope.ytTime);
				$scope.ytplayer.pauseVideo();
			} else {
				angular.forEach(audiotags, function(value) {
					value.pause();
				});
			}
			if (tray) {
				tray.tooltip = "Paused: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();
			}
			trayTooltip = "Paused: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();

		} else {
			$scope.isPlaying = 'ios-pause';
			$scope.playing.track.isPlaying = true;
			$scope.playing.track.isPaused = false;
			if ($scope.inVideoMode && $scope.ytplayer && $scope.ytplayer.playVideo) {
				$scope.ytplayer.playVideo();
			} else {
				audiotag.play();
			}
			if (tray) {
				RestService.Music.getAlbumArt($scope.playing.track, function(url) {
					var myNotification = new Notify('resuming: ' + $scope.playing.track.title.capitalize(), {
						body : "'" + $scope.playing.track.albumNode.album.capitalize() + "' by '" + $scope.playing.track.artist.capitalize() + "'",
						timeout : 5,
						tag : 'JSMusicDB-nowPlaying',
						icon : url
					});
					//myNotification.show();
				});
				tray.tooltip = "Playing: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();
			}
			trayTooltip = "Playing: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();
		}
	};

	$scope.pause = function() {
		$scope.isPlaying = 'ios-play';
		$scope.playing.track.isPlaying = false;
		$scope.playing.track.isPaused = true;
		if ($scope.inVideoMode) {
			$scope.ytplayer.pauseVideo();
		} else {
			angular.forEach(audiotags, function(value) {
				value.pause();
			});
		}
		trayTooltip = "Paused: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();
		if (tray) {
			tray.tooltip = "Paused: " + $scope.playing.track.artist.capitalize() + " - " + $scope.playing.track.title.capitalize();
		}
	};

	$scope.upNext = function() {
		if (!$scope.playingList) {
			var index = $scope.playing.track.albumNode.tracks.indexOf($scope.playing.track);
			if (index > -1 && index < $scope.playing.track.albumNode.tracks.length - 1) {
				return ($scope.playing.track.albumNode.tracks[index + 1]);
			}
		} else {
			var index = $scope.playingList.items.indexOf($scope.playing.track);
			if (index > -1 && index < $scope.playingList.items.length - 1) {
				return ($scope.playingList.items[index + 1]);
			}
		}
	};

	$scope.next = function(prebuffer) {
		if ($scope.playing.track) {
			$scope.playing.track.animate = false;
		}
		$scope.cantPlayYT = false;
		$(".previousAlbumArt").attr("src", $(".currentAlbumArt").attr("src")).removeClass('animate').removeClass('animated').removeClass('animateBack');
		if ($scope.playing.track) {
			if (!prebuffer) {
				$scope.prebufferdTrack = null;
				if (!$scope.playingList) {
					var index = $scope.playing.track.albumNode.tracks.indexOf($scope.playing.track);
					if (index > -1 && index < $scope.playing.track.albumNode.tracks.length - 1) {
						$scope.play($scope.playing.track.albumNode.tracks[index + 1]);
					} else {
						$scope.stop();
					}
				} else {
					var index = $scope.playingList.items.indexOf($scope.playing.track);
					if (index > -1 && index < $scope.playingList.items.length - 1) {
						$scope.play($scope.playingList.items[index + 1]);
					} else {
						$scope.stop();
					}
				}
			} else {
				// switch player tag
				if (otherPlayerIdentifier === 1) {
					audiotag = audiotags[1];
					otherPlayerIdentifier = 0;
				} else {
					audiotag = audiotags[0];
					otherPlayerIdentifier = 1;
				}
				//$log.info('prestart', $scope.prebufferdTrack);
				if ($scope.prebufferdTrack) {
					$scope.play($scope.prebufferdTrack);
				} else {
					// next track is not prebuffered; prob. the currect track is a very small one or the prebuffer is too strong; load the next track without prebuffering
					$scope.prebufferdTrack = null;
					if (!$scope.playingList) {
						var index = $scope.playing.track.albumNode.tracks.indexOf($scope.playing.track);
						if (index > -1 && index < $scope.playing.track.albumNode.tracks.length - 1) {
							$scope.play($scope.playing.track.albumNode.tracks[index + 1]);
						} else {
							$scope.stop();
						}
					} else {
						var index = $scope.playingList.items.indexOf($scope.playing.track);
						if (index > -1 && index < $scope.playingList.items.length - 1) {
							$scope.play($scope.playingList.items[index + 1]);
						} else {
							$scope.stop();
						}
					}
				}
			}
		} else {
			$scope.stop();
		}
	};

	$scope.back = function(prebuffer) {
		$scope.cantPlayYT = false;
		if ($scope.playing.track) {
			$scope.playing.track.animate = false;
		}
		$(".previousAlbumArt").attr("src", $(".currentAlbumArt").attr("src")).removeClass('animate').removeClass('animated').removeClass('animateBack').addClass('temp-back');
		$scope.prebufferdTrack = null;
		if (!$scope.playingList) {
			var index = $scope.playing.track.albumNode.tracks.indexOf($scope.playing.track);
			if (index > 0 && index < $scope.playing.track.albumNode.tracks.length) {
				if (!prebuffer) {
					$scope.play($scope.playing.track.albumNode.tracks[index - 1]);
				}
			} else {
				$scope.stop();
			}
		} else {
			var index = $scope.playingList.items.indexOf($scope.playing.track);
			if (index > 0 && index < $scope.playingList.items.length) {
				if (!prebuffer) {
					$scope.play($scope.playingList.items[index - 1]);
				}
			} else {
				$scope.stop();
			}
		}
	};

	$scope.prebuffer = function() {
		var doPrebuffer = null;
		if (!$scope.playingList) {
			var index = $scope.playing.track.albumNode.tracks.indexOf($scope.playing.track), track = $scope.playing.track.albumNode.tracks[index + 1];
			doPrebuffer = track;
		} else {
			var index = $scope.playingList.items.indexOf($scope.playing.track), track = $scope.playingList.items[index + 1];
			doPrebuffer = track;
		}
		if (doPrebuffer && $scope.prebufferdTrack !== doPrebuffer) {
			$scope.prebufferdTrack = doPrebuffer;
			// fill otherplayer with this content
			$timeout(function() {
				//$log.info('prebuffer', doPrebuffer);
				RestService.Music.play($scope, doPrebuffer, function(playerURL) {
					audiotags[otherPlayerIdentifier].src = playerURL;
					audiotags[otherPlayerIdentifier].load();
				});
			}, 1000);
		}
	};

	$scope.updatePosition = function($event) {
		if ($scope.len) {
			var clientX = $event.clientX, left = clientX - $($event.target).parent().offset().left, perc = (left / $($event.target).parent().width()), time = perc * $scope.len;
			if ($scope.ytplayer) {
				$interval.cancel($scope.ytTime);
				$scope.position = parseInt(time);
				$scope.ytplayer.seekTo(parseInt(time));
			} else {
				audiotag.currentTime = parseInt(time);
			}
			// canUsePrebuffer = false;
		}
	};

	$scope.pos = function() {
		var percentage = ($scope.position / $scope.len) * 100;
		return (percentage) ? percentage + '%' : '0%';
	};
	$scope.bufferpos = function() {
		var percentage = ($scope.buffpos / $scope.len) * 100;
		if ($scope.inVideoMode) {
			percentage = 100;
		}
		return (percentage) ? percentage + '%' : '0%';
	};

	angular.forEach(audiotags, function(value) {
		value.addEventListener('timeupdate', function() {
			$scope.$apply(function() {
				$scope.position = audiotag.currentTime;
				if ($scope.playing.track) {
					$scope.len = audiotag.duration;
					if (!isFinite(audiotag.duration)) {
						$scope.len = $scope.playing.track.seconds;
					}
					$scope.ratio = 1;
					// @work 0.3 seems to be ok (in firefox) for small tracks
					if (canUsePrebuffer && $scope.len - $scope.position < 0.3) {
						$scope.next(true);
					}
					if ($scope.position / $scope.len > 0.5 && !$scope.scrobbeld) {
						scrobble();
					}
				}

			});
		});
		value.addEventListener('ended', function() {
			if (!canUsePrebuffer) {
				$scope.next();
			}
		});
		value.addEventListener('progress', function() {

			$scope.$apply(function() {
				try {
					$scope.buffpos = audiotag.buffered.end(0);
					if ($scope.ratio) {
						$scope.buffpos = audiotag.buffered.end(0) * $scope.ratio;
					}
					if ($scope.len && $scope.buffpos && $scope.len - $scope.buffpos < 0.8) {
						// buffpos and len are not always 100% identical when buffering is done
						$scope.prebuffer();
					} else if (isNaN($scope.len)) {
						// if the song is really small the len is NaN in Chrome sometimes, so work around this quirck
						$scope.prebuffer();
					}
				} catch (e) {
					// console.warn(e);
				};
			});

		});
	});
	// Disable for firefox for now untill it is fixed in the release channel see https://bugzilla.mozilla.org/show_bug.cgi?id=934100
	if (/chromexxx/.test(navigator.userAgent.toLowerCase())) {

		var frameLooper = function() {

			if (!window.requestAnimationFrame) {
				if (!window.webkitRequestAnimationFrame) {

				}
				window.requestAnimationFrame = window.webkitRequestAnimationFrame;
			}
			window.requestAnimationFrame(frameLooper);

			var fbc_array = new Uint8Array(analyser.frequencyBinCount);
			// Spectrum analyser

			analyser.getByteFrequencyData(fbc_array);
			ctx.clearRect(0, 0, width, 350);
			// Clear the canvas
			if ($scope.dominantColor) {
				ctx.fillStyle = 'rgb(' + $scope.dominantColor.join() + ')';
			} else {
				ctx.fillStyle = 'rgb(96, 125, 139)';
			}
			// Color of the bars
			var bars = 150;
			for (var i = 0; i < bars; i++) {
				var bar_x = i * 3;
				var bar_width = 2;
				var bar_height = -(fbc_array[i] / 2);
				//fillRect( x, y, width, height ) // Explanation of the parameters below
				ctx.fillRect(bar_x, canvas.height, bar_width, bar_height);
			}

			// Waveform
			/*
			 analyser.getByteTimeDomainData(fbc_array);
			 ctx.clearRect(0, 0, width, height);
			 ctx.lineWidth = 2;
			 ctx.strokeStyle = 'rgb(96, 125, 139)';
			 if ($scope.dominantColor) {
			 ctx.strokeStyle = 'rgb(' + $scope.dominantColor.join() + ')';
			 }
			 ctx.beginPath();
			 var sliceWidth = width * 1.0 / analyser.fftSize;
			 var x = 0;
			 for (var i = 0; i < analyser.fftSize; i++) {
			 var v = fbc_array[i] / 128.0;
			 var y = v * height/2;
			 if (i === 0 ){
			 ctx.moveTo(x ,y);
			 } else {
			 ctx.lineTo(x,y);
			 }
			 x += sliceWidth;
			 }
			 ctx.lineTo(width, height/2);
			 ctx.stroke();
			 */
		};

		var analyser, canvas, ctx, width, audioCtx, height;

		// Taken from MDN
		try {
			audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		} catch (e) {
		};
		if (audioCtx) {
			analyser = audioCtx.createAnalyser();
			analyser.smoothingTimeConstant = 0.80;
			analyser.fftSize = 512;
			angular.forEach(audiotags, function(value) {
				var source = audioCtx.createMediaElementSource(value);
				source.connect(audioCtx.destination);
				source.connect(analyser);
			});

			canvas = document.getElementById('analyser_render');
			width = 1000;
			height = 150;
			ctx = canvas.getContext('2d');
			frameLooper();
		}
	}
}]);
