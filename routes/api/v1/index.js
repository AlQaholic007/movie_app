require("dotenv").config();
var express = require("express");
var router = express.Router();
var path = require("path");
const fetch = require("request");
var db = require("../../../utils/handlers/user");
var User = require("../../../utils/models/user");
var ta = require("time-ago");
const Fuse = require("fuse.js");
const q = require("queue")({ autostart: true });
const axios = require("axios");
const queryString = require("query-string");
const AxiosLogger = require("axios-logger");
const _ = require("underscore");
axios.interceptors.request.use(AxiosLogger.requestLogger);

router.use(function(req, res, next) {
  q.push(async function() {
    next();
  });
});

router.use(function(req, res, next) {
  const date = new Date();
  const sessionDate = new Date(req.session.lastApi);
  if (sessionDate) {
    if (date - sessionDate < 2000) {
      setTimeout(function() {
        next();
        req.session.lastApi = date;
      }, 1000);
    } else {
      next();
      req.session.lastApi = date;
    }
  } else {
    req.session.lastApi = date;
    next();
  }
});

router.get("/threat", (req, res, next) => {
  if (req.params.key == process.env.API_KEY) {
    res.json({ success: true });
    return process.exit(0);
  } else {
    res.json({ success: false, error: "Invalid API Key" });
  }
});

router.get("/v1/posts", function(req, res) {
  if (!req.session.user) res.sendStatus(404);
  let page = req.query.page || 1;
  db.findOne({ id: req.session.user.id }, function(err, user) {
    db.getAll(function(err, results) {
      if (err) res.status(500).send(err);
      let posts = [];
      results.forEach(function(res) {
        res.access_token = null;
        res.posts.forEach(post => {
          post.timeago = ta.ago(post.createdAt);
          posts.push({
            author: res,
            post,
            owner: res.id == req.session.user.id ? true : false
          });
        });
      });
      posts.sort(
        (one, two) =>
          new Date(two.post.createdAt) - new Date(one.post.createdAt)
      );
      posts = posts.slice(
        page == 1 ? 0 : 10 * (page - 1),
        page == 1 ? 10 : undefined
      );
      res.status(200).send(posts);
      user.save();
    });
  });
});

router.post("/v1/comment", function(req, res, next) {
  if (!req.session.user) {
    res.status(404).send("Unauthorized");
  } 
  db.comment(
    { id: req.body.author },
    { by: req.session.user.username, text: req.body.text },
    req.body._id,
    (err, result) => {
      if (err || !result) {
        console.log(err);
        res.json(false);
      } else {
        res.json({ by: req.session.user.username });
      }
    }
  );
});

router.post("/v1/like", function(req, res, next) {
  if (!req.session.user) res.status(404).send("Unauthorized");
  console.log(req.body);
  db.like(
    { id: req.body.author },
    { by: req.session.user.id, username: req.session.user.username },
    req.body._id,
    (err, result, amount, liked) => {
      if (result) {
        res.send({ event: true, msg: liked ? "Liked!" : "Unliked!", amount });
        //	console.log(result)
      } else {
        res.send({ event: false, msg: "Already liked." });
      }
    }
  );
});

router.post("/v1/favorite/add", function (req, res, next) {
  if (!req.session.user) res.status(404).send("Unauthorized");
  let movieId = req.body.movieId
  var msg = "";
  User.findOne({ id: req.session.user.id }).exec((err, reqUser) => {
    if (_.find(reqUser.watchList, eachMovie => eachMovie.id == movieId)) {
      msg = "Removed from watch list"
      reqUser.watchList = _.reject(reqUser.watchList, eachMovie => eachMovie.id == movieId);
      reqUser.save((err, savedReqUser) => {
        if (savedReqUser) {
          console.log(savedReqUser.watchList);
          res.send({ event: true, msg});
        } else {
          res.send({ event: false, msg: "Already in watch list." });
        }
      })
    } else {
      axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
        params: {
          api_key: process.env.TMDB_API_KEY || ""
        }
      }).then(response => {
        let movieData = _.pick(response.data, "id", "title", "release_date", "poster_path", "overview", "vote_average");
        movieData.genre = _.map(response.data.genres, eachGenre => eachGenre.name).join(" ");

        msg = "Added to watch list"
        reqUser.watchList.push(movieData);
        reqUser.save((err, savedReqUser) => {
          if (savedReqUser) {
            console.log(savedReqUser.watchList);
            res.send({ event: true, msg});
          } else {
            res.send({ event: false, msg: "Already in watch list." });
          }
        })
      }).catch(error => {
        console.log(error);
      });
    }
  })
})

router.get("/v1/search", function(req, res, next) {
  var options = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["username", "name"]
  };
  User.find({}, function(err, users) {
    var fuse = new Fuse(users, options);
    if (!req.query || !req.query.q) {
      return res.send(users);
    }
    let searched = fuse.search(req.query.q);
    return res.send(searched);
  });
});

router.get("/v1/notifications", function(req, res, next) {
  User.findOne({ _id: req.session.user._id }).exec((err, userData) => {
    if (userData) {
      res.send(new String(userData.notifications.length));
    }
  });
});

router.post("/v1/notifications/markAsRead", function(req, res, next) {
  User.findOne({ _id: req.session.user._id }).exec((err, userData) => {
    userData.notifications = [];
    userData.save((err, response) => {
      res.redirect("/me/activity");
    });
  });
});

router.get("/v1/movies/search", function (req, res, next) {
  let { query, genre, language, sortBy, page } = req.query;

  if (!query) {
    let params = {
      "api_key": process.env.TMDB_API_KEY,
      "with_genres": genre,
      "sort_by": sortBy || "popularity.desc",
      "with_original_language": language || "",
      "page": page || 1
    };
    console.log(queryString.stringify(params));
    axios.get("https://api.themoviedb.org/3/discover/movie", {
        params
    }).then((response) => {
        response.data.likes = req.session.user.watchList;
        res.status(200).send(response.data);
      }).catch((error) => {
        console.log(error);
      })
  } else {
    axios.get("https://api.themoviedb.org/3/search/movie", {
      params: {
        "api_key": process.env.TMDB_API_KEY || "",
        "language": language,
        "query": query,
        "page": page || 1
      }
    }).then((response) => {
      response.data.likes = req.session.user.watchList;
      res.status(200).send(response.data);
    }).catch((error) => {
      console.log(error);
    })
  }
})

router.get("/v1/movies/check", function (req, res, next) {
  let imdbMovieId = req.query.imdbMovieId;
  axios.get(`https://api.themoviedb.org/3/find/${imdbMovieId}`, {
    params: {
      api_key: process.env.TMDB_API_KEY || "",
      external_source: "imdb_id"
    }
  }).then(response => {
    res.json(response.data);
  }).catch(error => {
    console.log(error);
  })
})

router.get("/v1/movies/news", function (req, res, next) {
  axios.get("http://newsapi.org/v2/everything", {
    params: {
      q: "movie",
      apiKey: process.env.NEWSAPI_KEY || "",
      language: "en",
      pageSize: 100,
      sortBy: "publishedAt"
    }
  }).then(response => {
    res.send(response.data)
  }).catch(error => {
    console.log(error);
  })
})

module.exports = router;
