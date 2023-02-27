import React from "react";
export const CurrentUserContext = React.createContext();


// makes sure user token is valid and gets dark mode/
export async function verifyUserAndEmail(token, email){
    if(email && email.trim().length){
      const payload = JSON.stringify({useremail: email.toLowerCase().trim(), usertoken: token});
      return fetch('http://localhost:3001/verifyuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json())
    }
  }

export async function getDarkModeCookie(userName){

   const payload = JSON.stringify({ username: userName});
    return await fetch('http://localhost:3001/getdarkmodecookie', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then(data => data.json())
  }

  export async function setDarkModeCookie(userName, darkModeBool){
    const payload = JSON.stringify({ username: userName, darkmodebool : darkModeBool});
    return await fetch('http://localhost:3001/setdarkmodecookie', {
      method: 'POST',
    
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then(data => data.json())
  }
