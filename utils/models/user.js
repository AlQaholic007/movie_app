var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");

var userSchema = mongoose.Schema({
  username: String,
  accessToken: String,
  refreshToken: String,
  username: String,
  firstName: String,
  lastName: String,
  id: String,
  posts: Array,
  email: String,
  profilePicture: String,
  name: String,
  watchList: Array,
  notifications: Array,
  createdAt: String,
  chatRooms: { type: mongoose.Schema.Types.Mixed, default: {} }
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model("user", userSchema);

// create the model for users and expose it to our app
