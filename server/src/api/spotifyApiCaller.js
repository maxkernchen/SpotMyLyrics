import SpotifyWebApi from 'spotify-web-api-node';
import {config} from '../config/config.js';
// define spotify api object, secret is stored in config file.
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyclientid,
    clientSecret: config.spotifyclientsecret
  });

// date we accessed spotify token last
var accessDate;
// if any errors occured when accessing spotify api
var errorSpotifyApiGet = false;

 export async function initalizeSpotifyApi() {
    await spotifyApi.clientCredentialsGrant().then(
        function(data) {
          console.log('The access token expires in ' + data.body['expires_in']);
         // console.log('The access token is ' + data.body['access_token']);

          // Save the access token so that it's used in future calls
          spotifyApi.setAccessToken(data.body['access_token']);
          accessDate = new Date();
        },
        function(err) {
          console.log(config.errorSpotifyToken, err.message);
          errorSpotifyApiGet = true;
        }
      );
}
// get the current api object, if it is about to expire refresh it.
export async function getCurrentApiObj() {
    let now = new Date();
    let expiresDate = new Date(accessDate.getTime() + config.spotifyexpiresin);
    if(now >= expiresDate || errorSpotifyApiGet){
      console.log(config.renewSpotifyToken);
      errorSpotifyApiGet = false;
      await initalizeSpotifyApi();
    }
    return spotifyApi;
}