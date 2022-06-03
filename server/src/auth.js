// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import * as firebaseAdmin from "firebase-admin";
import {config} from "./config/config.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: config.firebaseApiKey,
  authDomain: config.firebaseAuthDomain,
  projectId: config.firebaseProjectID,
  storageBucket: config.firebaseStorageBucktet,
  messagingSenderId: config.firebaseMsgSenderID,
  appId: config.firebaseAppID,
  measurementId: config.firebaseMeasureID
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const auth = getAuth();
var currentUser;

/* onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('current user is ' + user.email);
    const uid = user.uid;
    // ...
  } else {
    // User is signed out
    // ...
  }
}); */

const authFireBasetoken = async (req, res, next) => {
  const header = req.headers.authorization;

  if (header) {
    const idToken = authHeader.split(" ")[1];
    firebaseAdmin
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






