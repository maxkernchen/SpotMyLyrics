import Bull from 'bull';
import { getCurrentApiObj } from '../api/spotifyApiCaller.js';
import Cheerio from 'cheerio';
import got from 'got';
import { callInsertLyricsForUserPlaylist, callInsertOrUpdateSmlPlaylist } from '../database.js';

const baseMusixMatchSearchUrl = 'https://www.musixmatch.com/search/'
const baseMusixMatchUrl = 'https://www.musixmatch.com'


export async function scheduleLyricTask(playListID, username) {
    const queueJob = new Bull('lyric-job-queue');
    const queueWorker = new Bull('lyric-worker-queue');


    const job = await queueJob.add({
        lyricJobPlayListID:  playListID,
        currentUserName: username


    });
 
    queueJob.process(async (job) => {
        return lyricWork(job);
    })

}
async function lyricWork(job) {
    const workerData = job.data;
    console.log(workerData.lyricJobPlayListID);
    let playListTracks = await findPlayListTracks(workerData.lyricJobPlayListID);

    const playlistName = await findPlayListName(workerData.lyricJobPlayListID);
    console.log(playlistName);
    let currentUser = workerData.currentUserName;
    let playListID = workerData.lyricJobPlayListID;
    let totalsongs = playListTracks.length;
    let songswithlyrics = totalsongs;
    let songswithoutlyrics = 0;
     // dont load any duplicate songs, spotify allows playlists to have duplicate songs.
    playListTracks = playListTracks.filter(removeDuplicateTracks);
    console.log(playListTracks);


 
    await callInsertOrUpdateSmlPlaylist(playListID, playlistName, totalsongs, songswithlyrics, songswithoutlyrics);
    
    for(let i = 0; i < playListTracks.length; i++){
        let track = playListTracks[i];
        let artistname = track.track.artists[0].name;
        let songname = track.track.name;
        let url = track.track.external_urls.spotify;
        let albumart = track.track.album.images[0].url;
       
     
        let songArtistStr = track.track.artists[0].name + ' ' + track.track.name;
        console.log('fetching lyrics from web!');

        let lyrics = await findLyricsMusixMatch(songArtistStr.replace(/\s/g, '%20'));
        console.log('inserting lyrics into db!');

        let lyricsfound = lyrics ? 1 : 0;
        await callInsertLyricsForUserPlaylist(url, songname, artistname, albumart, lyrics, lyricsfound,
            currentUser, playListID);

        job.progress((i + 1 / playListTracks.length) * 100);

        
    }
    console.log('Done!');
    
    return true;
}

async function findPlayListTracks(playListID) {
    const spotifyApi = getCurrentApiObj();
    let allTracks = [];
     return spotifyApi.getPlaylistTracks(
        playListID).then(async function(data) {
            allTracks = data.body.items;
            const totalNumTracks = data.body.total;
            if(totalNumTracks > 100){
                for (let i = 1; i <= totalNumTracks / 100; i++) {
                    const moreItems = await spotifyApi.getPlaylistTracks(playListID, {offset: 100 * i});
                    allTracks = [...allTracks, ...moreItems.body.items];
                }
            }
            return allTracks;
          }, function(err) {
            console.error(err);
          });
    
}

async function findPlayListName(playListID) {
    const spotifyApi = getCurrentApiObj();
    let playlistName = '';
     return spotifyApi.getPlaylist(
        playListID).then(async function(data) {
            playlistName = data.body.name
            return playlistName;
          }, function(err) {
            console.error(err);
          });
    
}

async function findLyricsMusixMatch(songAndArtistName) {
    let lyrics = '';
    let fullURl = baseMusixMatchSearchUrl + songAndArtistName + '/tracks';
    const response = await got(fullURl);
    await new Promise(r => setTimeout(r, 3000));
    let $ = await Cheerio.load(response.body);
    let firstSearchLink = $('h2.media-card-title').children();
    if(firstSearchLink){
        let lyricLink = firstSearchLink[0].attribs.href;
        let fullLyricUrl = baseMusixMatchUrl + lyricLink;

        const responseLyrics = await got(fullLyricUrl);
        await new Promise(r => setTimeout(r, 3000));

        $ = await Cheerio.load(responseLyrics.body);
        let lyricText = $('p.mxm-lyrics__content');

        for(let i = 0; i < lyricText.length; i++){
            lyrics += lyricText[i].children[0].children[0].data;
        }
    }
    return lyrics;
    
}

function removeDuplicateTracks(track, index, array) {
    return index === array.findIndex(t => (
        t.track.external_urls.spotify === track.track.external_urls.spotify));

}