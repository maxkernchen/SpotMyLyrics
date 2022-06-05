import React from "react";
export const CurrentUserContext = React.createContext();



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