import Bull from 'bull';
import { getCurrentApiObj } from '../api/spotifyApiCaller.js';
import Cheerio from 'cheerio';
import got from 'got';
import { callInsertLyricsForUserPlaylist, callInsertOrUpdateSmlPlaylist } from '../database.js';


const baseMusixMatchSearchUrl = 'https://www.musixmatch.com/search/'
const baseMusixMatchUrl = 'https://www.musixmatch.com'
const baseMusixMatchLyricUrl =  'https://www.musixmatch.com/lyrics/'


export async function scheduleLyricTask(playListID, username) {
    const queueJob = new Bull('lyric-job-queue');
    const queueWorker = new Bull('lyric-worker-queue');


    const job = await queueJob.add({
        lyricJobPlayListID:  playListID,
        currentUserName: username


    });
 
    queueJob.process(async (job) => {
        lyricWork(job);
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
        let artistName = track.track.artists[0].name.trim();
        let songName = track.track.name.trim();
        let url = track.track.external_urls.spotify;
        let albumArt = track.track.album.images[0].url;
              
        console.log('fetching lyrics from web!');


        let lyrics = await findLyricsMusixMatch(artistName, songName);
        console.log('inserting lyrics into db!');

        let lyricsFound = lyrics ? 1 : 0;
        if(lyricsFound === 0){
            console.log('empty lyrics');
        }
        await callInsertLyricsForUserPlaylist(url, songName, artistName, albumArt, lyrics, lyricsFound,
            currentUser, playListID);

        job.progress((i + 1 / playListTracks.length) * 100);

        
    }
    console.log('Done!');
    
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

async function findLyricsMusixMatch(artistName, songName) {

    let searchUrl = baseMusixMatchLyricUrl + artistName.replace(/\s/g, '-') 
                    + '/' +  songName.replace(/\s/g, '-');
    let lyrics = await getLyricsFromUrl(searchUrl, artistName, 1);

    if(!lyrics){
        let songArtistStr = artistName + ' ' + songName;
        let fullURl = baseMusixMatchSearchUrl + songArtistStr.replace(/\s/g, '%20') + '/tracks';
        await new Promise(r => setTimeout(r, 5000));
        const response = await got(fullURl);
        let $ = await Cheerio.load(response.body);
        let firstSearchLink = $('h2.media-card-title').children();
        if(firstSearchLink && firstSearchLink.length > 0){
            let lyricLink = firstSearchLink[0].attribs.href;
            let fullLyricUrl = baseMusixMatchUrl + lyricLink;
            lyrics = await getLyricsFromUrl(fullLyricUrl, artistName, 3);

        }
        else{
            console.log('couldnt find song link!')
        }
    }
    return lyrics;
    
}

function removeDuplicateTracks(track, index, array) {
    return index === array.findIndex(t => (
        t.track.external_urls.spotify === track.track.external_urls.spotify));

}

async function getLyricsFromUrl(songUrl, artistName, attempts){
    let lyrics = '';
    let artistMatches = false;
    let $;
    do{
        await new Promise(r => setTimeout(r, 5000));
        let responseLyrics;
        try {
            responseLyrics = await got(songUrl);
        }
        catch(error){
            return lyrics;
        }
        $ = await Cheerio.load(responseLyrics.body);
        
        let artistNameFromPage = $('title');
        let artistNameTitle = artistNameFromPage[0].children[0].data;
        // make sure artist name matches the page we are on.
        // musixmatch seems to redirect to random pages for bot prevention
        artistMatches = artistNameTitle.toLowerCase().includes(artistName.toLowerCase());
        if(!artistMatches){
            console.log('Retrying... ' + songUrl);
        }
        attempts--;
   
    }
    while(!artistMatches && attempts >= 0)

    if(artistMatches){
        let lyricText = $('p.mxm-lyrics__content');
        if(lyricText.length === 0){
            console.log('Empty Lyrics! '  + songUrl);
        }
        for(let i = 0; i < lyricText.length; i++){
            // add space at the end of each paragraph to seperate the divs too
            lyrics += lyricText[i].children[0].children[0].data + ' ';
            
        }
    }
    else{
        console.log('No Lyrics! ' + songUrl);
    }
 
    return lyrics;

}