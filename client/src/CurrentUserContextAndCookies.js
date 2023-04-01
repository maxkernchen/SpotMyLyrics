import React from "react";
import {config} from "./config.js";
export const CurrentUserContext = React.createContext();

// make sure user token and email are valid
export async function verifyUserAndEmail(token, email){
    if(email && email.trim().length){
      const payload = JSON.stringify({useremail: email.toLowerCase().trim(), usertoken: token});
      return fetch(config.endpointVerifyUser, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      })
        .then(data => data.json())
    }
}
// try the get the dark mode cookie for this user from the server
export async function getDarkModeCookie(userName){
   const payload = JSON.stringify({ username: userName});
    return await fetch(config.endpointGetDarkMode, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then(data => data.json())
}
// save the dark mode cookie for this user to the server's session table.
export async function setDarkModeCookie(userName, darkModeBool){
    const payload = JSON.stringify({ username: userName, darkmodebool : darkModeBool});
    return await fetch(config.endpointSetDarkMode, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then(data => data.json())
}
