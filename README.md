# Introduction
WMusicman is a music management frontend programmed with Vue3, Typescript, Tailwindcss.
This program works together with [WMusicBase](https://github.com/hozorro/wmusicbase) and [WMusicPlayer](https://github.com/hozorro/wmusicplayer).

# It can
- Scan music files from music library and analyze meta data to the database.
- Analyze or extract artwork of all the artists, albums and tracks and generate artwork cache at one time.
- Upload, stage and archive music files to the music library from frontend web page.
- Edit track meta data, cover art of artist, album and track from the frontend web page.
- Automatically or manually match with MusicBrainZ data by generating an audio fingerprint.
- Backup and restore playback data(playlists, hits, favs).

# Installation
- Build:
```bash
yarn install
yarn build
```
- Copy dist to your deploy server.
- Or use github action to deploy automatically.
- Or use docker, look up [wmusic-suite](https://github.com/hozorro/wmusic-suite).