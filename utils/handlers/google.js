const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../models/user");

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  return done(null, {});
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || " ",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || " ",
      callbackURL:
        process.env.GOOGLE_REDIRECT ||
        "http://localhost:8080/account/google/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOne({ id: profile.id }).exec((err, dbUser) => {
        if (dbUser) {
          return cb(null, dbUser);
        } else {
          userCreate();
        }
        function userCreate() {
          console.log("New user!");
          profile.access_token = accessToken;
          var newUser = new User({
            id: profile.id,
            username: profile.emails[0].value.split("@").slice(0,-1).join(""),
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
            name: profile.displayName,
            createdAt: Date.now(),
            accessToken: accessToken,
            refreshToken: refreshToken,
            notifications: [],
            watchList: [],
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            chatRooms: {},
            posts: []
          });
          console.log(newUser);
          newUser.save((err, done) => {
            if (err) return cb(err);
            if (done) return cb(null, done);
          });
        }
      });
    }
  )
);
