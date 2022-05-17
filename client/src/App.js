import React , { useState } from "react"
import logo from './logo.svg';
import './app.css';
import { BrowserRouter, Route, Switch, Link } from 'react-router-dom';
import Preferences from './routes/Preferences/Preferences';
import Login from './routes/Login/Login';
import {useToken, useUserID} from "./sessionStorage";
import SMLHome from "./routes/Dashboard/SMLHome";
import PlayListLyrics from "./routes/Dashboard/PlayListLyrics"
import SongLyrics from "./routes/Dashboard/SongLyrics";



function App() {
  
  const {token, setToken } = useToken();
  const {userid, setUserID } = useUserID();


  if(!token) {
    return <Login setToken={setToken} setUserID={setUserID} />
  }
  else{
 
    return (
      <div className="wrapper">
 
        
        
        <BrowserRouter > 
        <Link to="/spotmylyrics">spot my lyrics
        
        </Link>
          <Switch>
            <Route path="/spotmylyrics">
              <SMLHome />
            </Route>
            <Route path="/preferences">
              <Preferences />
            </Route>
            <Route path="/playlistlyrics">
              <PlayListLyrics />
            </Route>
            <Route path="/songlyrics">
              <SongLyrics />
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    );

  }
  
}
export default App;
