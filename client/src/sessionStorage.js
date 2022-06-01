import { useState } from 'react';

export function useToken() {
    const getToken = () => {
      const tokenSession = sessionStorage.getItem('token');
      const userToken = JSON.parse(tokenSession);
      return userToken;
    };
    // hook token so when it's saved we get the value back
    const [token, setToken] = useState(getToken());
  
    const saveToken = userToken => {
      sessionStorage.setItem('token', JSON.stringify(userToken));
      setToken(userToken);
    };

    return {
        setToken: saveToken,
        token
      }
      
  }

  //TODO token needs to be verified against firebase
  export function getToken(){
    const tokenSession = sessionStorage.getItem('token');
    const userToken = JSON.parse(tokenSession);
    return userToken;

  }
  export async function saveToken(userToken)
  {
    console.log('saved token');
    sessionStorage.setItem('token', JSON.stringify(userToken));
  }

  //TODO can either use firebase ccurrent user or just store it as global var.
  // do this to be safer than having it in the session table. Also we should
  // check if the user is defined in its var rather than if the token exists.
  // I would think that would also only exist per tab.
  export function useUserID() {
   
    // hook token so when it's saved we get the value back
    const [userid, setUserID] = useState(getCurrentUser());
  
    const saveUserID = userid => {
      sessionStorage.setItem('userid', JSON.stringify(userid));
      setUserID(userid);
    };

    return {
        setUserID: saveUserID,
        userid
      }
  }


  // TODO might be possible to replace with firebase call.
  // will need to to do this else user can simply edit session table to get access to other user's data
  export function getCurrentUser(){
    const useridSession = sessionStorage.getItem('userid');
    const useridJson = JSON.parse(useridSession);
    return useridJson;

  }

  export function saveUserID(userid){
    sessionStorage.setItem('userid', JSON.stringify(userid));
   
  }

