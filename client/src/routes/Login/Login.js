import React, { useState } from 'react';
import './login.css';


async function loginUser(credentials) {

    const payload = JSON.stringify(credentials);
    return fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })
      .then(data => data.json())
   }


export default function Login({ setToken, setUserID }) {

  const [username, setUserName] = useState();
  const [password, setPassword] = useState();



  const handleSubmit = async e => {
    e.preventDefault();
    const result = await loginUser({
      username,
      password
    });
    
    setToken(result.token);
    setUserID(result.userid);
    
  }

  return(
    <div className="login-wrapper">
    <h1>Please Log In</h1>
        <form onSubmit={handleSubmit}> 
        <label>
            <p>Username</p>
            <input type="text" onChange={e => setUserName(e.target.value)}/>
        </label>
        <label>
            <p>Password</p>
            <input type="password" onChange={e => setPassword(e.target.value)}/>
        </label>
        <div>
            <button type="submit">Submit</button>
        </div>
        </form>
    </div>
  )
}


