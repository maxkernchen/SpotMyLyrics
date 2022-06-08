import React , { useEffect,useState } from "react"
import logo from './logo.svg';
import './app.css';
import { BrowserRouter, Route, Switch, Link, Redirect} from 'react-router-dom';
import Preferences from './routes/Preferences/Preferences';
import SMLHome from "./routes/Dashboard/SMLHome";
import PlayListLyrics from "./routes/Dashboard/PlayListLyrics"
import SongLyrics from "./routes/Dashboard/SongLyrics";
import {config} from "./config.js";
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, getIdToken, } from "firebase/auth";
import 'firebase/compat/auth';
import { CurrentUserContext, verifyUserAndEmail } from "./CurrentUserContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import fontawesome from '@fortawesome/fontawesome';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'
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
  DropdownItem } from 'reactstrap';



fontawesome.library.add(faArrowRightFromBracket);

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
  const [isOpen, setIsOpen]   = useState(false);


    useEffect(()=>{
      const unsub = onAuthStateChanged(getAuth(),user=>{
        if (user) {
          console.log("signed in")
          auth.currentUser.getIdToken(true).then(async function(idToken) {
              let useridfromemail = await verifyUserAndEmail(idToken, user.email);
              setContext({firebaseuser: user, userid: useridfromemail.userid});
              setLoading(false);
            })
          }
          else {
          console.log("signed out")
          setLoading(false);
          }
          console.log("Auth state changed");
          
      })
      
      return unsub;
  },[])

 if(loading){
  
    return(
    <div>
      <h1>Loading...</h1>
    </div>);
  
 }
else if(!context?.userid) {
      return (<div>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
    </div>);

  }
  else{

    return (
      <div>
       
        <CurrentUserContext.Provider value={context}>
        <Navbar color="light" light expand="md">
        <NavbarBrand href="/">Spot My Lyrics</NavbarBrand>
        <NavbarToggler onClick={()=>setIsOpen(!isOpen)} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="ml-auto" navbar>
            <NavItem>
              <NavLink href="/spotmylyrics/">Home  <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" size="2x"/></NavLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
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
