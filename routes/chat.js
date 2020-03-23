var express = require("express");
var router = express.Router();
var db = require("../utils/handlers/user");
var formParser = require("../utils/form-parser");
var mongoose = require("mongoose");
var User = require("../utils/models/user");
var Room = require("../utils/models/room");

router.get("/", function(req, res, next) {
  User.find({}).exec((error, users) => {
    res.render("chat/index", {
      title: req.app.conf.name,
      users: users
    });
  });
});

router.get("/:userid", function(req, res, next) {
  if (req.session.user.id == req.params.userid)
    return res.render("error", {
      message: "Can't chat with yourself...",
      error: {
        status: 400,
        stack: "Can't chat with yourself."
      }
    });
  require("../utils/handlers/socket");
  User.findOne({ id: req.params.userid }).exec((error, chatUser) => {
    if (!chatUser) return res.status(404).send("No user found!");
    req.session.socket = {};
    let chatRoomId = req.session.user.chatRooms[chatUser.id];
    if (chatRoomId) {
      Room.findOne({ id: chatRoomId }).exec((err, chatRoom) => {
        req.session.socket.room = chatRoomId,
          res.render("chat/room", {
            title: req.app.conf.name,
            room: chatRoom,
            session: req.session.user,
            reciever: chatUser
        })
      })
    } else {
      let newChatRoom = new Room({
        id: guid.raw(),
        users: [chatUser.id, req.session.user.id],
        chats: []
      });

      newChatRoom.save((err, newChatRoom) => {
        chatUser.chats[req.session.user.id] = newChatRoom.id;
        chatUser.markModified("chatRooms");
        chatUser.save((err, savedChatUser) => {
          User.findOne({ id: req.session.user.id }).exec((err, reqUser) => {
            reqUser.chats[savedChatUser.id] = newChatRoom.id;
            reqUser.markModified("chatRooms");
            reqUser.save((err, savedReqUser) => {
              res.render("chat/room", {
                title: req.app.conf.name,
                room: newChatRoom,
                session: req.session.user,
                reciever: savedChatUser
              })
            })
          })
        })
      })
    }
  });
});

module.exports = router;
