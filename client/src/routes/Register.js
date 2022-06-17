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
   ListGroup, ListGroupItem} from 'reactstrap';
import './register.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import fontawesome from '@fortawesome/fontawesome';
import { faSync, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import ReactTooltip from "react-tooltip";
import {config} from '../config'

fontawesome.library.add(faSync, faCircleCheck, faCircleXmark);


export default class Register extends React.Component {
    constructor() {
      super()
      this.state = {
        username: '',
        email: '',
        password0: '',
        password1: ''
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

    render() { 

        return <div className='register-container'>
          <InputGroup>
            <InputGroupText>
              Username
            </InputGroupText>
            <Input placeholder="username" onChange={e => this.setState({
                username: e.target.value
                })}/>
          </InputGroup>
          <br />
          <InputGroup>
            <InputGroupText>
              Email
            </InputGroupText>
            <Input placeholder="email" onChange={e => this.setState({
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
      </div>
    }
}

