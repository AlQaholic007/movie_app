var express = require("express");
var router = express.Router();
var db = require("../utils/handlers/user");
var formParser = require("../utils/form-parser.js");
var passport = require("passport");

var User = require("../utils/models/user");

//PS: Passport stuff to be done below...
router.get("/google", passport.authenticate("google", { scope: ["https://www.googleapis.com/auth/plus.login", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/err" }),
  function(req, res) {
    // Successful authentication, redirect home.
    req.session.user = req.session.passport.user;
    res.redirect(
      "/?logged-in=" +
        Math.random()
          .toString()
          .slice(2)
          .slice(0, 5)
    );
  }
);

router.get("/out", function(req, res, next) {
  req.session.destroy(() => {
    res.redirect("/?action=logout");
  });
});

module.exports = router;
