import { getConnectionPool } from "../index.js";
import {config} from "./config/config.js";

  
export function createDBPool(mysql){

  const pool =  mysql.createPool({
      host: config.databaseHost,
      connectionLimit: config.databaseConnectionLimit,
      debug: config.databaseDebug,
      database: config.databaseName,
      user: config.databaseUser,
      password: config.databasePassword,
      multipleStatements: config.databaseMultiStatement
    });
  
    return pool;
}

// func which calls stored proc to see if the email exists.
export async function callEmailExists(pool, email){
      let existsBool = false;

      const storedProcCall = 'CALL emailexists(?, @output);select @output;';

      let conn = await pool.promise().getConnection();
      if(conn){
        const [rows, fields] = 
        await conn.connection.promise().query(storedProcCall, [email]);

        conn.connection.release();

        if(rows)
        existsBool = rows[1][0]['@output'] == 1; 
      }
      
      return existsBool;
  }  

  // func which calls stored proc to see if the user exists.
export async function callUserExists(pool, userid){
  let existsBool = false;

  const storedProcCall = 'CALL userexists(?, @output);select @output;';

  let conn = await pool.promise().getConnection();
  if(conn){
    const [rows, fields] = 
    await conn.connection.promise().query(storedProcCall, [userid]);

    conn.connection.release();

    if(rows)
      existsBool = rows[1][0]['@output'] == 1; 
  }
  
  return existsBool;
}  

  // func which calls stored proc to see if the user exists.
  export async function registeruser(pool, userid, email){
    let userinserted = false;
  
    const storedProcCall = 'CALL registeruser(?, ?, @output); select @output;';
  
    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [userid, email]);
  
      conn.connection.release();
  
      if(rows)
        userinserted = rows[1][0]['@output'] == 0; 
    }
    
    return userinserted;
  }  

  // func which calls stored proc to get the user id from an email input
  export async function callGetUserIdFromEmailAndTotalSongs(pool, email){
    let result = {}
 
    const storedProcCall = 'CALL getuseridandtotalsongs(?, @output, @output1);select @output, @output1;';

    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [email]);

      conn.connection.release();

      if(rows)
        result = {userid: rows[1][0]['@output'], totalsongs: rows[1][0]['@output1']};
    }
    
    return result;
}  
   // func to get lyrics for search term

   //TODO make sure when loading into this table that all lyrics are lowercase.
   export async function callGetLyricsForUser(pool, userid, searchterm){
    let result = []

    const storedProcCall = 'CALL getlyricsforuser(?, ?);';

    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [userid, searchterm]);

      conn.connection.release();
      // get just query results from resultset
      let rowResult = rows[0];
      if(rowResult){
        await Object.keys(rowResult).forEach(function(key) {

          // get about 25 characters of the matching term to display on the client side
          let row = rowResult[key];
          let lyrics = row.lyrics.toLowerCase();
          let searchIndex = lyrics.indexOf(searchterm);
          let endBoundSearch = searchIndex + config.maxHighlightLength > lyrics.length ? 
                              lyrics.length - searchIndex : searchIndex + config.maxHighlightLength;
          let highightedlyrics = lyrics.substring(searchIndex, endBoundSearch) + config.highLightEllipses;
          // replace new line with space so it can fit into list element on client side
          if(row){
            result.push({artistname: row.artistname, songname: row.songname, highlight: highightedlyrics, url: row.url, albumarturl: row.albumart});
          }
        });
      }
    }
    
    return result;
  }


   //TODO make sure when loading into this table that all lyrics are lowercase.
   export async function callGetLyrics(pool, userid, url){
    let result = {}

    const storedProcCall = 'CALL getlyrics(?, ?);';

    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [userid, url]);

      conn.connection.release();
      // get just query results from resultset
      let rowResult = rows[0];
      if(rowResult){
        await Object.keys(rowResult).forEach(function(key) {

          let row = rowResult[key];
         
          if(row){
            result = {artistname: row.artistname, songname: row.songname, fulllyrics: row.lyrics, albumarturl : row.albumart};
          }
        });
      }
    }
    
    return result;
  }

  export async function callGetUserPlaylists(pool, userid){
    let result = [];

    const storedProcCall = 'CALL getuserplaylist(?);';

    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [userid]);

      conn.connection.release();
      // get just query results from resultset
      let rowResult = rows[0];
      if(rowResult){
        await Object.keys(rowResult).forEach(function(key) {

          let row = rowResult[key];
          if(row){
            result.push({playlistname: row.playlistname, playlistid: row.playlistid, songswithlyrics: row.songswithlyrics, 
              songswithoutlyrics: row.songswithoutlyrics, lastsynced: row.lastsynced, currentlysyncing: row.issyncing === 1 ? true : false});
          }
        });
      }
    }
    
    return result;
  }

  export async function callGetAllUserSongs(pool, userid){
    let result = [];

    const storedProcCall = 'CALL getallusersongs(?);';

    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [userid]);

      conn.connection.release();
      // get just query results from resultset
      let rowResult = rows[0];
      if(rowResult){
        await Object.keys(rowResult).forEach(function(key) {

          let row = rowResult[key];
          if(row){
            result.push({playlistid: row.playlistid, songname: row.songname, 
              artistname: row.artistname, albumarturl: row.albumart, lyricsfound: row.lyricsfound === 1 ? true : false, url: row.url});
          }
        });
      }
    }
    
    return result;
  }


   export async function callInsertLyricsForUserPlaylist(url, songname, artistname, albumart, lyrics, lyricsfound, userid, playlistid){
    const storedProcCall = 'CALL insertlyricsforuserplaylist(?, ?, ?, ? ,?, ?, ?, ?);';
    let conn = await getConnectionPool().promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [url, songname, artistname, albumart, lyrics, lyricsfound, userid, playlistid + "_" + userid]);
      conn.connection.release();
      }
    }

    export async function callInsertOrUpdateSmlPlaylist(playlistid, playlistname, totalsongs, issyncing, userid){
      const storedProcCall = 'CALL insertorupdatesmlplaylist(?, ?, ?, ?);';
      let conn = await getConnectionPool().promise().getConnection();
      if(conn){
        const [rows, fields] = 
        await conn.connection.promise().query(storedProcCall, [playlistid + "_" + userid, playlistname, totalsongs, issyncing]);
        conn.connection.release();
        }
    }

    export async function deletePlaylistForUser(playlistid, userid){
      const storedProcCall = 'CALL deleteplaylistforuser(?, ?);';
      let playlistDeleted = false;
      let conn = await getConnectionPool().promise().getConnection();

      try{
      if(conn){
        const [rows, fields] = 
        await conn.connection.promise().query(storedProcCall, [userid, playlistid]);
        conn.connection.release();
        playlistDeleted = true;
        }
      }catch(error){
        console.log("error deleting playlist " + error);
        playlistDeleted = false;
      }

      return playlistDeleted;
    }

    

