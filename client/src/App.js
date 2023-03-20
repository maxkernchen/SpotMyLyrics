import React , { useEffect, useState } from "react"
import logo from './logo.svg';
import './app.css';
import { BrowserRouter, Route, Switch, Link, Redirect} from 'react-router-dom';
import SMLHome from "./routes/SMLHome";
import PlayLists from "./routes/PlayLists"
import SongLyrics from "./routes/SongLyrics";
import Register from "./routes/Register";
import {config} from "./config.js";
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, getIdToken, signOut } from "firebase/auth";
import 'firebase/compat/auth';
import { CurrentUserContext, getDarkModeCookie, setDarkModeCookie, verifyUserAndEmail } from "./CurrentUserContextAndCookies";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import fontawesome from '@fortawesome/fontawesome';
import { faArrowRightFromBracket, faMoon as solidMoon, faRotate} from '@fortawesome/free-solid-svg-icons'
import './firebaseui-styling.global.css';
import { faMoon as regularMoon} from '@fortawesome/free-regular-svg-icons'
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  Tooltip,
  DropdownToggle,
  DropdownMenu,
  DropdownItem, 
  Button} from 'reactstrap';
  import ReactTooltip from "react-tooltip";
  import icon from './sml_icon.png';

fontawesome.library.add(faArrowRightFromBracket, faRotate, solidMoon, regularMoon);

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
function signOutFireBase(){
  signOut(auth).then(() => {
    // Sign-out successful.
  }).catch((error) => {
    // An error happened.
  });
}

var darkModeFAIcon = "fa-regular fa-moon";
function App() {

  const [context, setContext] = useState();
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen]   = useState(false);
  const [darkModeChanged, setDarkModeChanged] = useState(false);
  


    useEffect(()=>{
      
   
      const unsub = onAuthStateChanged(getAuth(),user=>{
        setLoading(true);
        if (user) {
          console.log("signed in")
          auth.currentUser.getIdToken(true).then(async function(idToken) {
          
              let useridfromemail = await verifyUserAndEmail(idToken, user.email);
              if(!useridfromemail.error){ 
                  let darkModeBool = false;
                  // TODO make this cookie that persits on tab close
                  let cookieResults = await getDarkModeCookie(useridfromemail.userid);
                  if(!cookieResults.error){
                    darkModeBool = cookieResults.results;
                  }
                  else{
                    await setDarkModeCookie(useridfromemail.userid, darkModeBool);
                  }
                  if(darkModeBool){
                    document.body.classList.add('dark-theme');
                  }
                  else{
                    document.body.classList.remove('dark-theme');
                  }
                  setContext({firebaseuser: user, userid: useridfromemail.userid, totalsongs: useridfromemail.totalsongs ? useridfromemail.totalsongs : 0,
                              darkmode: darkModeBool});
                      darkModeBool ? darkModeFAIcon = "fa-solid fa-moon" : darkModeFAIcon = "fa-regular fa-moon";
                              
              }
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
  },[darkModeChanged]);


 if(loading){
  
    return(
    <div className="loading-div">
    <FontAwesomeIcon className="centered" icon="fa-solid fa-rotate" size="5x" spin={true}/>
    </div>);
  
 }
else if(!context?.userid) {
      return (<div>
    
    <CurrentUserContext.Provider value={context}>
      <Navbar color={context.darkmode ? "dark" : "light"} light expand="md">
      <NavbarBrand href="/">Spot My Lyrics </NavbarBrand>
      </Navbar>
      <BrowserRouter>
          <Switch>
            <Route path="/register">
              <Register />
            </Route>
            
            <Route path="/login">
              <br/>
              <br/>
              <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
              <br/>
              <br/>
              <Button outline color="success" className="centered" href="/register"> 
               Register
              </Button>
            </Route>
            <Redirect from="/" to="/login" />
          </Switch>
        </BrowserRouter>
      </CurrentUserContext.Provider>

       
    </div>);

  }
  else{

    return (
      <div>
       
        <CurrentUserContext.Provider value={context}>
        <Navbar color={context.darkmode ? "dark" : "light"} light={context.darkmode ? "" : "light"} expand="md">
        <NavbarBrand href="/" data-tip data-for="home-link"><img className="home-icon" src={icon}/> 
            Spot My Lyrics 
          <ReactTooltip id="home-link" place="bottom" effect="solid">
              Go Home
          </ReactTooltip>
        </NavbarBrand>
        <NavbarToggler onClick={()=>setIsOpen(!isOpen)} />
        <Collapse isOpen={isOpen} navbar>
        <Nav className="ml-auto" navbar>
            <NavItem>
              <NavLink href="/playlists" data-tip data-for="playlists-link">
                 PlayLists
                <ReactTooltip id="playlists-link" place="bottom" effect="solid">
                  View Synced Playlists 
                </ReactTooltip>
              </NavLink>
            </NavItem>
          </Nav>
          <Nav className="ms-auto" navbar>
            <NavbarBrand>
             &#40; User: {context.userid}	&#41; &#160;
             <Button onClick={async () => { 
              
                let darkModeBool = false;
                let cookieResults = await getDarkModeCookie(context.userid);
                if(!cookieResults.error){
                  darkModeBool = cookieResults.results;
                }
                await setDarkModeCookie(context.userid, !darkModeBool);
                setDarkModeChanged(!darkModeChanged);
             }
            }>  <FontAwesomeIcon data-tip data-for="darkmode-icon" icon={darkModeFAIcon}/>
              <ReactTooltip id="darkmode-icon" place="bottom" effect="solid">
                Dark/Light Mode
              </ReactTooltip>
            </Button>
             </NavbarBrand>
            <NavItem>
              <NavLink href="/" onClick={()=>
                { signOutFireBase(); }}> 
                <FontAwesomeIcon data-tip data-for="signout-icon" icon="fa-solid fa-arrow-right-from-bracket" size="2x">
                </FontAwesomeIcon>
                <ReactTooltip id="signout-icon" place="bottom" effect="solid">
                Sign Out
              </ReactTooltip>
              </NavLink>
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
        <BrowserRouter>
          <Switch>
            <Route path="/spotmylyrics">
              <SMLHome />
            </Route>
            <Route path="/playlists">
              <PlayLists />
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
