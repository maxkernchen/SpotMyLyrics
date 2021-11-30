import express from "express";
import cors from "cors";
import path from "express";
import mysql from "mysql2";
import mysqlPromsie from "mysql2/promise";
import firebaseLogin from "./src/auth.js";
import {createDBPool, callEmailExists, callGetUserIdFromEmail, callGetLyricsForUser} from "./src/database.js";
import { scheduleLyricTask } from "./src/worker/lyricFindWorker.js";
import { initalizeSpotifyApi } from "./src/api/spotifyApiCaller.js";


const app = express();
const PORT = process.env.PORT || 3001;

const pool = createDBPool(mysql);

app.use(cors());
app.use(express.urlencoded());
app.use(express.json());
initalizeSpotifyApi();



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
     scheduleLyricTask(req.body.playlistid, req.body.username);
     res.send({results: 'scheduled task!'});
     
  });
  
  

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});









