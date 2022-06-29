import SpotifyWebApi from 'spotify-web-api-node';
import {config} from '../config/config.js';

const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyclientid,
    clientSecret: config.spotifyclientsecret
  });

var accessDate;

// TODO make sure we get new token every 30 mins or so.
 export async function initalizeSpotifyApi() {

    await spotifyApi.clientCredentialsGrant().then(
        function(data) {
          console.log('The access token expires in ' + data.body['expires_in']);
          console.log('The access token is ' + data.body['access_token']);
      
          // Save the access token so that it's used in future calls
          spotifyApi.setAccessToken(data.body['access_token']);
          accessDate = new Date();
        },
        function(err) {
          console.log(
            'Something went wrong when retrieving an access token',
            err.message
          );
        }
      );
}


export async function getCurrentApiObj() {
    let now = new Date();
    let expiresDate = new Date(accessDate.getTime() + config.spotifyexpiresin);
    if(now >= expiresDate){
      console.log('Renewing access token Spotify API');
      await initalizeSpotifyApi();

    }
    return spotifyApi;
    
}