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
      let result;

      const storedProcCall = 'CALL emailexists(?, @output);select @output;';

      let conn = await pool.promise().getConnection();
      if(conn){
        const [rows, fields] = 
        await conn.connection.promise().query(storedProcCall, [email]);

        conn.connection.release();

        if(rows)
          result = rows[1][0]['@output'] == 1; 
      }
      
      return result;
  }  

  // func which calls stored proc to get the user id from an email input
  export async function callGetUserIdFromEmail(pool, email){
    let result;

    const storedProcCall = 'CALL getuseridfromemail(?, @output);select @output;';

    let conn = await pool.promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [email]);

      conn.connection.release();

      if(rows)
        result = rows[1][0]['@output']; 
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
            result.push({artistname: row.artistname, songname: row.songname, highlight: highightedlyrics, url: row.url});
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
            result.push({playlistname: row.playlistname, songswithlyrics: row.songswithlyrics, 
              songswithoutlyrics: row.songswithoutlyrics, lastsynced: row.lastsynced});
          }
        });
      }
    }
    
    return result;
  }


   export async function callInsertLyricsForUserPlaylist(url, songname, artistname, albumart, lyrics, lyricsfound, userid, playlistid){
    const storedProcCall = 'CALL insertlryicsforuserplaylist(?, ?, ?, ? ,?, ?, ?, ?);';
    let conn = await getConnectionPool().promise().getConnection();
    if(conn){
      const [rows, fields] = 
      await conn.connection.promise().query(storedProcCall, [url, songname, artistname, albumart, lyrics, lyricsfound, userid, playlistid]);
      conn.connection.release();
      }
    }

    export async function callInsertOrUpdateSmlPlaylist(playlistid, playlistname, totalsongs){
      const storedProcCall = 'CALL insertorupdatesmlplaylist(?, ?, ?);';
      let conn = await getConnectionPool().promise().getConnection();
      if(conn){
        const [rows, fields] = 
        await conn.connection.promise().query(storedProcCall, [playlistid, playlistname, totalsongs]);
        conn.connection.release();
        }
      }
    

