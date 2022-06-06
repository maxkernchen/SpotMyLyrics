import { initializeApp, cert, } from "firebase-admin/app";

import {getAuth} from "firebase-admin/auth"

import serviceAccount from "/home/max/Documents/Projects/firebasePK/firebaseSMLAccountKey.json" assert { type: 'json' };

const app = initializeApp({
  credential: cert(serviceAccount)
});


export const authFireBaseTokenMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;

  if (header) {
    const idToken = authHeader.split("|")[1];
    admin
      .auth()
      .verifyIdToken(idToken)
      .then(function (decodedToken) {
        return next();
      })
      .catch(function (error) {
        console.log(error);
        return res.sendStatus(403);
      });
  } else {
    res.sendStatus(401);
  }
};

export const verifyUserToken = async (idToken) =>{

  if(idToken){
    try{
    let decodedToken = await getAuth().verifyIdToken(idToken);
    if(decodedToken)
      return true;
    }
    catch(error) {
        console.log(error);
        return false;
      }
  }
  return false;
  
} 






