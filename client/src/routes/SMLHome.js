import React from "react";
import debounce from 'lodash.debounce';
import { Link } from 'react-router-dom';
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './smlhome.css';
import {
  Button, Input, InputGroup, ListGroup, ListGroupItem} from 'reactstrap';
import { CurrentUserContext } from "../CurrentUserContextAndCookies";
import {config} from "../config.js";
// regex to get the playlist id out of a spotify playlist url
const regexPlaylistID = "playlist\\/(.*)\\?";

export default class SMLHome extends React.Component {
  constructor() {
    super()
    toast.configure();

    this.state = {
      searchTerm: '',
      searchResults: [],
      playList: '',
      listening: false,
      playListProgress: [],
      toastId: ''
    };
    // debouce any input into the search field to load results
    this.searchLyricsDebounced = debounce(this.searchLyricsDebounceCall, 500);
  }
  // handler for any input changes to the lyric search page
  handleInputChangeLyricSearch = (e) => {
    e.preventDefault();
    this.setState({
      searchTerm: e.target.value
    })
    this.searchLyricsDebounced();
  }
  // when input is typed in the search screen we call the server 
  // and see if any lyrics match the input
  async searchLyricsDebounceCall(){
    let results = await this.searchLyrics(this.state.searchTerm);
    console.log(results);
    this.setState({
      searchResults: results
    })
  }
  // add a playist that is stored in the input field.
  async addPlayListClick (){
    let playlistString = this.state.playList;
    // get the playlist id using regex, if the whole url is passed in.
    const matches = playlistString.matchAll(regexPlaylistID);
    for (const match of matches) {
        playlistString = match[1];
        break;
    }
    // call the server to add the playlist
    this.setState({playList: playlistString});
    let results = await this.addPlayList(playlistString);
    console.log(results.playListName);
    // if no errors occured listen for the server side event for progress
    if(!results.error){
      this.createToast(results.playListName);
      const events = new EventSource(config.endpointPlaylistProgress);

      events.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);

      //  console.log(parsedData);
      // make sure the data we got back is for this playlist, if it used update the toast message
        if(parsedData.progress && this.state.toastId && parsedData.playListID === this.state.playList &&
          parsedData.username === this.context?.userid){
          toast.update(this.state.toastId, {progress: parsedData.progress});
          // close the toast and event pipe once we are done with the playlist processing.
          if(parsedData.progress === 1){
            events.close();
            this.setState({toastId: ''});
            window.location.reload();
          }
        }
      };
    }
    // there was an error trying to add the playlist.
    else{
      toast.error(results.error, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
        theme: this.context.darkmode ? "dark" : "light"
        });
    }

  }
  // create toast when we are processing a new playlist
  createToast(playListName){
    if(!this.state.toastId){
      let toastIdCreated = toast.loading(config.processingPlaylist + playListName +'\"', {
        position: "bottom-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: 0,
        theme: this.context.darkmode ? "dark" : "light"
        });

      this.setState({toastId: toastIdCreated});
      // kick off the server side event for playlist progress
      fetch(config.endpointPlaylistProgress)
      .then(res => res.text());
    }
  }

  async searchLyrics(searchTermStr){
    if(searchTermStr && searchTermStr.trim().length){
      const payload = JSON.stringify({searchterm: searchTermStr.toLowerCase().trim(), username: this.context?.userid});
      return fetch(config.endpointLyricSearch, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json())
    }
  }    // display lyrics on the page either from the state or fetch them again from DB


  async addPlayList(playListIDStr){

      if(playListIDStr && playListIDStr.trim().length){
        const payload = JSON.stringify({playlistid: playListIDStr.trim(), 
          username: this.context?.userid});
        return fetch(config.endpointAddPlaylist, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payload
        })
          .then(data => data.json());
      }
    }

  render() { 

    let searchResults = this.state.searchResults?.results;
    let searchTermLen = this.state?.searchTerm.length;
    let foundSongsList;
    if(searchResults){
      //console.log(searchResults);
      if(searchResults.length > 0){
        // if we got search results go ahead and display them in a new list group
        foundSongsList = searchResults.map((song) =>  <ListGroupItem 
        className={this.context.darkmode ? "dark-list-results": "list-result"} key={song.songname}> 
        <img className="album-art-search" src={song.albumarturl}/>  {song.songname} - {song.artistname} 
        (<mark>{song.highlight.substring(0,searchTermLen)}</mark>{song.highlight.substring(searchTermLen, 
          song.highlight.length + 1)}) - 
        <Link to={config.songlyricspathquery + new URLSearchParams({url: song.url}).toString()}> Full lyrics</Link>
        </ListGroupItem>);
      }
      else{
        foundSongsList = <ListGroupItem key="no results">No results</ListGroupItem>;
      }
    }
    
    return(
    <>
      <div className="home-center">
        <h2>Add Playlist</h2>
        <h5>Copy the Spotify Playlist URL below</h5>
        <InputGroup>
            <Input onChange={e => this.setState({
            playList: e.target.value
            })}/>
            &#160;
            <Button outline color="success" onClick={() => this.addPlayListClick()}>Add Playlist</Button>
        </InputGroup>
      </div>
      <div className="results-center">
        <h2>Search For Lyrics</h2>
        <InputGroup>
          <Input onChange={this.handleInputChangeLyricSearch} 
          placeholder= {"Search " + this.context?.totalsongs + " Songs"} />
        </InputGroup>
        <ListGroup flush>
          {foundSongsList}
        </ListGroup>
      </div>
   </>
    
  );
  }
}
// context that's shared amongst pages
SMLHome.contextType = CurrentUserContext;
