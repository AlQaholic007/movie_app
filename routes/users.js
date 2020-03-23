var express = require("express");
var router = express.Router();
var path = require("path");
var User = require("../utils/models/user");
var textParser = require("../utils/text-parser");
var formParser = require("../utils/form-parser");

/* GET users listing. */
router.get("/", function(req, res, next) {
  User.find({}).exec((err, users) => {
    res.render("user/list", {
      title: req.app.conf.name,
      users
    });
  });
});

router.get("/@:username", function(req, res, next) {
  User.findOne({ username: req.params.username }, (err, user) => {
    console.log(user);
    if (!user) return res.status(404).send("No user found");
      res.render("user/profile", {
        title: req.app.conf.name,
        u: user,
        userId: req.session._id
      });
  });
});
module.exports = router;
