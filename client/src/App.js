import React , { useEffect,useState } from "react"
import logo from './logo.svg';
import './app.css';
import { BrowserRouter, Route, Switch, Link, Redirect} from 'react-router-dom';
import Preferences from './routes/Preferences/Preferences';
import {useToken, useUserID, getToken, saveToken, saveUserID, getCurrentUser} from "./sessionStorage";
import SMLHome from "./routes/Dashboard/SMLHome";
import PlayListLyrics from "./routes/Dashboard/PlayListLyrics"
import SongLyrics from "./routes/Dashboard/SongLyrics";
import {config} from "./config.js";
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, getIdToken, } from "firebase/auth";
import { CurrentUserContext, useAuth } from "./CurrentUserContext";

import 'firebase/compat/auth';


const firebaseConfig = {
  apiKey: config.firebaseApiKey,
  authDomain: config.firebaseAuthDomain,
  projectId: config.firebaseProjectID,
  storageBucket: config.firebaseStorageBucktet,
  messagingSenderId: config.firebaseMsgSenderID,
  appId: config.firebaseAppID,
  measurementId: config.firebaseMeasureID
};



firebase.initializeApp(firebaseConfig);
let auth = getAuth();

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'redirect',
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: '/spotmylyrics',
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD
    
  ]

}

function App() {

  const [context, setContext] = useState();
  const [loading, setLoading] = useState(true);


    useEffect(()=>{
      const unsub = onAuthStateChanged(getAuth(),user=>{
        if (user) {
          console.log("signed in")
          setContext(user);
          }
          else {
          console.log("signed out")
          }
          console.log("Auth state changed");
          setLoading(false);
      })
      
      return unsub;
  },[])

 if(loading){
  
    return(
    <div>
      <h1>Loading...</h1>
    </div>);
  
 }
else if(!context) {
      return (<div>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
    </div>);

  }
  else{

    return (
      <div>
        <CurrentUserContext.Provider value={context}>
        <BrowserRouter>
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
            <Redirect from="/" to="/spotmylyrics" />
          </Switch>
        </BrowserRouter>
        </CurrentUserContext.Provider>
      </div>
      
    );

  }
  
  
}



export default App;
