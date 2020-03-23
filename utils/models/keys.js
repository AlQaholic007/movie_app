var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
mongoose.connect(require("../../config/app").db.connectionUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var keySchema = mongoose.Schema({
  apiKey: String, 
  invokes: Number, 
  stats: Array 
});

module.exports = mongoose.model("key", keySchema);
