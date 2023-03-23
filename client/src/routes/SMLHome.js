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
  Button, Input, InputGroup, ListGroup, ListGroupItem} from 'reactstrap';
import { CurrentUserContext } from "../CurrentUserContextAndCookies";
import {config} from "../config.js";




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

 

  

  async addPlayListClick (){
   
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
        theme: this.context.darkmode ? "dark" : "light"
        });
    }

  }

  createToast(playListName){
    if(!this.state.toastId){
      let toastIdCreated = toast.loading('Processing Playlist ' + playListName, {
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
     
      if(searchResults.length > 0){
        
        foundSongsList = searchResults.map((song) =>  <ListGroupItem 
        className={this.context.darkmode ? "dark-list-results": "list-result"} key={song.songname}> 
        <img className="album-art-search" src={song.albumarturl}/>  {song.songname} - {song.artistname} 
        (<mark>{song.highlight.substring(0,searchTermLen)}</mark>{song.highlight.substring(searchTermLen, song.highlight.length + 1)}) - 
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
        <InputGroup>
          
            <Input onChange={e => this.setState({
            playList: e.target.value
            })}/>
            &#160;
            <Button outline color="success" onClick={() => this.addPlayListClick()} >Add Playlist</Button>
          
        </InputGroup>
      </div>
      
      <div className="results-center">
        <h2>Search For Lyrics</h2>
        <InputGroup>
          <Input onChange={this.handleInputChangeLyricSearch} placeholder= {"Search " + this.context?.totalsongs + " Songs"} />
        </InputGroup>
      
          <ListGroup flush>
            {foundSongsList}
          </ListGroup>
      </div>

   </>
    
  );
  }
}

SMLHome.contextType = CurrentUserContext;
