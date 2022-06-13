import Bull from 'bull';
import { getCurrentApiObj } from '../api/spotifyApiCaller.js';
import * as Cheerio from 'cheerio';
import got from 'got';
import { callInsertLyricsForUserPlaylist, callInsertOrUpdateSmlPlaylist } from '../database.js';
import { updatePlayListProgress } from '../../index.js';
import { Job } from 'bull';
import { config } from '../config/config.js';
import { parse } from 'superagent';
import format from 'string-format';



const baseMusixMatchSearchUrl = 'https://www.musixmatch.com/search/'
const baseMusixMatchUrl = 'https://www.musixmatch.com'
const baseMusixMatchLyricUrl =  'https://www.musixmatch.com/lyrics/'

const queueJob = new Bull('lyric-job-queue');
await queueJob.empty();
await queueJob.clean(0, 'active');
await queueJob.clean(0, 'completed');
await queueJob.clean(0, 'delayed');
await queueJob.clean(0, 'failed');
await queueJob.obliterate({ force: true })

//TODO best way to handle this?
//if we use await if another job comes through it waits until it finishes
// if we don't use it then we won't be able to track if a job is active or not.
// maybe best thing is to allow user to only create one job at a time.
// could try concurrency option. 
queueJob.process(2, async (job, done) => {
    await lyricWork(job);
    done();
})

export async function scheduleLyricTask(playListID, username) {
  
    // first confirm playlist exists then add to job queue.   
    const playlistNameApi = await findPlayListName(playListID);

    let retResponse = {};

    

    if(playlistNameApi){
        // add job in seperate method so we don't block after getting playlist name
        // make sure playlist job is not already running.
        retResponse = addLyricJob(playListID, username, playlistNameApi);
    }
    else{
        retResponse = {error: format(config.errorPlaylistDoesNotExist, playListID), playListName: playlistNameApi};
    }

    return retResponse;
}

async function addLyricJob(playListID, username, playlistNameApi){

    let currentJob = await queueJob.getJob(playListID);
    let allJobs = await queueJob.getJobs(['active']);
    let userRunningAnotherJob = false;
    for(let i = 0; i < allJobs.length; i++){
        let job = allJobs[i];
        if(job.data.currentUserName === username){
            userRunningAnotherJob = true;
            break;
        }

    }
    
    // dont add same job twice if user adds the same playlist while it's is already running.
    if(!currentJob && !userRunningAnotherJob){
        const job = await queueJob.add( {
            lyricJobPlayListID:  playListID,
            currentUserName: username,
            playlistName: playlistNameApi
        },{
            jobId: playListID,
            removeOnComplete: true
        });

        
    }
    else if (currentJob){
        return {error: format(config.errorPlayListAlreadyRunning, playlistNameApi), playListName: playlistNameApi};
    }
    else if(userRunningAnotherJob){
        return {error: config.errorUserAlreadyRunningJob, playListName: playlistNameApi};
    }


    return {playListName: playlistNameApi};

}

async function lyricWork(job) {
    const workerData = job.data;
    const playlistName = workerData.playlistName;
    console.log(workerData.lyricJobPlayListID);
    let playListTracks = await findPlayListTracks(workerData.lyricJobPlayListID);

    console.log(playlistName);
    let currentUser = workerData.currentUserName;
    let playListID = workerData.lyricJobPlayListID;
    let totalsongs = playListTracks.length;
     // dont load any duplicate songs, spotify allows playlists to have duplicate songs.
    playListTracks = playListTracks.filter(removeDuplicateTracks);
    console.log(playListTracks);


 
    await callInsertOrUpdateSmlPlaylist(playListID, playlistName, totalsongs);
    
    for(let i = 0; i < playListTracks.length; i++){
        let track = playListTracks[i];
        let artistName = track.track.artists[0].name.trim();
        let songName = track.track.name.trim();
        let url = track.track.external_urls.spotify;
        let albumArt = track.track.album.images[0].url;;
              
        console.log('fetching lyrics from web!');
        
        // TODO if song exists already in DB dont fetch from musix
        let lyrics = await findLyricsMusixMatch(artistName, songName);
        console.log('inserting lyrics into db!');

        let lyricsFound = lyrics ? 1 : 0;
        if(lyricsFound === 0){
            console.log('empty lyrics');
        }
        await callInsertLyricsForUserPlaylist(url, songName, artistName, albumArt, lyrics, lyricsFound,
            currentUser, playListID);

        let progress = ((i + 1 )/ playListTracks.length);
        updatePlayListProgress({playListID: playListID, playlistName: playlistName,
             username: currentUser, progress: progress});
        
    }
    console.log('Done!');
    // update playlist again as we now know songs with and
    await callInsertOrUpdateSmlPlaylist(playListID, playlistName, totalsongs);

    
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
            return playlistName;
          });
    
}

async function findLyricsMusixMatch(artistName, songName) {

    let searchUrl = baseMusixMatchLyricUrl + artistName.replace(/\s/g, '-') 
                    + '/' +  songName.replace(/\s/g, '-');
    // try to find lyrics with just the artist and song name
    let lyrics = await getLyricsFromUrl(searchUrl, artistName, 1);

    if(!lyrics){
        let songArtistStr = artistName + ' ' + songName;
        let fullURl = baseMusixMatchSearchUrl + songArtistStr.replace(/\s/g, '%20') + '/tracks';
        await new Promise(r => setTimeout(r, 5000));
        const response = await got(fullURl);
        let $ = await Cheerio.load(response.body);
        let firstSearchLink = $('h2.media-card-title').children();

        if(firstSearchLink && firstSearchLink.length > 0){
            let lyricLink = firstSearchLink[0].attribs.href
            let fullLyricUrl = baseMusixMatchUrl + lyricLink;
            lyrics = await getLyricsFromUrl(fullLyricUrl, artistName, 5);

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
            // set this song as instrumental 
            lyrics = config.instrumentalSongLyrics;
        }
        else{
            for(let i = 0; i < lyricText.length; i++){
                // add space at the end of each paragraph to seperate the divs too
                lyrics += lyricText[i].children[0].children[0].data + ' ';
                
            }
        }   
    }
    else{
        console.log('No Lyrics! ' + songUrl);
    }
 
    return lyrics;

}