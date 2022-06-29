import React from "react";
import debounce from 'lodash.debounce';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './smlhome.css';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button, Input, ListGroup, ListGroupItem} from 'reactstrap';
import { CurrentUserContext } from "../CurrentUserContext";




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
        if(parsedData.progress && this.state.toastId && parsedData.playListID === this.state.playList &&
          parsedData.username === this.context?.userid){
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


  async searchLyrics(searchTermStr){
    if(searchTermStr && searchTermStr.trim().length){
      const payload = JSON.stringify({searchterm: searchTermStr.toLowerCase().trim(), username: this.context?.userid});
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




  async addPlayList(playListIDStr){

      if(playListIDStr && playListIDStr.trim().length){
        const payload = JSON.stringify({playlistid: playListIDStr.trim(), username: this.context?.userid});
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



  render() { 

  
    
    let searchResults = this.state.searchResults?.results;
    let searchTermLen = this.state?.searchTerm.length;
    let foundSongsList;



    console.log(this.context);

    if(searchResults){
      console.log(searchResults);
      let searchLyrics = "/songlyrics?"
     
      if(searchResults.length > 0){
        
        foundSongsList = searchResults.map((song) =>  <ListGroupItem key={song.songname}>{song.songname} - {song.artistname} 
        (<mark>{song.highlight.substring(0,searchTermLen)}</mark>{song.highlight.substring(searchTermLen, song.highlight.length + 1)}) - 
        <Link to={searchLyrics + new URLSearchParams({url: song.url}).toString()}> Full lyrics</Link>
        </ListGroupItem>);
      }
      else{
        foundSongsList = <ListGroupItem key="no results">No results</ListGroupItem>;
      }
    }
    
    return(
      <>
    <div className="home_center">
   
      <h2>Add Playlist!</h2>
      <form onSubmit={this.addPlayListSubmit}> 
        <input type="text" onChange={e => this.setState({
        playList: e.target.value
        })}/>
        <Button color="success" type="submit">Add Playlist</Button>
      </form>
      <h2>Search Lyrics!</h2>
      <label>
            <p>Search!</p>
            <input type="text" onChange={this.handleInputChangeLyricSearch}/>
        </label>
      </div>
      <div>
        <ListGroup flush className="lyric_list">
        {foundSongsList}
        </ListGroup>
        </div>
    </>
    
  );
  }
}

SMLHome.contextType = CurrentUserContext;
