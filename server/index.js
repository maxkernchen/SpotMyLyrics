import express from "express";
import cors from "cors";
import mysql from "mysql2";
import {createDBPool, callEmailExists, callGetUserIdFromEmail, callGetLyricsForUser, 
  callGetUserPlaylists, callGetLyrics, callGetAllUserSongs, callUserExists, registeruser, deletePlaylistForUser} from "./src/database.js";
import { scheduleLyricTask } from "./src/worker/lyricFindWorker.js";
import { initalizeSpotifyApi } from "./src/api/spotifyApiCaller.js";
import { verifyUserToken, deleteUser } from "./src/auth.js";


const app = express();
const PORT = process.env.PORT || 3001;

const pool = createDBPool(mysql);

app.use(cors());
app.use(express.urlencoded());
app.use(express.json());
initalizeSpotifyApi();

let clients = [];

export function getConnectionPool() {
  return pool;
}

app.post('/verifyuser', async function(req, res) {
 
  if(await callEmailExists(pool, req.body.useremail)){
      let useridfromdb = await callGetUserIdFromEmail(pool, req.body.useremail);
      
      if(await verifyUserToken(req.body.usertoken)){
        res.send({
          userid: useridfromdb
        }); 
      }
      else{
        res.send({
          error: 'invalid token'
         }); 
      }
    }
    else{
      res.send({
        error: 'invalid email'
       }); 
    }
});

app.post('/deleteuser', async function(req, res) {
  if(await deleteUser(req.body.uid)){
    res.send({result:"deleted user"});
  }
  else{
    res.send({error:"error deleting user"});
  }

});


app.post('/deleteplaylist', async function(req, res) {
    if(await deletePlaylistForUser(req.body.playlistid, req.body.username)){
      res.send({result:"Deleted playlist"});
    }
    else{
      res.send({error:"Error deleting playlist"});
    }  
});



app.post("/lyricsearch", async function(req, res){
    let resultsLyricSearch = await callGetLyricsForUser(pool, req.body.username, req.body.searchterm)
    res.send({results: resultsLyricSearch});
  });

app.post("/addplaylist", async function(req, res){
    let resultsAddPlaylist =  await scheduleLyricTask(req.body.playlistid, req.body.username);
    res.send(resultsAddPlaylist);
    
});

app.post("/getlyrics", async function(req, res){
  let resultsFullLyrics = await callGetLyrics(pool, req.body.username, req.body.songurl);
  res.send({results: resultsFullLyrics});
});


app.post("/userplaylists", async function(req, res){
  let resultsUserPlaylist = await callGetUserPlaylists(pool, req.body.username);
  res.send({results: resultsUserPlaylist});
  
});

app.post("/allusersongs", async function(req, res){
  let resultsAllUserSongs = await callGetAllUserSongs(pool, req.body.username);
  res.send({results: resultsAllUserSongs});
  
});

app.post("/register", async function(req, res){

  if(await callEmailExists(pool, req.body.email)){
    res.send({error: "Email already exists"});
  }
  else if(await callUserExists(pool, req.body.username)){
    res.send({error : "User already exists"});
  }
  else if(await registeruser(pool, req.body.username, req.body.email)){

    res.send({results: req.body.username + " user created"});
  }
  else{
    res.send({error : "Error creating user in database"});
  }
  
});



function progessHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  // TODO maybe replace with UUID
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

export function updatePlayListProgress(progressData){
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(progressData)}\n\n`))
}

app.get('/playlistprogress', progessHandler);


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});









