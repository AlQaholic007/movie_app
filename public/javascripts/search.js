let lang = window.location.href.split("lang=")[1];
if (lang) {
  $("#search-box").val(lang);
  updateList(lang);
} else {
  updateList();
}
function updateList(query, type) {
  $("#searchLoad").css("display", "");
  $.ajax({
    method: "GET",
    url: "/api/v1/search",
    data: {
      q: query
    }
  })
    .done(function(data) {
      console.log(data);
      $("#user-list").text("");
      for (var i = 0; i < data.length; i++) {
        $("#user-list").append(`<li class="list-group-item">
               <img src="${data[i].profilePicture}" class="logo">
               <b><a href="/u/@${data[i].username}" id="list-username">  ${
          data[i].username
        }</a></b>
            </li>`);
      }
      $("#searchLoad").fadeOut();
    })
    .fail(function(data) {
      show_notification("Oops! Error: " + data.message, "danger");
      $("#searchLoad").fadeOut();
    });
}
