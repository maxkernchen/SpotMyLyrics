import React, {useContext} from 'react';

import './songlyrics.css';

import { CurrentUserContext } from '../CurrentUserContext';

const url = require('url');




export default class SongLyrics extends React.Component {
  constructor() {
    super()

    this.state = {
      fullSongLyrics: {},
      isOpen: false
      
    };
    this.toggle = this.toggle.bind(this);
  
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });

    
  }


  async getLyricsForUrlRequest(url){

    if(url && url.trim().length){
      const payload = JSON.stringify({songurl: url, username: this.context?.userid});
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

       <>
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

SongLyrics.contextType = CurrentUserContext;
