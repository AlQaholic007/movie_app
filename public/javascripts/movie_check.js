$('#imdbMovieId').on("change", function () {
  let imdbMovieId = $('#imdbMovieId').val();
  $.ajax({
    method: "GET",
    url: `/api/v1/movies/check`,
    data: {
      imdbMovieId
    }
  }).done(function(data) {
    if (!data.movie_results.length) {
      show_notification('Invalid movie IMDB ID!', "danger");
    }
  });
});