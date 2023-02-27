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
  Button, Input, InputGroup, InputGroupText,
   ListGroup, ListGroupItem, Form} from 'reactstrap';
import firebase from 'firebase/compat/app';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import 'firebase/compat/auth';
import { CurrentUserContext, verifyUserAndEmail } from "../CurrentUserContextAndCookies";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import './register.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import fontawesome from '@fortawesome/fontawesome';
import { faSync, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import ReactTooltip from "react-tooltip";
import {config} from '../config'

fontawesome.library.add(faSync, faCircleCheck, faCircleXmark);

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

export default class Register extends React.Component {
    constructor() {

      super()
      toast.configure();
      this.state = {
        username: '',
        email: '',
        password0: '',
        password1: '',
        passwordsmatch: false
      };
  
    
    }


    passwordsMatch(){
      if(this.state.password0 && this.state.password1){
        if(this.state.password0 === this.state.password1){
          return <><FontAwesomeIcon data-tip data-for="password-tip" 
                        size="2x" color ="green" icon="fa-solid fa-circle-check" />
          <ReactTooltip 
                        id="password-tip" place="bottom" effect="solid">
            Passwords Match
        </ReactTooltip>
          </>
        }
        else{
          return <>
              <FontAwesomeIcon data-tip data-for="password-tip" size="2x" color ="red" icon="fa-solid fa-circle-xmark" />
              <ReactTooltip id="password-tip" place="bottom" effect="solid">
                Passwords Do Not Match
              </ReactTooltip>
          </>
          }

      }
      return <></>
  
    }

    async registerUser(){
      console.log(this.state.email + this.state.username);

      if(!this.state.email || !this.state.username || 
        !this.state.password0 || !this.state.password1){
          this.createToast("Not all fields defined", true);
      }
      else if(!(this.state.password0 === this.state.password1)){
        this.createToast("Passwords don't match", true);

      }
      else{
        
         
            let errorOccured = false
            let userFirebase;
            await createUserWithEmailAndPassword(auth, this.state.email, this.state.password0)
            .then((userCredential) => {
              userFirebase = userCredential.user;
            })
            .catch((error) => {
                let errorCode = error.code;
                let errorMessage = error.message;
                errorOccured = true;
                if (errorCode == 'auth/weak-password') {
                  this.createToast("Password is not strong enough", true);
                } 
                else if(errorCode == "auth/email-already-in-use")
                {
                  this.createToast("Email is already used", true);
                }
                else if (errorCode == "auth/invalid-email"){
                  this.createToast("Email is not valid", true);
                }
                else{
                  this.createToast("Error occured creating user: " + errorMessage, true);
                }
            });

          if(!errorOccured){
            let results = await this.registerUserToDatabase(this.state.email, this.state.username);
            if(results.error){
              // delete user from Firebase so db and firebase are not out of sync
              await this.deleteuserFireBase(userFirebase.uid);
              this.createToast(results.error, true);
            }
            else{
              this.context = {firebaseuser: userFirebase, userid: this.state.username};
              this.createToast(results.results, false);
            }
          }
      }

    }


    async registerUserToDatabase(email, username){
        const payload = JSON.stringify({email: email.toLowerCase().trim(), username: username.trim()});
        return fetch('http://localhost:3001/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payload
        })
          .then(data => data.json())
    }
    

    createToast(message, iserror){
      if(iserror){
         toast.error(message, {
          position: "bottom-right",
          autoClose: true,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false
          });
      }
      else{
        toast.success(message, {
          position: "bottom-right",
          autoClose: true,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false
          });

      }
  
      
  
    }


    async deleteuserFireBase(uid){

        const payload = JSON.stringify({uid: uid});
        return fetch('http://localhost:3001/deleteuser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: payload
        })
          .then(data => data.json())
    }
    
  

    render() { 
        return <div className='register-container'>
          <InputGroup>
            <InputGroupText>
              Username
            </InputGroupText>
            <Input placeholder="username" maxLength={200} onChange={e => this.setState({
                username: e.target.value
                })}/>
          </InputGroup>
          <br />
          <InputGroup>
            <InputGroupText>
              Email
            </InputGroupText>
            <Input placeholder="email" maxLength={200} onChange={e => this.setState({
                email: e.target.value
                })} />
          </InputGroup>
          <br />
          <InputGroup>
            <InputGroupText>
              Password
            </InputGroupText>
            <Input type='password' placeholder="password" onChange={e => this.setState({
                password0: e.target.value
                })}/> 
                &nbsp;
                &nbsp;
                {this.passwordsMatch.call(this)}
          </InputGroup>
          <br />
          <InputGroup>
            <InputGroupText>
              Confirm Password
            </InputGroupText>
            <Input type='password' placeholder="confirm password" onChange={e => this.setState({
                password1: e.target.value
                })}/> 
                &nbsp;
                &nbsp;
                {this.passwordsMatch.call(this)}
          </InputGroup>

         <br/>
         <Link to="/login">
            <Button outline color="info">Login</Button>
         </Link>
         &nbsp;
         &nbsp;
      
        <Button color="primary" onClick={() => this.registerUser()}>Register</Button>
      
      </div>
    }
}

Register.contextType = CurrentUserContext;

