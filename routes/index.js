var express = require("express");
var router = express.Router();
var user = require("../utils/handlers/user");
var array_tools = require("array-tools");

router.get("/", function(req, res, next) {
  if (req.session.user) {
    user.getAll((err, users) => {
      user.findOne({ id: req.session.user.id }, (error, req_user) => {
        res.render("index", {
          user: req_user,
          title: req.app.conf.name,
          people: users
        });
      });
    });
  } else {
    res.render("land", {
      title: req.app.conf.name,
      error: false
    });
  }
});

module.exports = router;
