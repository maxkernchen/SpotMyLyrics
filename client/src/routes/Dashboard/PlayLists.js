import React from 'react';
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
  Card,
  CardBody,
  UncontrolledCollapse,
  Button, Input, ListGroup, ListGroupItem} from 'reactstrap';
  import { CurrentUserContext } from "../../CurrentUserContext";
  import { Link } from 'react-router-dom';
  import './playlists.css'
  import update from 'immutability-helper';





export default class PlayLists extends React.Component {
  constructor() {
    super()
    
    this.state = {
      existingPlaylists: [],
      allUserSongs: [],
      collapsePlayListCard: new Map(),
      callGetPlaylists: true
    };



  }
  async getExistingPlayListsSetState() {

    let results = await this.getExistingPlaylists();
    this.setState({
      existingPlaylists: results,
    })
    let allPlaylists = this.state.existingPlaylists?.results;
    allPlaylists.forEach(pl => {
      this.state.collapsePlayListCard.set(pl.playlistid, false);
    });

  
    
  }
  async getExistingPlaylists(){
    const payload = JSON.stringify({username: this.context?.userid});
    return fetch('http://localhost:3001/userplaylists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then(data => data.json())
}

async getAllUserSongsSetState() {

  let results = await this.getAllUserSongs();
  this.setState({
    allUserSongs: results
  })
  
}
async getAllUserSongs(){
  const payload = JSON.stringify({username: this.context?.userid});
  return fetch('http://localhost:3001/allusersongs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  })
    .then(data => data.json())
}


  render() { 

   
   let playlistResults = this.state.existingPlaylists?.results;
   let allusersongsresults = this.state.allUserSongs?.results;
   let existingPlayListList;
   let searchLyrics = "/songlyrics?"
   if(this.state.callGetPlaylists){
     this.getExistingPlayListsSetState();
     this.getAllUserSongsSetState()
     this.setState({callGetPlaylists: false});
   }

   if(playlistResults && allusersongsresults){
      console.log(playlistResults);
      existingPlayListList = playlistResults.map((pl) => <Button  className="list-group-item list-group-item-action"
       key={pl.playlistname} onClick={ () =>
        this.setState({
          collapsePlayListCard: update(this.state.collapsePlayListCard, {[pl.playlistid]: {$set: 
            !this.state.collapsePlayListCard.get(pl.playlistid)}})
        })
       
       }>Name: {pl.playlistname} Songs w/Lyrics: 
      {pl.songswithlyrics} Songs w/o lyrics: {pl.songswithoutlyrics} Last Synced: {pl.lastsynced} 
      
      <Collapse isOpen={this.state.collapsePlayListCard.get(pl.playlistid)}>
        <Card>
          <CardBody>
          <ListGroup flush className="playlist-list">
              {allusersongsresults.map((song) => {

                if(song.playlistid == pl.playlistid){
                  return <ListGroupItem key={song.songname}>{song.songname}
                    <Link to={searchLyrics + new URLSearchParams({url: song.url}).toString()}> Full lyrics</Link>
                  </ListGroupItem>

                }
              })
              
              }
          </ListGroup>
          </CardBody>
        </Card>
      </Collapse>
      </Button>
      );    
    }
 
   
    return(
          <div className="home-center">
            <ListGroup flush className="playlist-list">
                {existingPlayListList}
            </ListGroup>
       
          </div>
    
        )
    }
}

PlayLists.contextType = CurrentUserContext;
