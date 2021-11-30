// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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
const app = initializeApp(firebaseConfig);

export default async function firebaseLogin(email, password){

  let result; 
  let userCredential;
  userCredential =  await signInWithEmailAndPassword(getAuth(), email, password);
  if(userCredential){
    const user = userCredential.user;
    result = await user.getIdToken();
  }
  
  return result;
}


