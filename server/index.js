import express from "express";
import cors from "cors";
import path from "express";
import mysql from "mysql2";
import mysqlPromsie from "mysql2/promise";
import firebaseLogin from "./src/auth.js";
import {createDBPool, callEmailExists, callGetUserIdFromEmail, callGetLyricsForUser, callGetUserPlaylists} from "./src/database.js";
import { scheduleLyricTask, getJobProgress } from "./src/worker/lyricFindWorker.js";
import { initalizeSpotifyApi } from "./src/api/spotifyApiCaller.js";


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

app.post('/login', async function(req, res) {
 
  // first check if the email exists in the db.
  if(await callEmailExists(pool, req.body.username)){
    let tokenResult;
    try{
    // login with email/pass into firebase
    tokenResult = await firebaseLogin(req.body.username,req.body.password);
    }
    catch{
      console.log("bad login");
    }
    if(tokenResult){
      res.send({
        token: tokenResult,
        userid: await callGetUserIdFromEmail(pool, req.body.username)
       }); 
    }
  
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



app.post("/userplaylists", async function(req, res){
  let resultsUserPlaylist = await callGetUserPlaylists(pool, req.body.username);
  res.send({results: resultsUserPlaylist});
  
});

app.post("/getjobprogress", async function(req, res){
  await getJobProgress(req.body.username, req.body.playlistid);
  
});



function progessHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);
  let test = 'test SSE!';
  const data = `data: ${JSON.stringify(test)}\n\n`;

  response.write(data);

  // TODO maybe replace with UUID
  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
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









