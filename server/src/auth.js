import { initializeApp, cert, } from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth"
import serviceAccount from "/home/max/Documents/Projects/firebasePK/firebaseSMLAccountKey.json" assert { type: 'json' };
import {config} from "./config/config";

const app = initializeApp({
  credential: cert(serviceAccount)
});

// helper methods for Firebase admin sdk, these functions are only allowed to be run within a server.

// verify that the user token is still valid 
export const verifyUserToken = async (idToken) =>{

  if(idToken){
    try{
    let decodedToken = await getAuth().verifyIdToken(idToken);
    if(decodedToken)
      return true;
    }
    catch(error) {
        console.log(config.errorValidatingToken + error);
        return false;
      }
  }
  return false;
  
}
// delete a user from firebase using the passed in user id.
export const deleteUser = async (uid) => {
  try {
    let user = await getAuth().deleteUser(uid);
    return true;
  }
  catch(error) {
    console.log(config.errorDeletingUser + error);
    return false;
  }

}




