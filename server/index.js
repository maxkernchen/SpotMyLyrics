import express from "express";
import cors from "cors";
import path from "express";
import mysql from "mysql2";
import {createDBPool, callEmailExists, callGetUserIdFromEmail, callGetLyricsForUser, 
  callGetUserPlaylists, callGetLyrics} from "./src/database.js";
import { scheduleLyricTask } from "./src/worker/lyricFindWorker.js";
import { initalizeSpotifyApi } from "./src/api/spotifyApiCaller.js";
import { verifyUserToken } from "./src/auth.js";




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
          userid: 'invalid token'
         }); 
      }
    }
    else{
      res.send({
        userid: 'invalid email'
       }); 
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


app.get('/setcookie', (req, res) => {
  res.cookie(`Cookie token name`,`encrypted cookie string Value`,{
      maxAge: 60*60*24,
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
  });
  res.send('Cookie have been saved successfully');
});
  

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});









