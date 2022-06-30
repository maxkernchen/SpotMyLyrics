import { initializeApp, cert, } from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth"
import serviceAccount from "/home/max/Documents/Projects/firebasePK/firebaseSMLAccountKey.json" assert { type: 'json' };

const app = initializeApp({
  credential: cert(serviceAccount)
});

// helper methods for Firebase admin sdk, can only run on server side.

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

export const deleteUser = async (uid) => {

  try {
    let user = await getAuth().deleteUser(uid);
    console.log('user deleted');
    return true;
  }
  catch(error) {
    console.log('Error deleting user: ' + error);
    return false;
  }

}




