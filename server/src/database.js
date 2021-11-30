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
          var row = rowResult[key];
          if(row){
            result.push({artistname: row.artistname, songname: row.songname});
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
      await conn.connection.promise().query(storedProcCall, [url, songname, artistname, albumart, lyrics.toLowerCase(), lyricsfound, userid, playlistid]);
      conn.connection.release();
      }
    }

    export async function callInsertOrUpdateSmlPlaylist(playlistid, playlistname, totalsongs, songswithlyrics, songswithoutlyrics){
      const storedProcCall = 'CALL insertorupdatesmlplaylist(?, ?, ?, ? ,?);';
      let conn = await getConnectionPool().promise().getConnection();
      if(conn){
        const [rows, fields] = 
        await conn.connection.promise().query(storedProcCall, [playlistid, playlistname, totalsongs, songswithlyrics, songswithoutlyrics]);
        conn.connection.release();
        }
      }
    

