var keys = require("./keys.js");

var request = require("request");
var Twitter = require("twitter");
var Spotify = require("node-spotify-api");
var fs = require("fs");

var command = process.argv[2];
var parameter = process.argv[3];
// sanitize command with regexp here

liri(command, parameter);

function liri(command, parameter) {
  switch(command) {
    case "my-tweets":
      getTweets();
      break;

    case "spotify-this-song":
      var song = parameter;     // need to sanitize
      if(!!song) {
        getSongInfo(song);
      }
      else {
        console.log("You did not enter a valid song name.  Here's an awesome song instead!");
        getSongInfo("The Sign [Remastered]");
      }
      break;

    case "movie-this":
      var movie = parameter;    // need to sanitize
      if(!!movie) {
        getMovieInfo(movie);
      }
      else {
        console.log("You did not enter a valid movie name.  Here's an awesome movie instead!");
        getMovieInfo("Mr. Nobody");
      }
      break;

    case "do-what-it-says":
      doTheThing();
      break;

    default:
      console.log("Sorry, I didn't understand that command.");
  }
}

// Displays last 20 tweets and their date/time in the console.
function getTweets() {

  console.log("Loading Twitter...");

  var twitter = new Twitter({
    consumer_key: keys.twitterKeys.consumer_key,
    consumer_secret: keys.twitterKeys.consumer_secret,
    access_token_key: keys.twitterKeys.access_token_key,
    access_token_secret: keys.twitterKeys.access_token_secret
  });

  var params = {screen_name: keys.twitterKeys.screen_name};

  twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
    if (!error && tweets.length > 0) {

      console.log("Here are the recent tweets of user " + tweets[0].user.screen_name + ":");
      for(var i = 0; i < tweets.length && i < 20; i++) {
        console.log(tweets[i].text);
        console.log(tweets[i].created_at);
      }
    }
    else {
      console.log("Sorry.  There was a problem retrieving the tweets.  Try buying some birdseed next time.");
      // write error message to file
    }
  });
}

// Displays artist(s), song name, spotify preview link, and album name
function getSongInfo(song) {

  console.log("Loading Spotify...");

  var spotify = new Spotify({
    id: keys.spotifyKeys.client_id,
    secret: keys.spotifyKeys.client_secret
  });

  spotify.search({ type: 'track', query: song }, function(error, data) {
    if (!error) {

      var firstResult = data.tracks.items[0];

      // Get list of artists
      var artists = firstResult.artists;
      var artistString = "";
      for(var i = 0; i < artists.length; i++) {
        artistString += artists[i].name;

        // if this wasn't the last artist, add a comma and space
        if(i < artists.length - 1) {
          artistString += ", ";
        }
      }
      console.log("Artist(s): " + artistString);
      console.log("Song: " + firstResult.name);
      // Show either preview link, or regular spotify link if there's no preview (fairly common)
      console.log("Preview link: " + (firstResult.preview_url ? firstResult.preview_url : firstResult.external_urls.spotify));
      console.log("Album: " + firstResult.album.name);
    }
    else {
      console.log("Sorry.  We couldn't find that song.  Are you sure it actually exists?");
      // write error message to file
    }

  });
}

// Returns movie info from omdbAPI
function getMovieInfo(movieTitle) {

  console.log("Fetching movie info...");

  var queryURL = "https://www.omdbapi.com/?t=" + movieTitle + "&y=&plot=short&apikey=" + keys.omdbKey;

  request.get(queryURL, {timeout:10000}, function (error, response, body) {
    if(!error && response.statusCode == 200) {

      var movie = JSON.parse(body);

      if(movie.Response === "True") {
        // There was a movie with that name found
        console.log("Title: " + movie.Title);
        console.log("Year: " + movie.Year);
        // Just in case a movie doesn't have a rating (can that happen?)
        if(movie.Ratings.length > 0) {
          console.log("IMDB Rating: " + movie.Ratings[0].Value);
        }
        if(movie.Ratings.length > 1) {
          console.log("Rotten Tomatoes Rating: " + movie.Ratings[1].Value);
        }
        console.log("Country: " + movie.Country);
        console.log("Language: " + movie.Language);
        console.log("Plot: " + movie.Plot);
        console.log("Actors: " + movie.Actors);
      }
      else {
        console.log("Oops.  We couldn't find a movie with that name.  Try something else?");
        return;
      }
    }
    else {
      console.log("Something went wrong when looking for your movie.  Try again?");
    }
  });
}

// Do whatever the file says to do and hope it doesn't blow up Alderaan
function doTheThing() {

  fs.readFile("random.txt", "utf8", function(error, data) {
    if(error) {
      return console.log(error);
    }

    var instructions = data.split(",");

    if(instructions[0] === "do-what-it-says") {
      console.log("Oh no you don't!  Bad kitty!  Infinite loops are not toys!")
    }
    else {
      liri(instructions[0], instructions[1]);
    }
  });

}