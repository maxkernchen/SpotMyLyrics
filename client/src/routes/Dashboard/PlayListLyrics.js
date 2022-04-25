import React from 'react';
import { getCurrentUser } from '../../sessionStorage';
import debounce from 'lodash.debounce';


export default class PlayListLyrics extends React.Component {
  constructor() {
    super()

    this.state = {
      searchTerm: '',
      searchResults: [],
      playList: '',
      existingPlaylists: []
    };


  }


  render() { 
    
   
    return(
        <div>
            <h1>View Playlists: </h1>
        </div>
    
        )
    }
}
