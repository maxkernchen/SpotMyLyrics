# Spot My Lyrics

Spot My Lyrics is a React app with a with Express Server backend and a MySQL database for storage. 
This app can load any public Spotify Playlist and then fetch lyrics for each song in the playlist. 
The lyrics are fetch from musixmatch.com with a headless browser, which is the same provider Spotify uses for their lyric screens.
These lyrics will then be stored and searchable. 
This allows a user to find a song in their Spotify library where they may remember the lyrics but not the song name.

Any user can register an account for Spot My Lyrics at the below website:

http://192.210.137.126/spotmylyrics

Also feel free to use the built in test user:

Email: smluser@test.com

Password: SML1234

Technical Features:
* User login/registration handled by Google's Firebase
* Dark Mode for all screens, settings are stored in Express session so they remain even if user logs out or closes tab.
* Progress Toasts for adding a new playist or refreshing an existing one. These are designed with server side events from Express.
* Bull Redis queue for processing of requests concurrently and handling duplicate/invalid requests.
* Real time search query for all songs in user's database.
* Ability to refresh a playlist if songs have been removed or added.


Screenshots of common actions.
* Adding a new playlist

  ![Adding a new playlist](https://i.imgur.com/xdExVLb.png)

* Viewing all the songs in the playlist:
 ![Viewing all the songs in the playlist](https://i.imgur.com/qRdBUTN.png)
 
 * Viewing lyrics of a song:
 ![Viewing lyrics of a song](https://i.imgur.com/XkY8u5I.png)
 
 * Search through all songs for a lyric term:
   ![Search through all songs for a lyric term](https://i.imgur.com/iNoa2y9.png)
