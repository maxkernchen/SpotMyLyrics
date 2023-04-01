import React from 'react';
import './songlyrics.css';
import { CurrentUserContext } from '../CurrentUserContextAndCookies';
import {config} from "../config.js";
const url = require('url');

export default class SongLyrics extends React.Component {
  constructor() {
    super()
    this.state = {
      fullSongLyrics: {}
    };
  }
  // get lyrics for this song url and the current user. 
  async getLyricsForUrlRequest(url){
    if(url && url.trim().length){
      const payload = JSON.stringify({songurl: url, username: this.context?.userid});
      return fetch(config.endpointGetLyrics, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json());
    };
  }
  // get lyrics from the passed in url and then store them in the state
  async getLyricsFromUrl(url){
    let results = await this.getLyricsForUrlRequest(url);
    //console.log(results);
    this.setState({
      fullSongLyrics: results
    })

  }
  
  render() { 
    // display lyrics on the page either from the state or fetch them again from DB
    let lyricPayload = url.parse(window.location.href,true).query;
    let lyricsExist = this.state.fullSongLyrics?.results;

    if(!lyricsExist){
      this.getLyricsFromUrl(lyricPayload.url);
    }
    return(
       <>
       <br/>
        <img className="album-art-lyrics" src={this.state.fullSongLyrics.results?.albumarturl}></img>
        <br/>
        <h2 className="lyrics">
          <a href={lyricPayload.url} className="song-spotify-link">
            {this.state.fullSongLyrics.results?.artistname} - {this.state.fullSongLyrics.results?.songname}
          </a> 
        </h2>
        <br/>
        <p className="lyrics"> {this.state.fullSongLyrics.results?.fulllyrics}</p>
      </>
        );
    }
}
// context that's shared amongst pages
SongLyrics.contextType = CurrentUserContext;
