// utils/handlers/user.js
var mongoose = require("mongoose");
var User = require("../models/user");
var bcrypt = require("bcrypt-nodejs");
const a = require("array-tools");
const _ = require("lodash/_arrayIncludes");

mongoose.connect(require("../../config/app").db.connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

function checkSpace(name) {
  var charSplit = name.split("");
  return _(charSplit, " ");
}

function createNew(obj, cb) {
  if (checkSpace(obj.username)) {
    return cb(null, false);
  } else {
    User.findOne({ username: obj.username }).exec((err, user) => {
      if (user) {
        return cb(null, false);
      } else {
        var bio = `Hey there! I'm ${obj.fn} ;)! Wish me on ${obj.day} ${obj.month}`;
        var dob = obj.day + " " + obj.month + " " + obj.year;
        var newUser = new User({
          username: obj.username,
          firstname: obj.fn,
          lastname: obj.ln,
          dob: dob,
          bio: bio,
          profile_pic: "/images/logo/logo.png",
          posts: [],
          followers: [],
          lastLogin: new Date()
        });
        newUser.password = newUser.generateHash(obj.password);
        newUser.save((err, res) => {
          return cb(err, res);
        });
      }
    });
  }
}

function checkUser(obj, cb) {
  User.findOne({ username: obj.username }).exec((err, user) => {
    console.log(user);
    if (err) return cb(err, false);
    if (user) {
      bcrypt.compare(obj.password, user.password, (err, bool) => {
        if (bool) {
          return cb(null, user);
        } else {
          return cb(null, false);
        }
      });
    } else {
      return cb(null, false);
    }
  });
}

function findOne(obj, cb) {
  User.findOne(obj).exec((err, user) => {
    if (err) return cb(err, false);
    if (user) {
      return cb(err, user);
    } else {
      return cb(null, false);
    }
  });
}

function search(opt, cb) {
  User.find({ username: { $gt: opt } }).exec((err, results) => {
    if (err) return cb(err, false);
    if (results) {
      return cb(err, results);
    } else {
      return cb(null, false);
    }
  });
}

function getAll(cb) {
  User.find({}).exec((err, users) => {
    if (err) return cb(err, false);
    if (users) {
      return cb(null, users);
    } else {
      return cb(null, false);
    }
  });
}

function deleteOne(opt, cb) {
  User.deleteOne(opt).exec((err, res) => {
    if (err) return cb(err, null);
    else if (res.n == 0) {
      return cb(null, true);
    }
  });
}

function comment(user, comment, post_id, cb) {
  User.findOne(user).exec((err, obj) => {
    if (!obj) {
      return cb("Does not exist.", null);
    }
    console.log(obj);
    for (var i = 0; i < obj.posts.length; i++) {
      if (obj.posts[i]._id === post_id) {
        obj.posts[i].comments.push(comment);
        obj.notifications.push({
          id: Math.random(),
          msg: `@${comment.by} reacted to your post.`,
          link: `/u/@${comment.by}`,
          time: new Date()
        });
        obj.save((err, res) => {
          if (err) {
            return (err, null);
          }
          return cb(null, res);
        });
      }
    }
  });
}

function like(user, like, _id, cb) {
  User.findOne(user).exec((err, obj) => {
    let liked;
    let post = obj.posts.find(x => x._id === _id);
    if (post.likes.find(x => x === like.by)) {
      post.likes.splice(post.likes.indexOf(like.by), 1);
    } else {
      liked = true;
      post.likes.push(like.by);
      obj.notifications.push({
        id: Math.random(),
        msg: `@${like.username} liked your post.`,
        link: `/u/@${obj.username}`,
        time: new Date()
      });
    }
    obj = new User(obj);
    obj.save(err => {
      cb(err, true, post.likes.length, liked);
    });
  });
}

module.exports = {
  createNew: createNew,
  checkUser: checkUser,
  findOne: findOne,
  getAll: getAll,
  comment: comment,
  like: like,
  search: search
};
