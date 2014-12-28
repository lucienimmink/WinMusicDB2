#!/usr/bin/env python
# -*- coding: utf8 -*-
""" This program is made possible by the awesome python knowledge of my darling Ivana <3 for ever """

import os, fnmatch, json, sys, codecs, time, eyed3, argparse, logging

parser = argparse.ArgumentParser(description='Scans a given directory for MP3\'s and places the output file in an optional directory');
parser.add_argument('scanpath', metavar='scanpath', help='directory to scan')
parser.add_argument('--destpath', metavar='destination path', help='directory to place the output json in')
args = parser.parse_args()

rootpath = args.scanpath
destpath = args.destpath or args.scanpath

""" logging """
logging.basicConfig(filename='scanner.log', level=logging.DEBUG)

f = codecs.open(destpath + '/music.json', 'w', "utf-8")
p = codecs.open(destpath + '/progress.txt', 'w', "utf-8")

artists = dict()
albums = dict()
jsonFile = list()
increment = list()
nrScanned = 0
total_files = 0
totalArtist = 0
totalAlbums = 0
totalTime = 0
start = time.time()

class Artist:
    def __init__ (self, file):
        if (file.tag.artist):
            self.Naam = file.tag.artist.replace("\"", "")
        else:
            self.Naam = ""
        if (file.tag.album_artist):
            self.AlbumArtiest = file.tag.album_artist.replace("\"", "")
        else:
            self.AlbumArtiest = ""
        self.Type = "artist"
    
class Album:
    def __init__ (self, file):
        if (file.tag.artist):
            self.Artiest = file.tag.artist.replace("\"", "")
        else:
            self.Artiest = ""
        if (file.tag.album_artist):
            self.AlbumArtiest = file.tag.album_artist.replace("\"", "")
        else:
            self.AlbumArtiest = ""
        if (file.tag.album):
            self.Album = file.tag.album.replace("\"", "")
            self.Naam = file.tag.album.replace("\"", "")
        else:
            self.Album = ""
            self.Naam = ""
        if file.tag.best_release_date:
            self.Jaar = str(file.tag.best_release_date)
        else:
            self.Jaar = "null"
        self.Type = "album"
    
class Track:
    def __init__ (self, file, path):
        if file.tag.artist:
            self.Artiest = file.tag.artist.replace("\"", "")
        else:
            self.Artiest = ""
        if (file.tag.album_artist):
            self.AlbumArtiest = file.tag.album_artist.replace("\"", "")
        else:
            self.AlbumArtiest = ""
        if file.tag.album:
            self.Album = file.tag.album.replace("\"", "")
        else:
            self.Album = ""
        if file.tag.best_release_date:
            self.Jaar = str(file.tag.best_release_date)
        else:
            self.Jaar = "null"
        self.Track = file.tag.track_num[0]
        if file.tag.title:
            self.Titel = file.tag.title.replace("\"", "")
        else:
            self.Titel = ""
        if file.info.time_secs:
            self.Duur = ums(file.info.time_secs)
            self.seconds = file.info.time_secs
        else:
            self.Duur = ""
            self.seconds = 0
        self.Pad = _force_unicode(path, "utf-8").replace("\\", "\\\\")
        if file.tag.disc_num:
            self.Disk = file.tag.disc_num[0]
        else:
            self.Disk = ""
        self.Type = "track"
    
    def time(self):
        return self.seconds

def find_files(directory, pattern):
    for root, dirs, files in os.walk(directory):
        for basename in files:
            if fnmatch.fnmatch(basename, pattern):
                filename = os.path.join(root, basename)
                yield filename

def ums(i, ignoreZero=True):
    i = int(i)
    hours = i / 3600
    rest = i % 3600
    minutes = rest / 60
    seconds = rest % 60
    if (hours < 10):
        hours = "0" + str(hours)
    if (minutes < 10):
        minutes = "0" + str(minutes)
    if (seconds < 10):
        seconds = "0" + str(seconds)
    if (ignoreZero):
        if (hours == "00"):
            hours = ""
        else:
            hours = hours + ":"
    else:
        hours = hours + ":"
    return hours + str(minutes) + ":" + str(seconds)
def totals():
    return "{ \"totals\" : { \"artists\":" + str(totalArtist) + ", \"albums\":" + str(totalAlbums) + ", \"tracks\":" + str(nrScanned) + ", \"playingTime\":" + str(totalTime) + ", \"timestamp\":" + str(int(time.time())) + "}, \"Type\":\"totals\"}" 
def _force_unicode(bstr, encoding, fallback_encodings=None):
    # We got unicode, we give unicode
    if isinstance(bstr, unicode):
        return bstr
    
    if fallback_encodings is None:
        fallback_encodings = ['UTF-16', 'UTF-8', 'ISO-8859-1']
        
    encodings = [encoding] + fallback_encodings
    
    for enc in encodings:
        try:
            return bstr.decode(enc)
        except UnicodeDecodeError:
            pass
        
    # Finally, force the unicode
    return bstr.decode(encoding, 'ignore')

def parseFile(filename, jsonFile, showInfo=True):
    global artists
    global albums
    global totalArtist
    global totalAlbums
    global totalTime
    global nrScanned
    
    song = eyed3.load(filename)
    if song is not None:
        if song.tag is not None:
            if song.tag.artist not in artists:
                artist = Artist(song)
                jsonFile.append(json.dumps(artist.__dict__, separators=(',', ': ')))
                artists[song.tag.artist] = True
                totalArtist = totalArtist + 1
            combined = song.tag.album
            if song.tag.artist:
                if combined:
                    combined = song.tag.artist + combined
                else:
                    combined = song.tag.artist
            if combined not in albums:
                album = Album(song)
                jsonFile.append(json.dumps(album.__dict__, separators=(',', ': ')))
                albums[combined] = True
                totalAlbums = totalAlbums + 1
            track = Track(song, filename)
            totalTime = totalTime + track.seconds
            nrScanned = nrScanned + 1
            perc = int((float(float(nrScanned) / float(countfiles))) * 100)
            if (countfiles > 100 and nrScanned % int(countfiles / 100) == 0 and showInfo):
                inc = time.time()
                # print "Scanner has scanned" , str(nrScanned) , "files, time elapsed =", ums(inc-start)
                diff = inc - start
                if (perc > 0):
                    tot = (diff / perc) * 100
                    eta = tot - diff
                    sys.stdout.write("\r" + str(perc) + "% done, ETA: " + ums(eta, False))
                    sys.stdout.flush()
                    p.seek(0)
                    p.write("\r" + str(perc) + "|" + ums(eta, False));
                    p.truncate()
            jsonFile.append(json.dumps(track.__dict__, separators=(',', ': ')))


allfiles = find_files(rootpath, '*.mp3')
countfiles = sum(1 for e in allfiles)
print("Starting scan for {0} mp3 files in '{1}'".format(countfiles, rootpath))
for filename in find_files(rootpath, '*.mp3'):
    parseFile(filename, jsonFile, True)
jsonFile.append(totals())
f.write("[" + ",\n".join(jsonFile) + "]")
# str = json.dumps(jsonFile, separators=(',', ': '))
f.close()
p.close()
os.remove(destpath + '/progress.txt');
inc = time.time()
print("Done scanning, time taken: {0}".format(ums(inc - start, False)))
