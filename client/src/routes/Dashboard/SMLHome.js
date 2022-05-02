import React from "react";
import { getCurrentUser } from '../../sessionStorage';
import debounce from 'lodash.debounce';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



export default class SMLHome extends React.Component {

  
  constructor() {
    super()
    toast.configure();

    this.state = {
      searchTerm: '',
      searchResults: [],
      playList: '',
      existingPlaylists: [],
      listening: false,
      playListProgress: [],
      toastId: ''
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
    console.log(results.playListName);
    if(!results.error){
      this.createToast(results.playListName);

      const events = new EventSource('http://localhost:3001/playlistprogress');

      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);

        console.log(parsedData);
        if(parsedData.progress && this.state.toastId){
          toast.update(this.state.toastId, {progress: parsedData.progress});
          if(parsedData.progress === 1){
            events.close();
            this.setState({toastId: ''});
          }
        }
      };

    }
    else{
      toast.error(results.error, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
        });
    }

    

  }

  createToast(playListName){
    if(!this.state.toastId){
      let toastIdCreated = toast.loading('Playlist Scheduled ' + playListName, {
        position: "bottom-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: 0,
        });

      this.setState({toastId: toastIdCreated});

      fetch('http://localhost:3001/playlistprogress')
      .then(res => res.text())
      .then(text => console.log(text));
    }

      


  }

  getExistPlayListOnClick = async (e) => {
    e.preventDefault();
    let results = await this.getExistingPlaylists();
    this.setState({
      existingPlaylists: results
    })
    
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
      return fetch('http://localhost:3001/userplaylists', {
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
          .then(data => data.json());
      }
    }

    getJobProgress(playListIDStr){
      const payload = JSON.stringify({playlistid: playListIDStr.trim(), username: getCurrentUser()});
      return fetch('http://localhost:3001/getjobprogress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json());
    }
    

  render() { 

   


    
    let searchResults = this.state.searchResults?.results;
    let playlistResults = this.state.existingPlaylists?.results;
    let foundSongsList;
    let existingPlayListList;


    if(searchResults){
      console.log(searchResults);
      foundSongsList = searchResults.map((song) => <li key={song.songname}>{song.songname} - {song.artistname} ({song.highlight})</li>);      
    }
    if(playlistResults){
        console.log(playlistResults);

        existingPlayListList = playlistResults.map((pl) => <li key={pl.playlistname}>Name: {pl.playlistname} Songs w/Lyrics: 
        {pl.songswithlyrics} Songs w/o lyrics: {pl.songswithoutlyrics} Last Synced: {pl.lastsynced} 
        <Link to="/playlistlyrics">lyrics links
        </Link>
        </li>);     
    }
    
    return(
      
    <div>
      <h1>View Playlists: </h1>
      <button onClick={this.getExistPlayListOnClick}>View Playlists</button>
      {existingPlayListList}
      <br></br>

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
