import React from 'react';
import { getCurrentUser } from '../../sessionStorage';
import debounce from 'lodash.debounce';


export default class SMLHome extends React.Component {
  constructor() {
    super()

    this.state = {
      searchTerm: '',
      searchResults: [],
      playList: ''
    };

    this.searchLyricsDebounced = debounce(this.searchLyricsDebounceCall, 500);

  }

  handleInputChangeLyricSearch = (e) => {
    e.preventDefault();
    this.setState({
      searchTerm: e.target.value
    })

    this.searchLyricsDebounced();
    
  }

 

  async searchLyricsDebounceCall(){
    let results = await this.searchLyrics(this.state.searchTerm);
    console.log(results);
    this.setState({
      searchResults: results
    })

  }

    addPlayListSubmit = async (e) => {
    e.preventDefault();
    let results = await this.addPlayList(this.state.playList);
    console.log(results.results);
    
  }


  async searchLyrics(searchTermStr){
    if(searchTermStr && searchTermStr.trim().length){
      const payload = JSON.stringify({searchterm: searchTermStr.toLowerCase().trim(), username: getCurrentUser()});
      return fetch('http://localhost:3001/lyricsearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json())
    }
  }

  async getExistingPlaylists(){
      const payload = JSON.stringify({username: getCurrentUser()});
      return fetch('http://localhost:3001/userExistingPlaylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json())
  }
  


    async addPlayList(playListIDStr){

      if(playListIDStr && playListIDStr.trim().length){
        const payload = JSON.stringify({playlistid: playListIDStr.trim(), username: getCurrentUser()});
        return fetch('http://localhost:3001/addplaylist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payload
        })
          .then(data => data.json())
      }
    }

  render() { 
    
    let results = this.state.searchResults?.results;
    let foundSongsList;

    if(results){
      console.log(results);
      foundSongsList = results.map((song) => <li key={song.songname}>{song.songname} - {song.artistname} ({song.highlight})</li>);      
    }
    
    return(
    <div>
      <h2>Add Playlist!</h2>
      <form onSubmit={this.addPlayListSubmit}> 
      <input type="text" onChange={e => this.setState({
      playList: e.target.value
      })}/>
       <button type="submit">Add Playlist</button>
      </form>
      <h2>Search Lyrics!</h2>
      <label>
            <p>Search!</p>
            <input type="text" onChange={this.handleInputChangeLyricSearch}/>
        </label>
        
        {foundSongsList}
    </div>
  );
  }
}
