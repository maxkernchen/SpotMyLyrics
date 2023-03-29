import React from 'react';
import {
  Collapse,
  Card,
  CardBody,
  Button, ListGroup, ListGroupItem
, Modal, ModalBody, ModalHeader,ModalFooter} from 'reactstrap';
import { CurrentUserContext } from "../CurrentUserContextAndCookies";
import { Link } from 'react-router-dom';
import './playlists.css'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import update from 'immutability-helper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import fontawesome from '@fortawesome/fontawesome';
import { faSync, faCircleCheck, faCircleXmark, faArrowsRotate, faTrash } from '@fortawesome/free-solid-svg-icons'
import ReactTooltip from "react-tooltip";
import {config} from '../config'

fontawesome.library.add(faSync, faCircleCheck, faCircleXmark, 
  faArrowsRotate, faTrash);


export default class PlayLists extends React.Component {
  constructor() {
    super()
    toast.configure();
    this.state = {
      existingPlaylists: [],
      allUserSongs: [],
      collapsePlayListCard: new Map(),
      callGetPlaylists: true,
      toastId: '',
      currentlyRefreshingPlaylist: '',
      toggleDeleteDialog: new Map()
    };
  }
  // get all existing playlists and set the state for the buttons for each.
  async getExistingPlayListsSetState() {
    let results = await this.getExistingPlaylists();
    this.setState({
      existingPlaylists: results,
    })
    let allPlaylists = this.state.existingPlaylists?.results;
    allPlaylists.forEach(pl => {
      this.state.collapsePlayListCard.set(pl.playlistid, false);
      this.state.toggleDeleteDialog.set(pl.playlistid, false);
    });

  }
  // call to server to get all existing playlists for this user.
  //calls server endpoint userplaylists
  async getExistingPlaylists(){
    const payload = JSON.stringify({username: this.context?.userid});
    return fetch(config.endpointUserPlayList, {
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
// get all playlists and each song assoicated to the playlist for the specified user
// calls server endpoint allusersongs
async getAllUserSongs(){
  const payload = JSON.stringify({username: this.context?.userid});
  return fetch(config.endpointAllUserSongs, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  })
    .then(data => data.json())
}
// delete the entire playlist for the user
// calls server endpoint deleteplaylist
async deletePlaylistForUser(playlistid, username){
  const payload = JSON.stringify({playlistid: playlistid, username: username});
  return fetch(config.endpointDeletePlaylist, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  })
    .then(data => data.json())
}
// call above method to delete playlist and then present user with toast
// if succesfully deleted or not.
async deletePlaylist(playlistid, username){
    let results = await this.deletePlaylistForUser(playlistid, username);
    if(results.error){
      this.createToast(results.error, true, false);
    }
    else{
      this.createToast(results.result, false, false);
    }
    // reset state to refresh page and refetch other playlists
    this.setState({callGetPlaylists: true});

}
// get the current status of the playlist, if it is being synced or not.
// if it is being synced disable refresh and deleted buttons and display refreshing icon.
getPlaylistSyncStatus(playlistdata){

  if(playlistdata.currentlysyncing || playlistdata.playlistname === this.state.currentlyRefreshingPlaylist){
    playlistdata.currentlysyncing = true;
    return  <>
      <FontAwesomeIcon color='green' icon="fa-solid fa-rotate" spin={true} >  
      </FontAwesomeIcon>
      <ReactTooltip id={playlistdata.playlistid} place="bottom" effect="solid">
          Currently Syncing Playlist
      </ReactTooltip> 
    </>
  }
  // if playlist is not currently syncing get the lat time it was synced.
  // then format this time in minutes ago, hours ago, days ago format
  else{
    let currentTime = new Date().getTime();
    let playListSyncTime = new Date(playlistdata.lastsynced).getTime();

    let minutesDiff = Math.ceil((currentTime - playListSyncTime)/ (1000 * 60));
    let lastSyncTimeStr = minutesDiff + config.minutesAgo;

    if(minutesDiff > 59){
      let hoursDiff = Math.ceil((currentTime - playListSyncTime)/ (1000 * 60 * 60));
      lastSyncTimeStr = hoursDiff + config.hoursAgo;
        if(hoursDiff > 23){
          let daysDiff = Math.ceil((currentTime - playListSyncTime)/ (1000 * 24 * 60 * 60));
          lastSyncTimeStr = daysDiff + config.daysAgo;
        }
    }
    
    return "Last Synced: " + lastSyncTimeStr
  }

}
// set the icon of the song if it is has fetched all lyrics or is missing lyrics 
getSongSyncStatus(songdata){

  if(songdata.lyricsfound){
    return  <>
    <FontAwesomeIcon  color ="green" icon="fa-solid fa-circle-check" />
      <Link to={config.songlyricspathquery + new URLSearchParams({url: songdata.url}).toString()}> Full lyrics
      </Link>
    </>
  }
  else{
    return <> 
      <FontAwesomeIcon color='red' icon="fa-solid fa-circle-xmark">
      </FontAwesomeIcon>
      <ReactTooltip id={songdata.url} place="bottom" effect="solid">
          Song Not Synced
      </ReactTooltip>
    </>
  }

}
// helper method to create an error is succesful toast nessage
createToast(message, iserror, isplaylist){

  if(iserror){
     toast.error(message, {
      position: "bottom-right",
      autoClose: true,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: this.context.darkmode ? "dark" : "light"
      });
  }
  else if (isplaylist){
    let toastIdCreated = toast.loading(config.refreshingPlaylist + '"' + 
    this.state.currentlyRefreshingPlaylist + '"', {
      position: "bottom-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      progress: 0,
      theme: this.context.darkmode ? "dark" : "light"
      });
      // only store toast id for playlist re-sync
    this.setState({toastId: toastIdCreated})
    
  }
  else{
    toast.success(message, {
      position: "bottom-right",
      autoClose: true,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: this.context.darkmode ? "dark" : "light"
      });
  }
}

// add a new playlist by calling the server with the playlist id and the username
async addPlayList(playListIDStr){

  if(playListIDStr && playListIDStr.trim().length){
    const payload = JSON.stringify({playlistid: playListIDStr.trim(), username: this.context?.userid});
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

// refresh the playlist, this will trigger all songs in the playlist to be reloaded. 
async refreshPlaylist(playlistid, playlistname)  {
  
  // we store the playlist in the db as playlistid_userid to 
  // help differ duplicate playlists added by different users.
  // However when refreshing we need to remove the _userid
  const splitPlayList = playlistid.split("_");

  let results = await this.addPlayList(splitPlayList[0]);
  if(!results.error){
    this.setState({currentlyRefreshingPlaylist: playlistname});
    this.setState({callGetPlaylists: true});
    this.createToast(results.playListName, false, true);
    const events = new EventSource(config.endpointPlaylistProgress);
    events.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      
      if(parsedData.progress && this.state.toastId && parsedData.playListID === splitPlayList[0] &&
        parsedData.username === this.context?.userid){
        toast.update(this.state.toastId, {progress: parsedData.progress});
        if(parsedData.progress === 1){
          events.close();
          this.setState({toastId: ''});
          this.setState({currentlyRefreshingPlaylist: ''});
          this.setState({callGetPlaylists: true});

        }
      }
    };

  }
  else{
    this.createToast(results.error, true, false);
  }
}
  // open popup bootstrap modal for this specific playlist
 toggleModal(playlistid){
  this.setState({
  toggleDeleteDialog: update(this.state.toggleDeleteDialog, {[playlistid]: {$set: 
    !this.state.toggleDeleteDialog.get(playlistid)}})
  })
}
  render() { 
   let playlistResults = this.state.existingPlaylists?.results;
   let allusersongsresults = this.state.allUserSongs?.results;
   let existingPlayListList;

   //console.log(this.context);
   // set dark theme body
   if(this.context.darkmode){
    document.body.classList.add('dark-theme');
    }
    else{
      document.body.classList.remove('dark-theme');
    }
    // if playlist needs to be refreshed get them.
   if(this.state.callGetPlaylists){
     this.getExistingPlayListsSetState();
     this.getAllUserSongsSetState()
     this.setState({callGetPlaylists: false});
   }
   // load all playlists into lists
   if(playlistResults && allusersongsresults && playlistResults.length > 0){
      //console.log(playlistResults);
      
      existingPlayListList = playlistResults.map((pl) => 
      <div className="list-div">
        <Button outline color="danger" className="side-button" disabled={pl.currentlysyncing} 
                onClick={() => this.toggleModal(pl.playlistid)}
                data-tip data-for={pl.playlistid + "_delete"} >
        <FontAwesomeIcon color ="red" icon="fa-solid fa-trash" /> 
            <ReactTooltip id={pl.playlistid + "_delete"}  place="bottom" effect="solid">
                Delete Playlist
            </ReactTooltip>
        </Button>

        <Modal isOpen={this.state.toggleDeleteDialog.get(pl.playlistid)} 
          toggle={()=>this.toggleModal(pl.playlistid)}>
            <ModalHeader className={this.context.darkmode ? "modal-dark": ""} 
              toggle={()=>this.toggleModal(pl.playlistid)}>
                Deleting {pl.playlistname}
            </ModalHeader>
            <ModalBody className={this.context.darkmode ? "modal-dark": ""}>
                Are you sure you want to delete PlayList: "{pl.playlistname}"
            </ModalBody>
            <ModalFooter className={this.context.darkmode ? "modal-dark": ""}>
              <Button
                color="danger"
                onClick={() => this.deletePlaylist(pl.playlistid, this.context?.userid)}>
                Delete Playlist
              </Button>
            
              <Button onClick={()=>this.toggleModal(pl.playlistid)}>
                Cancel
              </Button>
            </ModalFooter>
         </Modal>

        <Button outline color="success" className="side-button" 
                disabled={pl.currentlysyncing} data-tip data-for={pl.playlistid + "_refresh"} 
                onClick={() =>  this.refreshPlaylist(pl.playlistid, pl.playlistname)}>
            <FontAwesomeIcon color ="green" icon="fa-solid fa-arrows-rotate" /> 

            <ReactTooltip id={pl.playlistid + "_refresh"}  place="bottom" effect="solid">
                Refresh Playlist
            </ReactTooltip>
        </Button>

        <Button className={this.context.darkmode ? 
            "list-dark list-group-item list-group-item-action" : "list-group-item list-group-item-action"} 
       key={pl.playlistname} onClick={ () =>
        this.setState({
          collapsePlayListCard: update(this.state.collapsePlayListCard, {[pl.playlistid]: {$set: 
            !this.state.collapsePlayListCard.get(pl.playlistid)}})
        })
       } data-tip data-for={pl.playlistid}>Name: {pl.playlistname} Songs:   
      {pl.songswithlyrics + pl.songswithoutlyrics} {this.getPlaylistSyncStatus.call(this, pl)} 
      
      <Collapse isOpen={this.state.collapsePlayListCard.get(pl.playlistid)}>
        <Card className={this.context.darkmode ? "list-dark" : ""}>
          <CardBody >
          <ListGroup flush className="playlist-list">
              {allusersongsresults.map((song) => {

                  if(song.playlistid === pl.playlistid){
                    return <ListGroupItem className={this.context.darkmode ? "list-dark" : ""} 
                          key={song.url} data-tip data-for={song.url}> <img className='album-art-playlist' src={song.albumarturl}/> 
                              &nbsp; {song.artistname} - {song.songname} &nbsp; {this.getSongSyncStatus.call(this, song)}
                          </ListGroupItem>
                  }
               })
              }
          </ListGroup>
          </CardBody>
        </Card>
      </Collapse>
      </Button>
    </div>);    
    }
    // no playlists exist
    else{
      existingPlayListList = <ListGroupItem className={this.context.darkmode ? "list-dark" : ""} 
      key="no-playlists">No Playlists</ListGroupItem>
    }
    return(
          <div className="playlist-center">
            <ListGroup flush className="playlist-list">
                {existingPlayListList}      
            </ListGroup>
          </div>
        )
    }
}

PlayLists.contextType = CurrentUserContext;

