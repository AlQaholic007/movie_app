require("dotenv").config();
var express = require("express");
var router = express.Router();
var path = require("path");
var guid = require("guid");
var mv = require("mv");
const mime = require("mime-types");
var db = require("../utils/models/user");
var formParser = require("../utils/form-parser.js");
const fs = require("file-system");
const axios = require("axios");
const _ = require("underscore");

var file_types = ["png", "jpeg", "gif", "jpg", "mov", "mp4"];

/* GET users listing. */

router.get("/", function(req, res, next) {
  res.redirect("/u/@" + req.session.user.username);
});

router.get("/settings", function(req, res, next) {
  db.findOne({ _id: req.session.user._id }).exec((err, user) => {
    res.render("me/settings", {
      title: req.app.conf.name,
      user: user
    });
  });
});

router.get("/activity", function(req, res, next) {
  db.findOne({ _id: req.session.user._id }).exec((err, user) => {
    res.render("me/activity", {
      title: req.app.conf.name,
      activity: user.notifications
    });
  });
});

router.get("/post/:action/:query", function(req, res, next) {
  switch (req.params.action) {
    case "edit":
      res.render("index");
      break;
    case "delete":
      {
        db.findOne({ id: req.session.user.id }).exec((err, u) => {
          let id = req.params.query;
          if (!u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))]) {
            return res.redirect("/");
          }
          console.log(u);
          if (
            u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))] &&
            u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))].static_url
          )
            try {
              fs.unlinkSync(
                "./public" +
                  u.posts[u.posts.indexOf(u.posts.find(x => x._id == id))]
                    .static_url
              );
            } catch (err) {}
          u.posts.splice(u.posts.indexOf(u.posts.find(x => x._id == id)), 1);
          u.save(err => {
            if (err) throw err;
            console.log("Post deleted");
            res.redirect("/");
          });
        });
      }
      break;
    default:
      res.send("What are you trynna do? (-_-)");
  }
});

router.get("/upload", function(req, res, next) {
  res.render("upload/file-upload", {
    title: req.app.conf.name,
    user: req.session.user
  });
});

router.post("/upload", formParser, async function (req, res, next) {
  // Generate a random id
  let random_id = guid.raw();
  let genreMap = {
    "28": "Action",
    "12": "Adventure",
    "16": "Animation",
    "35": "Comedy",
    "80": "Crime",
    "99": "Documentary",
    "18": "Drama",
    "10751": "Family",
    "14": "Fantasy",
    "36": "History",
    "27": "Horror",
    "10402": "Music",
    "9648": "Mystery",
    "10749": "Romance",
    "878": "Science Fiction",
    "10770": "TV Movie",
    "53": "Thriller",
    "10752": "War",
    "37": "Western"
  }
  let { imdbMovieId, star, caption, title } = req.body;
  let starString = [];
  let temp = star;
  while (temp) {
    temp--;
    starString.push("★");
  }
  starString = "<span style='color: #f9a602'>" + starString.join("") + "</span>";
  
  axios.get("https://api.themoviedb.org/3/find/" + imdbMovieId, {
    params: {
      api_key: process.env.TMDB_API_KEY || "",
      external_source: "imdb_id"
    }
  }).then(function (response) {
    movieData = response.data.movie_results[0];
    let movieInfo = `
    <br>
    <center><h3>${movieData.title} ${starString}</h3></center><br>
    <br>
    <strong><em>Plot:</em></strong><br>
    ${movieData.overview}<br><br>
    <strong><em>Language:</em></strong><br>
    ${movieData.original_language}<br><br>
    `;
    caption = movieInfo + `<em>${caption}</em>`;
    let category = _.map(movieData.genre_ids, eachId => genreMap[eachId]).join(", ");
    let type = "";

    if (req.files.filetoupload.name) {
      let oldpath = req.files.filetoupload.path;
      type = req.files.filetoupload.name.split(".").slice(-1).toLowerCase();
      if (file_types.indexOf(type) < 0) {
        return res.status(403).render("error", {
          error: new Error("Only images and videos are allowed for upload!")
        });
      }
      var newpath = path.join(
        __dirname,
        `../public/feeds/${req.session.user.username}_${random_id}.${type}`
      );
      var final_location = `/feeds/${req.session.user.username}_${random_id}.${type}`;
  
      console.log(
        `${oldpath} - OldPath\n ${newpath} - Newpath\n ${final_location} - DiskLocation\n`
      );
      mv(oldpath, newpath, function(err) {
        console.log("moving files");
      });
    } else if(movieData.poster_url){
      final_location = `https://image.tmdb.org/t/p/w500${movieData.poster_path}`;
      type = final_location.split(".").slice(-1);
    } else {
      final_location = null;
    }
    db.findOne({ id: req.session.user.id }).exec((err, u) => {
      u.posts.push({
        _id: random_id,
        title,
        author: req.session.user,
        authorID: req.session.user.id,
        static_url: final_location,
        caption,
        category: category,
        star,
        comments: [],
        likes: [],
        type: type,
        createdAt: new Date(),
        lastEditedAt: new Date()
      });
      u.save(err => {
        if (err) throw err;
        console.log("Post saved");
        res.redirect("/");
      });
    });
  })
});

module.exports = router;
