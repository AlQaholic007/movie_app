(function() {
  var page = 1;
  var finished;
  var running;
  var lastSorted = "movies";
  $(".sort-btn").on("click", function() {
    $(".sort-btn").removeClass("active");
    $(this).addClass("active");
    lastSorted = $(this)
      .text()
      .toLowerCase().trim();
    finished = false;
    $("#posts").html("");
    getPosts(1, lastSorted);
  });
  function load(loaded) {
    $("#loader").remove();
    if (!loaded) {
      $("#posts").append(
        '<div id="loader" class="col-md-12 text-center"><br><br><img src="/images/logo.gif" width="200px"></div>'
      );
    }
  }
  function getPosts(page = 1, sort = lastSorted) {
    if (running) return;
    load();
    if (finished) return load(true);
    if (page == 1) var method = "prepend";
    else var method = "append";
    running = true;
    if (sort === "feed") {
      $.ajax(`/api/v1/posts?page=${page}`).done(function (posts) {
        running = false;
        posts.reverse();
        if (posts.length == 0 && page == 1) {
          finished = true;
          $("#posts").append(`
          <div class="alert alert-dismissible alert-success">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>Well done!</strong> You are all up to date!
          </div>`);
        } else if (posts.length == 0 && page > 1) {
          load(true);
          return $(window).off("scroll");
        }
        posts.forEach(p =>
          $("#posts")[method]($.parseHTML(`<div class="gram-card">
          <div class="gram-card-header">
            <img src="${p.author.profilePicture}?cache=${Math.random()}" class="gram-card-user-image lozad">
            <a class="gram-card-user-name" href="/u/@${p.author.username}">${p.author.username}</a>
        
            <div class="dropdown gram-card-time">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> 
                <i class="glyphicon glyphicon-option-vertical"></i>
              </a>
              <ul class="dropdown-menu dropdown-menu-right">
                ${p.post.static_url != undefined ? "<li><a href=" + p.post.static_url + '><i class="fa fa-share"></i> View</a></li>' : ""}
                ${p.owner ? `<li><a href="/me/post/${p.post._id}"><i class="fa fa-cog"></i> Edit</a></li>
                             <li><a href="/me/post/delete/${p.post._id}"><i class="fa fa-trash"></i> Delete</a></li>
                            `
              : ""
            }
              </ul>
            </div>
            <div class="time">${p.post.timeago}</div>
          </div>
          <br>
          <br>
          <div class="gram-card-image">
            ${p.post.static_url ? `${
              p.post.type == "png" ||
                p.post.type == "jpg" ||
                p.post.type == "jpeg"
                ? `
                                    <center>
                                      <a href="${p.post.static_url}" class="progressive replace">
                                          <img author="${p.author.id}" src="" id="${p.post._id}" class="post img-responsive lozad preview">
                                      </a>    
                                    </center>    
                                      `
                : `
                                    <center>
                                      <video author="${p.author.id}" src="${p.post.static_url}" id="${p.post._id}" class="post img-responsive" controls></video>
                                    </center>
                                      `
              }`
              : ""
            }
          </div>
          <div class="gram-card-content">
            <p>
              ${p.post.caption}
                <br>
                <span class="label label-info">
                  ${p.post.category ? p.post.category : "Unknown"}
                </span>
              </p>
              <p class="comments">${p.post.comments.length} comment(s).</p>
              <br>
        
              <div class="comments-div" id="comments-${p.post._id}">
                ${p.post.comments.map(c => `<a class="user-comment" href="/u/@${c.by}">${c.by}</a>${c.text}<br>`).join("")}
              </div>
              <hr>
          </div>
        
          <div class="gram-card-footer">
            <button data="${JSON.stringify(p.post.likes)}" style="color: ${p.post.likes.find(x => x == $("#posts").attr("user-id")) ? "grey" : "#f0b917"}" class="footer-action-icons likes btn btn-link non-hoverable like-button-box" author="${p.author.id}" id="${p.post._id}-like">
                <i class="glyphicon glyphicon-thumbs-up"></i> ${p.post.likes.length}
            </button>
            <input id="${p.post._id}" class="comments-input comment-input-box" author="${p.authorID}" type="text" id="comment" placeholder="Click enter to comment here..."/>
          </div>
        </div>`)));
        load(true);
        $(window).on("scroll", function () {
          if (finished == true) return $(window).off(this);
          if ($(document).height() - $(document).scrollTop() < 1369) {
            page++;
            getPosts(page);
          }
        });
        $(".like-button-box").off("click");
        $(".like-button-box").on("click", likeById);
  
        function likeById() {
          const elem = this;
          var author = $(`#${this.id}`).attr("author");
          $.ajax({
            method: "POST",
            url: "/api/v1/like?cache=" + Math.random(),
            data: {
              _id: this.id.toString().split("-like")[0],
              author: author
            }
          })
            .done(function (data) {
              if (data.event) {
                $(elem).html(
                  $(elem)
                    .html()
                    .split("</i>")[0] +
                  "</i> " +
                  data.amount
                );
                $(elem).css("color", data.msg != "Liked!" ? "#f0b917" : "grey");
                show_notification(data.msg, "success");
              } else {
                show_notification(data.msg, "danger");
              }
            })
            .fail(function (data) {
              show_notification("Some error while liking the feed", "danger");
            });
        }
        $(".comment-input-box").off("keydown");
        $(".comment-input-box").on("keydown", commentById);
  
        function commentById(key) {
          if (!this.value) return;
          else if (key.keyCode == 13) {
            var el = this;
            $.ajax({
              method: "POST",
              url: "/api/v1/comment",
              data: {
                _id: this.id,
                author: $(`#${this.id}`).attr("author"),
                text: this.value
              }
            })
              .done(function (data) {
                $(
                  "#comments-" + el.id
                ).append(`<a class="user-comment" href="/u/@${data.by}">
                ${data.by}
            </a> ${el.value}<br>`);
                el.value = "";
                show_notification("Comment added!", "success");
              })
              .fail(function (data) {
                show_notification(
                  "Some error while posting the comment.",
                  "danger"
                );
              });
          }
        }
      });
    } else if(sort === "movies") {
      $.ajax({
        "method": "GET",
        "url": "/api/v1/movies/news"
      }).done(function (posts) {
        running = false;
        if (posts.articles.length == 0) {
        finished = true;
        $("#posts").append(`
        <div class="alert alert-dismissible alert-success">
          <button type="button" class="close" data-dismiss="alert">&times;</button>
          <strong>Well done!</strong> You are all up to date!
        </div>`);
        }
        posts.articles.forEach(p =>
          $("#posts")[method](`<div class="gram-card">
          <div class="gram-card-header">
            <a class="gram-card-user-name" href="${p.url}">${p.author || ""}</a>
        
            <div class="dropdown gram-card-time">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> 
                <i class="glyphicon glyphicon-option-vertical"></i>
              </a>
              <ul class="dropdown-menu dropdown-menu-right">
                ${'<a href="' + p.url + '><i class="fa fa-share"></i> View</a></li>'}
              </ul>
            </div>
            <div class="time">${(new Date(p.publishedAt)).toString().split(" ").slice(0,5).join(" ")}</div>
          </div>
          <br>
          <br>
          ${p.urlToImage ? 
            `
            <div class="gram-card-image">
            <center>
            <img author="${p.author}" src="${p.urlToImage}" width="100%" id="${Date.now()}">
            </center>
            </div>
            ` : ""
          }   
          <div class="gram-card-content">
            <p>
              <a class="gram-card-content-user" href="${p.url}">
                ${p.title}
              </a>
              ${p.description}
                <span class="label label-info">
                  ${p.source.name ? p.source.name : "Unknown"}
                </span>
              </p>
              <hr>
          </div>
        </div>`));
        load(true);
      })
    } else {
      $('#posts').before(`
      <div class="alert alert-dismissible alert-success">
        <form id="filterForm">
          <input type="text" id="query" name="query" placeholder="Search something...">
          <select name="genre" id="genre">
            <option value="default" selected>By Genre<option>
            <option value="28">Action</option>
            <option value="12">Adventure</option>
            <option value="16">Animation</option>
            <option value="35">Comedy</option>
            <option value="80">Crime</option>
            <option value="99">Documentary</option>
            <option value="Drama">Drama</option>
            <option value="10751">Family</option>
            <option value="14">Fantasy</option>
            <option value="36">History</option>
            <option value="27">Horror</option>
            <option value="10402">Music</option>
            <option value="9648">Mystery</option>
            <option value="10749">Romance</option>
            <option value="878">Sci-Fi</option>
            <option value="53">Thriller</option>
            <option value="10752">War</option>
          </select>
          <select name="language" id="language">
            <option value="default" selected>By Language<option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
          <select name="sortyBy" id="sortBy">
            <option value="default" selected>Sort By<option>
            <option value="popularity.desc">Highest Rated</option>
            <option value="vote_count.desc">Most Voted</option>
            <option value="revenue.desc">Highest Grossing</option>
          </select>
        </form>
      </div>
      `)
      let genre = $('#genre').val() === "default" ? "" : $('#genre').val();
      let language = $('#language').val() === "default" ? "" : $('#language').val();
      let sortBy = $('#sortBy').val() === "default" ? "" : $('#sortBy').val();

      $.ajax({
        "method": "GET",
        "url": "/api/v1/movies/search",
        "data": {
          query: "",
          genre,
          language, 
          sortBy,
          page
        }
      }).done(function (response) {
        let genreMap = {
          "28": "Action",
          "12": "Adventure",
          "16": "Animation",
          "35": "Comedy",
          "80": "Crime",
          "99": "Documentary",
          "18": "Drama",
          "10751": "Family",
          "14": "Fantasy",
          "36": "History",
          "27": "Horror",
          "10402": "Music",
          "9648": "Mystery",
          "10749": "Romance",
          "878": "Science Fiction",
          "10770": "TV Movie",
          "53": "Thriller",
          "10752": "War",
          "37": "Western"
        }
        maxPageCount = response.total_pages;
        running = false;
        posts = response.results;
        if (page > maxPageCount) {
          finished = true;
          $("#posts").append(`
          <div class="alert alert-dismissible alert-success">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <strong>Well done!</strong> You are all up to date!
          </div>`);
        } else if (posts.length == 0 && page > 1) {
          load(true);
          return $(window).off("scroll");
        }
        posts.forEach(p =>
        {
          p.poster_path = "https://image.tmdb.org/t/p/w500" + p.poster_path;
          p.genre_ids = p.genre_ids.map(eachGenreId => genreMap[eachGenreId]).join(", ");
            $("#posts")[method](`<div class="gram-card">
            <div class="gram-card-header">
              <a class="gram-card-user-name">${p.title}</a>
          
              <div class="dropdown gram-card-time">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> 
                  <i class="glyphicon glyphicon-option-vertical"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-right">
                  ${p.poster_path != undefined ? "<li><a href=" + p.poster_path + '><i class="fa fa-share"></i> View</a></li>' : ""}
                </ul>
              </div>
              <div class="time">${p.release_date}</div>
            </div>
            <br>
            <br>
            <div class="gram-card-image fav-box" id="${"fav-" + p.id}">
              ${p.poster_path ? `${
                                      `<center>
                                            <img src="${p.poster_path}" width="100%"> 
                                      </center>    
                                      `
                }`
                : ""
              }
            </div>
            <div class="gram-card-content">
              <p>
                ${p.overview}
                  <span class="label label-info">
                    ${p.genre_ids}
                  </span>
                </p>
                <p class="comments">${Math.round(p.vote_average)} <span style="color: #f9a602">★<span>
                <button style="color: ${response.likes.find(x => x.id == p.id) ? "red" : "grey"}" class="footer-action-icons likes btn btn-link non-hoverable favorite-button-box" id="${p.id}">
                  <i class="glyphicon glyphicon-heart"></i>
                </button>
                </p>
                <br>
                <hr>
            </div>
          </div>`)
          }
        );
        load(true);
        $(window).on("scroll", function () {
          if (finished)
            return $(window).off(this);
          if ($(document).height() - $(document).scrollTop < 1369) {
            page++;
            getPost(page, "discover");
          }
        });
        $(".favorite-button-box").off("click");
        $(".favorite-button-box").on("click", favoriteById);
        $(".fav-box").off("click");
        $(".fav-box").on("click", toggleFav);


        let touchTime = 0;
        let lastClickedId = "not clicked yet";
        function toggleFav() {
          if(touchTime == 0) {
            touchTime = Date.now();
            lastClickedId = this.id;
          } else {
            if((Date.now() - touchTime) < 750 && lastClickedId == this.id) {
              touchTime = 0;
              lastClickedId = "not clicked yet";
              let movieId = this.id.split("-")[1]
              $.ajax({
                method: "POST",
                url: "/api/v1/favorite/add?cache=" + Math.random(),
                data: {
                  movieId
                }
              })
                .done(function (data) {
                  if (data.event) {
                    let heartButton = $(`#${movieId}`);
                    let newColor = (heartButton.css("color") == "red") ? "grey" : "red";
                    heartButton.css("color", newColor) 
                    show_notification(data.msg, "success");
                  } else {
                    show_notification(data.msg, "danger");
                  }
                })
                .fail(function (data) {
                  show_notification("Some error while removing from watch list", "danger");
                });
            } else {
              touchTime = Date.now();
              lastClickedId = this.id;
            }
          }
        }
        function favoriteById() {
          const elem = this;
          $.ajax({
            method: "POST",
            url: "/api/v1/favorite/add?cache=" + Math.random(),
            data: {
              movieId: this.id
            }
          })
            .done(function (data) {
              if (data.event) {
                $(elem).css("color", data.msg == "Added to watch list" ? "red" : "grey");
                show_notification(data.msg, "success");
              } else {
                show_notification(data.msg, "danger");
              }
            })
            .fail(function (data) {
              show_notification("Some error while adding movie to watch list", "danger");
            });
        }
      })
      let searchInput = $('#query');
      let filterForm = $('#filterForm');
      filterForm.on('change', function (event) {
        if (true) {
          event.preventDefault();
          $("#posts").html("");
          let query = searchInput.val(),
            genre = $('#genre').val() === "default" ? "" : $('#genre').val(),
            language = $('#language').val() === "default" ? "" : $('#language').val(),
            sortBy = $('#sortBy').val() === "default" ? "" : $('#sortBy').val();
          
          $.ajax({
            "method": "GET",
            "url": "/api/v1/movies/search",
            "data": {
              query,
              genre,
              language, 
              sortBy,
              page
            }
          }).done(function (response) {
            let genreMap = {
              "28": "Action",
              "12": "Adventure",
              "16": "Animation",
              "35": "Comedy",
              "80": "Crime",
              "99": "Documentary",
              "18": "Drama",
              "10751": "Family",
              "14": "Fantasy",
              "36": "History",
              "27": "Horror",
              "10402": "Music",
              "9648": "Mystery",
              "10749": "Romance",
              "878": "Science Fiction",
              "10770": "TV Movie",
              "53": "Thriller",
              "10752": "War",
              "37": "Western"
            }
            maxPageCount = response.total_pages;
            running = false;
            posts = response.results;
            if (page > maxPageCount) {
              finished = true;
              $("#posts").append(`
              <div class="alert alert-dismissible alert-success">
                <button type="button" class="close" data-dismiss="alert">&times;</button>
                <strong>Well done!</strong> You are all up to date!
              </div>`);
            } else if (posts.length == 0 && page > 1) {
              load(true);
              return $(window).off("scroll");
            }
            posts.forEach(p =>
            {
              p.poster_path = "https://image.tmdb.org/t/p/w500" + p.poster_path;
              p.genre_ids = p.genre_ids.map(eachGenreId => genreMap[eachGenreId]).join(", ");
                $("#posts")[method](`<div class="gram-card">
                <div class="gram-card-header">
                  <a class="gram-card-user-name">${p.title}</a>
              
                  <div class="dropdown gram-card-time">
                    <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> 
                      <i class="glyphicon glyphicon-option-vertical"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-right">
                      ${p.poster_path != undefined ? "<li><a href=" + p.poster_path + '><i class="fa fa-share"></i> View</a></li>' : ""}
                    </ul>
                  </div>
                  <div class="time">${p.release_date}</div>
                </div>
                <br>
                <br>
                <div class="gram-card-image fav-box" id="${"fav-"+p.id}">
                  ${p.poster_path ? `${
                                          `<center>
                                                <img src="${p.poster_path}" width="100%"> 
                                          </center>    
                                          `
                    }`
                    : ""
                  }
                </div>
                <div class="gram-card-content">
                  <p>
                    ${p.overview}
                      <span class="label label-info">
                        ${p.genre_ids}
                      </span>
                    </p>
                    <p class="comments">${Math.round(p.vote_average)} <span style="color: #f9a602">★</span>
                    <button style="color: ${response.likes.find(x => x.id == p.id) ? "red" : "grey"}" class="footer-action-icons likes btn btn-link non-hoverable favorite-button-box" id="${p.id}">
                      <i class="glyphicon glyphicon-heart"></i>
                    </button>
                    </p>
                    <br>
                    <hr>
                </div>
              </div>`)
              }
            );
            load(true);
            $(window).on("scroll", function () {
              if (finished)
                return $(window).off(this);
              if ($(document).height() - $(document).scrollTop < 1369) {
                page++;
                getPost(page, "discover");
              }
            });
            $(".favorite-button-box").off("click");
            $(".favorite-button-box").on("click", favoriteById);
            $(".fav-box").off("click");
            $(".fav-box").on("click", toggleFav);
  
            function favoriteById() {
              const elem = this;
              $.ajax({
                method: "POST",
                url: "/api/v1/favorite/add?cache=" + Math.random(),
                data: {
                  movieId: this.id
                }
              })
                .done(function (data) {
                  if (data.event) {
                    $(elem).css("color", data.msg == "Added to watch list" ? "red" : "grey");
                    show_notification(data.msg, "success");
                  } else {
                    show_notification(data.msg, "danger");
                  }
                })
                .fail(function (data) {
                  show_notification("Some error while adding movie to watch list", "danger");                
                });
            }
            let touchTime = 0;
            let lastClickedId = "not clicked yet";
            function toggleFav() {
              if(touchTime == 0) {
                touchTime = Date.now();
                lastClickedId = this.id;
              } else {
                if((Date.now() - touchTime) < 750 && lastClickedId == event.target.id) {
                  touchTime = 0;
                  lastClickedId = "not clicked yet";
                  let movieId = this.id.split("-")[1]
                  $.ajax({
                    method: "POST",
                    url: "/api/v1/favorite/add?cache=" + Math.random(),
                    data: {
                      movieId
                    }
                  })
                    .done(function (data) {
                      if (data.event) {
                        let heartButton = $(`#${movieId}`);
                        let newColor = (heartButton.css("color") == "red") ? "grey" : "red";
                        heartButton.css("color", newColor); 
                        show_notification(data.msg, "success");
                      } else {
                        show_notification(data.msg, "danger");
                      }
                    })
                    .fail(function (data) {
                      show_notification("Some error while removing from watch list", "danger");
                    });
                } else {
                  touchTime = Date.now();
                  lastClickedId = this.id;
                }
              }
            }
          })
        }
      })
    }
  }
  getPosts();
})();
