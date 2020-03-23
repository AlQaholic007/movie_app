module.exports = {
  apps: [
    {
      name: "movie_app",
      script: "./bin/www",
      instances: 2,
      mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ],
  deploy: {
    production: {
      user: "node",
      host: "movie_app.net",
      ref: "origin/master",
      repo: "git@github.com:repo.git"
    }
  }
};
