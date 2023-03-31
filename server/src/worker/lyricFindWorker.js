import Bull from 'bull';
import { getCurrentApiObj } from '../api/spotifyApiCaller.js';
import * as Cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { callGetAllUserPlaylistSongs, callInsertLyricsForUserPlaylist, 
    callInsertOrUpdateSmlPlaylist, deleteSongFromPlaylist } from '../database.js';
import { updatePlayListProgress } from '../../index.js';
import { config } from '../config/config.js';
import format from 'string-format';

// constants for musix match URLs
const baseMusixMatchSearchUrl = 'https://www.musixmatch.com/search/'
const baseMusixMatchUrl = 'https://www.musixmatch.com'
const baseMusixMatchLyricUrl =  'https://www.musixmatch.com/lyrics/'

// make sure redis queue is cleared when server is restarted.
const queueJob = new Bull('lyric-job-queue');
await queueJob.empty();
await queueJob.clean(0, 'active');
await queueJob.clean(0, 'completed');
await queueJob.clean(0, 'delayed');
await queueJob.clean(0, 'failed');
await queueJob.obliterate({ force: true })


// allow two maximum jobs at once, but no user may submit more than one job at a time.
// Two users may run two jobs concurrently 
queueJob.process(2, async (job, done) => {
    await lyricWork(job);
    done();
})

// main entry method when a new playlist is added and lyrics need to be fetched.
// the playlist id and the user name will be passed in.
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
        retResponse = {error: format(config.errorPlaylistDoesNotExist, playListID), 
            playListName: playlistNameApi};
    }

    return retResponse;
}
// add a new job to the redis queue, the job's ID is the playlist ID.
async function addLyricJob(playListID, username, playlistNameApi){
    let currentJob = await queueJob.getJob(playListID);
    let allJobs = await queueJob.getJobs(['active']);
    let userRunningAnotherJob = false;
    for(let i = 0; i < allJobs.length; i++){
        let job = allJobs[i];
        // check if another job is being run for this same user.
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
    // same playlist is already being processed
    else if (currentJob){
        return {error: format(config.errorPlayListAlreadyRunning, playlistNameApi),
             playListName: playlistNameApi};
    }
    // same user is already processing another playlist
    else if(userRunningAnotherJob){
        return {error: config.errorUserAlreadyRunningJob, playListName: playlistNameApi};
    }
    // let client know that this playist is now being processed.
    return {playListName: playlistNameApi};
}
// main work function that the redis queue will execute.
// will fetch  lyrics for songs in the playlist.
// Then insert them into the database all while provide updates on progress 
// back to the client using server side events.
async function lyricWork(job) {
    const workerData = job.data;
    const playlistName = workerData.playlistName;
    console.log(workerData.lyricJobPlayListID);
    // first find all tracks for the playlist using spotify api calls.
    let playListTracks = await findPlayListTracks(workerData.lyricJobPlayListID);
    console.log(playlistName);
    let currentUser = workerData.currentUserName;
    let playListID = workerData.lyricJobPlayListID;
    // remove any podcasts in a playlist
    playListTracks = playListTracks.filter(removePodcasts);
     // dont load any duplicate songs, spotify allows playlists to have duplicate songs.
    playListTracks = playListTracks.filter(removeDuplicateTracks);
    // get the current song stored in the database.
    // this method could return an empty list if this is the first time we have loaded this playist
    // we use this list to later remove any songs  from the DB that have been removed from the spotify playlist.
    let currentSongs = await callGetAllUserPlaylistSongs(currentUser, playListID + '_' + currentUser);
    let totalsongs = playListTracks.length;
    console.log(playListTracks);
    // method which will update our playlist meta data, which defines number of songs and that the playlist is currently being
    // synced.
    await callInsertOrUpdateSmlPlaylist(playListID, playlistName, totalsongs, config.currentlySyncingPlaylist, currentUser);
    // loop through all playlists in the spotify api response and try to fetch lyrics for each one.
    for(let i = 0; i < playListTracks.length; i++){
        let track = playListTracks[i];
        let artistName = track.track.artists[0].name.trim();
        let songName = track.track.name.trim();
        let url = track.track.external_urls.spotify;
        let albumArt = track.track.album.images[0].url;
              
        //console.log('fetching lyrics from web!');
        // fetch lyrics for this song from musix match
        let lyrics = await findLyricsMusixMatch(artistName, songName);
        //console.log('inserting lyrics into db!');
        let lyricsFound = lyrics ? 1 : 0;
        // insert lyrics, even if we didn't find them 
        await callInsertLyricsForUserPlaylist(url, songName, artistName, albumArt, lyrics, lyricsFound,
            currentUser, playListID);
            
        let progress = ((i + 1 )/ playListTracks.length);
        // send an update back to client that we are progressing throught he playlists.
        updatePlayListProgress({playListID: playListID, playlistName: playlistName,
             username: currentUser, progress: progress});
    }
    // delete any songs which are currently stored but no longer in the spotify playlist.
    for(let i = 0; i < currentSongs.length; i++){
        const foundSong = playListTracks.findIndex(track => track.track.external_urls.spotify 
            === currentSongs[i].url);
        if(foundSong < 0){
            //console.log("found song not in playlist" + currentSongs[i].songname);
            await deleteSongFromPlaylist(currentUser, playListID + '_' + currentUser ,currentSongs[i].url);
        }

    }
    console.log(config.doneProcessingPlaylist + playListID);
    // update playlist again as we now know songs with and without lyrics. Also update syncing flag for UI 
    await callInsertOrUpdateSmlPlaylist(playListID, playlistName, totalsongs, config.doneSyncingPlaylist, currentUser);    
}
// get all the tracks (could be songs or podcasts) in the playlist from spotify api.
async function findPlayListTracks(playListID) {
    const spotifyApi = await getCurrentApiObj();
    let allTracks = [];
     return spotifyApi.getPlaylistTracks(
        playListID).then(async function(data) {
            allTracks = data.body.items;
            const totalNumTracks = data.body.total;
            // if there are more than 100 tracks call the api again with an offset as it
            // limits responses to 100 tracks.
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
// get the name of the playlist from the playlist id UUID using the spotify api
async function findPlayListName(playListID) {
    const spotifyApi = await getCurrentApiObj();
    let playlistName = '';
     return spotifyApi.getPlaylist(
        playListID).then(async function(data) {
            playlistName = data.body.name
            return playlistName;
          }, 
          function(err) {
            console.error(err);
            return playlistName;
          });
    
}
// find the lyrics for a specific artist and song name
async function findLyricsMusixMatch(artistName, songName) {
    let directLyricURL = baseMusixMatchLyricUrl + artistName.replace(/\s/g, '-') 
                    + '/' +  songName.replace(/\s/g, '-');
    // try to find lyrics with just the artist and song name directly from musix match
    let lyrics = await getLyricsFromUrl(directLyricURL, artistName, 1);
    // if we cannot find the lyrics directly then plug them into the musix match search page
    if(!lyrics){
        let songArtistStr = artistName + ' ' + songName;
        let fullURl = baseMusixMatchSearchUrl + songArtistStr.replace(/\s/g, '%20') + '/tracks';
        let pageBody;
        await puppeteer
        .use(StealthPlugin())
        .launch({ headless: true })
        .then(async browser => {
          const page = await browser.newPage()
          await page.goto(fullURl);
          const content = await page.content(); 
          await browser.close()
          pageBody = content;
        })
        let $ = await Cheerio.load(pageBody);
        // once we get the response from the search page pick the first option from the first results as the song
        let firstSearchLink = $('h2.media-card-title').children();
        if(firstSearchLink && firstSearchLink.length > 0){
            let lyricLink = firstSearchLink[0].attribs.href
            let fullLyricUrl = baseMusixMatchUrl + lyricLink;
            // get lyrics from the link in the search results
            lyrics = await getLyricsFromUrl(fullLyricUrl, artistName, 5);
        }
        else{
            console.log(config.couldNotFindSongFromSearch + songArtistStr);
        }
    }
    return lyrics;
    
}
// remove tracks which have the same url and are in the same playlist
function removeDuplicateTracks(track, index, array) {
    return index === array.findIndex(t => (
        t.track.external_urls.spotify === track.track.external_urls.spotify));

}
// remove podcasts from the spotify playlist
function removePodcasts(track) {
  return track.track !== null;
}
// if we have a specific musix match url go ahead and try to get all lyrics for it.
async function getLyricsFromUrl(songUrl, artistName, attempts){
    let lyrics = '';
    let artistMatches = false;
    let $;
    do{
        let responseLyrics;
        try {
            
            await puppeteer
            .use(StealthPlugin())
            .launch({ headless: true })
            .then(async browser => {
              const page = await browser.newPage()
              await page.goto(songUrl);
              const content = await page.content(); 
              await browser.close()
              responseLyrics = content;
            })
        }
        catch(error){
            return lyrics;
        }
        $ = await Cheerio.load(responseLyrics);
        
        let artistNameFromPage = $('title');
        let artistNameTitle = artistNameFromPage[0].children[0]?.data;
        if(!artistNameTitle){
            return lyrics;
        }
        // make sure artist name matches the page we are on.
        // musixmatch seems to redirect to random pages for bot prevention
        artistMatches = artistNameTitle.toLowerCase().includes(artistName.toLowerCase());
        if(!artistMatches){
            console.log(config.retryingLyricFetch + songUrl);
        }
        attempts--;
   
    }
    // retry fetching up to three times
    while(!artistMatches && attempts >= 0)

    if(artistMatches){
        let lyricText = $('p.mxm-lyrics__content');
        if(lyricText.length === 0){
            // set this song as instrumental if no lyrics found in page
            lyrics = config.instrumentalSongLyrics;
        }
        // we found lyrics store them into database
        else{
            for(let i = 0; i < lyricText.length; i++){
                // add space at the end of each paragraph to seperate the divs too
                lyrics += lyricText[i].children[0].children[0].data + ' ';
            }
        }   
    }
    else{
        console.log(config.noLyricsFoundForSong + songUrl);
    }
    return lyrics;
}