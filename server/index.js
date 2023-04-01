import express from "express";
import cors from "cors";
import mysql from "mysql2";
import sessions from "express-session"
import {createDBPool, callEmailExists, callGetUserIdFromEmailAndTotalSongs, 
  callGetLyricsForUser, 
  callGetUserPlaylists, callGetLyrics, callGetAllUserSongs, callUserExists, 
  registeruser, deletePlaylistForUser} from "./src/database.js";
import { scheduleLyricTask } from "./src/worker/lyricFindWorker.js";
import { initalizeSpotifyApi } from "./src/api/spotifyApiCaller.js";
import { verifyUserToken, deleteUser } from "./src/auth.js";
import {config} from "./src/config/config.js";

const app = express();
const PORT = process.env.PORT || 3001;
const pool = createDBPool(mysql);

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.urlencoded());
app.use(express.json());

app.use(sessions({
    secret: config.sessionKey,
    saveUninitialized: false,
    cookie: { maxAge: config.twoWeeksAge, 
            secure: false,
            httpOnly: false,
            sameSite: 'lax'},
    resave: false 
}));

// create the spotify api
initalizeSpotifyApi();
// keep clients for server side events
let clients = [];

export function getConnectionPool() {
  return pool;
}
// verify user endpoint, will make sure the user is still logged in and in the database.
app.post('/verifyuser', async function(req, res) {
 
  if(await callEmailExists(pool, req.body.useremail)){
      let resultsUserIdFromEmail = await callGetUserIdFromEmailAndTotalSongs(pool, req.body.useremail);
      
      if(await verifyUserToken(req.body.usertoken)){
        res.send({
          userid: resultsUserIdFromEmail.userid,
          totalsongs: resultsUserIdFromEmail.totalsongs
        }); 
      }
      else{
        res.send({
          error: config.errorInvalidToken
         }); 
      }
    }
    else{
      res.send({
        error: config.errorInvalidEmail
       }); 
    }
});
// delete the user, this only removes them from firebase.
app.post('/deleteuser', async function(req, res) {
  if(await deleteUser(req.body.uid)){
    res.send({result:config.deletedUser});
  }
  else{
    res.send({error:config.errorDeletedUser});
  }
});

// delete the passed in playlist for the passed in user.
app.post('/deleteplaylist', async function(req, res) {
    if(await deletePlaylistForUser(req.body.playlistid, req.body.username)){
      res.send({result:config.deletedPlaylist});
    }
    else{
      res.send({error:config.errorDeletedPlaylist});
    }  
});

// search for lyrics by querying all songs the user has.
app.post("/lyricsearch", async function(req, res){
    let resultsLyricSearch = await callGetLyricsForUser(pool, req.body.username, req.body.searchterm)
    res.send({results: resultsLyricSearch});
  });
// add a new playlist for the passed in user. Then also 
// fetch all lyrics for the each song in the playlist
app.post("/addplaylist", async function(req, res){
    let resultsAddPlaylist =  await scheduleLyricTask(req.body.playlistid, req.body.username);
    res.send(resultsAddPlaylist);
    
});
// get lyrics for a specific song that a user has stored
app.post("/getlyrics", async function(req, res){
  let resultsFullLyrics = await callGetLyrics(pool, req.body.username, req.body.songurl);
  res.send({results: resultsFullLyrics});
});

// get all playlists a user has
app.post("/userplaylists", async function(req, res){
  let resultsUserPlaylist = await callGetUserPlaylists(pool, req.body.username);
  res.send({results: resultsUserPlaylist});
  
});
// get all songs that a user has
app.post("/allusersongs", async function(req, res){
  let resultsAllUserSongs = await callGetAllUserSongs(pool, req.body.username);
  res.send({results: resultsAllUserSongs});
  
});
// register a new user and insert them into the database.
// Errors may occur where the email/userid is already in use.
app.post("/register", async function(req, res){

  if(await callEmailExists(pool, req.body.email)){
    res.send({error: config.errorEmailAlreadyExists});
  }
  else if(await callUserExists(pool, req.body.username)){
    res.send({error : config.errorUserAlreadyExists});
  }
  else if(await registeruser(pool, req.body.username, req.body.email)){

    res.send({results: req.body.username + config.userCreated});
  }
  else{
    res.send({error : config.errorCreatingUser});
  }
});

// start tracking progress  when client calls playlistprogress endpoint.
app.get('/playlistprogress', progessHandler);

// progressing handler function which sends a server side event back to the client.
// This event tracks the progress of a currently processing playlist, 
//so the client can see a progress bar.
function progessHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  }); 
  
}
// write new updates back to the client with current progress
export function updatePlayListProgress(progressData){
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(progressData)}\n\n`))
}
//set the dark mode cookie for a user and store in the express session.
app.post('/setdarkmodecookie', (req, res) => {
  if(req.session.darkmode === undefined){
    req.session.darkmode = {};
  }
  req.session.darkmode[req.body.username] = req.body.darkmodebool
  res.send({results: config.darkModeCookieSaved + req.body.username});
});
// get the dark mode cookie if it already exists, if it doesnt the client will created a new one
app.post('/getdarkmodecookie', (req, res) => {
  if(!req.session.darkmode || req.session.darkmode[req.body.username] === undefined){
    res.send({error: config.errorDarkModeCookieNotFound});
  }
  else{
    res.send({results : req.session.darkmode[req.body.username]})
  }
});

// start server
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});









