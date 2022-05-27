import React from 'react';
import { getCurrentUser } from '../../sessionStorage';
import './songlyrics.css';
const url = require('url');


export default class SongLyrics extends React.Component {
  constructor() {
    super()

    this.state = {
      fullSongLyrics: {},
    };

  }

  async getLyricsForUrlRequest(url){

    if(url && url.trim().length){
      const payload = JSON.stringify({songurl: url, username: getCurrentUser()});
      return fetch('http://localhost:3001/getlyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json());
    };
  }

  async getLyricsFromUrl(url){
    let results = await this.getLyricsForUrlRequest(url);
    console.log(results);
    this.setState({
      fullSongLyrics: results
    })

  }

  

   render() { 
    
    let lyricPayload = url.parse(window.location.href,true).query;
    let lyricsExist = this.state.fullSongLyrics?.results;

    if(!lyricsExist){
      this.getLyricsFromUrl(lyricPayload.url);
    }
   
    
    return(
        <div>
          <h2 className='lyrics'>{this.state.fullSongLyrics.results?.artistname} - {this.state.fullSongLyrics.results?.songname}</h2>
            <p className='lyrics' > {this.state.fullSongLyrics.results?.fulllyrics}</p>
        </div>
        
    
        )
    }
}
