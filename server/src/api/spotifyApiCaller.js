import SpotifyWebApi from 'spotify-web-api-node';
import {config} from '../config/config.js';

// TODO Replace with config file
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyclientid,
    clientSecret: config.spotifyclientsecret
  });
// TODO make sure we get new token every 30 mins or so.
export function initalizeSpotifyApi() {

    spotifyApi.clientCredentialsGrant().then(
        function(data) {
          console.log('The access token expires in ' + data.body['expires_in']);
          console.log('The access token is ' + data.body['access_token']);
      
          // Save the access token so that it's used in future calls
          spotifyApi.setAccessToken(data.body['access_token']);
        },
        function(err) {
          console.log(
            'Something went wrong when retrieving an access token',
            err.message
          );
        }
      );
}

export function getCurrentApiObj() {
    return spotifyApi;
    
}