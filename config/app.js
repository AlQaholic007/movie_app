require("dotenv").config();
var dbHost = process.env.dbHost || "localhost";
module.exports = {
  name: "movie-app",
  title: "movie-app",
  http: {
    host: "localhost",
    port: 8080
  },
  author: "Soham Parekh",
  version: "1.0.0",
  db: {
    connectionUri: process.env.DB_CONNECTION_URI || ("mongodb://" + dbHost + ":27017/movie_app"),
    params: {},
    collections: ["moment", "user", "feeling", "ask"]
  }
};
