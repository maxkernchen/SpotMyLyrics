import React , { useState } from "react"
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
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD
    
  ],
   callbacks: {
    signInSuccessWithAuthResult: async (authResult, redirectUrl) => {
      const { user } = authResult;
  
      // TODO fail auth if user exists in firebase but not in local db??
      await saveToken(user.accessToken);
      login(user.accessToken, user.email);
      console.log('done');
    }
  }

}

function App() {
  
  let token = getToken();
  if(!token) {
      return (<div>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
    </div>);

  }
  else{
  
    return (
      
      <div className="wrapper">
     
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
      </div>
      
    );

  }
  
}

async function loginUser(credentials) {

  const payload = JSON.stringify(credentials);
  return fetch('http://localhost:3001/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  })
    .then(data =>  data.json())
    .catch((error) => {
      console.log(error)
    });
 }


async function login(tokenFromUser, email) {

let result;
try{
   result = await loginUser({
    useremail: email
  });
}
catch(e){
  console.log("failure" + e);
}
  if(result.userid){
    saveToken(tokenFromUser);
    saveUserID(result.userid);
  }
  
 
}


export default App;
