/*
  app.js -- This creates an Express webserver with login/register/logout authentication
*/

// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");
const axios = require("axios")

// *********************************************************** //
//  Loading models
// *********************************************************** //
const Song = require('./models/Song')
const Favorites = require('./models/Favorites')

// *********************************************************** //
//  Loading JSON datasets
// *********************************************************** //
const songs = require('./public/data/songData.json')


// *********************************************************** //
//  Connecting to the database
// *********************************************************** //

const mongoose = require( 'mongoose' );

const mongodb_URI = process.env.mongodb_URI
//const mongodb_URI = 'mongodb://localhost:27017/cs103a_cpa02_angelo'

mongoose.connect( mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
// fix deprecation warnings
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});





// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //


// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
const { deflateSync } = require("zlib");
app.use(auth)

// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next()
  }
  else res.redirect('/login')
}

//app.use(isLoggedIn) // AFTER THIS MEANS MUST BE LOGGED IN TO RENDER
// To require user be logged in to render, se the below
//app.get("/about", isLoggedIn, (req, res, next) => { res.render("about"); } );


// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/about", (req, res, next) => {
  res.render("about");
});

app.get("/songs", (req, res, next) => {
  res.locals.songs = songs;
  res.render("songList");
});

app.post('/songs/byTitle',
  // show list of courses in a given subject
  async (req,res,next) => {
    const userTitle = req.body.title;
    const filtered_songs = await Song.find({title: new RegExp(userTitle, 'i')})   
    res.locals.songs = filtered_songs
    res.render('songList')
  }
)

app.post('/songs/byArtist',
  // show list of courses in a given subject
  async (req,res,next) => {
    const userArtist = req.body.artist;
    const filtered_songs = await Song.find({artists: userArtist})   
    res.locals.songs = filtered_songs
    res.render('songList')
  }
)

app.post('/songs/byGenre',
  // show list of courses in a given subject
  async (req,res,next) => {
    const userGenre = req.body.genre;
    const filtered_songs = await Song.find({genres: userGenre})   
    res.locals.songs = filtered_songs
    res.render('songList')
  }
)

app.get('/favorites', isLoggedIn,
  // show the current user's schedule
  async (req,res,next) => {
    try{
      const userId = res.locals.user._id;
      const songIds = (await Favorites.find({userId})).map(x => x.songId)
      res.locals.songs = await Song.find({_id:{$in: songIds}})
      res.locals.areFavorites = true
      res.render('songList')
    } catch(e){
      next(e)
    }
  }
)

app.get('/favorites/remove/:songId', isLoggedIn,
  // remove a course from the user's schedule
  async (req,res,next) => {
    try {
      await Favorites.remove(
                {userId:res.locals.user._id,
                 songId:req.params.songId})
      res.redirect('/favorites')

    } catch(e){
      next(e)
    }
  }
)

app.get('/favorites/add/:songId', isLoggedIn,
  // add a course to the user's schedule
  async (req,res,next) => {
    try {
      const songId = req.params.songId
      const userId = res.locals.user._id
      // check to make sure it's not already loaded
      const lookup = await Favorites.find({songId,userId})
      if (lookup.length==0){
        const favorites = new Favorites({songId,userId})
        await favorites.save()
      }
      res.redirect('/favorites')
    } catch(e){
      next(e)
    }
  })

/* ************************
  Loading (or reloading) the data into a collection
   ************************ */
// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection
app.get('/upsertDB',
  async (req,res,next) => {
    upsert()
    const num = await Course.find({}).count();
    res.send("data uploaded: "+num)
  }
)

// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// runs upsert on startUp
app.listen(() => {
  upsert();
});

// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = process.env.PORT || "5000";
console.log("Connecting on port " + port);
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const { reset } = require("nodemon");
const { rmSync } = require("fs");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function listToString(list){
  if (list == null || list.length == 0){
    return "None"
  }
  if (list.length == 1){
    return list[0]
  }
  if (list.length == 2){
    return list[0] + " and " + list[1]
  }
  s = ""
  for (let i = 0, n = list.length; i < n; i++){
    if (i == n-1){
      s += ", and "
    }
    else if (i != 0){
      s += ", "
    }
    s += list[i]
  }
  return s
}

async function upsert(){
  await Song.deleteMany({})
    for (song of songs){
      const {artists,title,album,genres}=song;
      const artistStr = listToString(artists)
      song.artistStr = artistStr
      const genreStr = listToString(genres)
      song.genreStr = genreStr
      await Song.findOneAndUpdate({artists,title,album,genres},song,{upsert:true})
    }
    console.log("data uploaded: "+ songs.length)
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
