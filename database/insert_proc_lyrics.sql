CREATE PROCEDURE insertlryicsforuserplaylist(IN url varchar(200), IN songname varchar(200), IN artistname varchar(200), IN albumart varchar(200), IN lyrics text, IN lyricsfound TINYINT, IN userid varchar(50), IN playlistid varchar(200))
       BEGIN
         DECLARE songexists TINYINT DEFAULT 0;
 	 DECLARE songexistswithoutlyrics TINYINT DEFAULT 0;
	 DECLARE mappingalreadyexists TINYINT DEFAULT 0;
	 
	 START TRANSACTION;

         SELECT count(*) into songexists FROM spotmylyricsdb.smluserlyrics
         WHERE smluserlyrics.url = url;
         -- check if song exists for current user
         IF(songexists = 0) THEN
		INSERT INTO smluserlyrics (url,songname,artistname,albumart,lyrics,lyricsfound)
		VALUES(url,songname,artistname,albumart,lyrics,lyricsfound);
		
		INSERT INTO smlusersongmapping(userid,url,playlistid)
		values(userid,url,playlistid);
	   
      
         ELSE
         
         	SELECT count(*) into songexistswithoutlyrics
         	FROM spotmylyricsdb.smluserlyrics
         	WHERE smluserlyrics.url = url
         	AND smluserlyrics.lyricsfound = 0;
         	
         	IF(lyricsfound = 1 AND songexistswithoutlyrics = 1) THEN
		 	-- update the table in case we find lyrics 
			UPDATE smluserlyrics
			SET smluserlyrics.lyrics = lyrics,
			smluserlyrics.lyricsfound = lyricsfound;
		END IF;
		
		SELECT count(*) into mappingalreadyexists
         	FROM spotmylyricsdb.smluserlyrics
         	JOIN spotmylyricsdb.smlusersongmapping ON smlusersongmapping.url = 
         	smluserlyrics.url AND smlusersongmapping.userid = userid AND 
         	smlusersongmapping.playlistid = playlistid;
         	-- only insert mapping if its not already there
         	IF(mappingalreadyexists = 0) THEN
			INSERT INTO smlusersongmapping(userid,url,playlistid)
			values(userid,url,playlistid);
		END IF;
		
		
         	 
         END IF;
         
        COMMIT;

         
       END //
