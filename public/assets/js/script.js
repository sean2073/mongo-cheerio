$(document).ready(function() {

  $('#saveArticle-btn').click(function(e) {
		e.preventDefault();
    console.log("the save article button was pressed");
    var title = $(this).attr("titleName");
    var link = $(this).attr("linkName") ;
    console.log("title = " + title);
    console.log("link = " + link);
    $.ajax({
				method: "POST",
				url: "/articles" ,
				data: {
					title: title,
					link: link
				}
			})
			.done(function(data) {
        //remove from scraped-articles
        $('#title').empty();
        $('#link').empty();
        //add to saved-articles
        $('#saved-title').append("<h3>" + title + "</h3>");

        $('#saved-link').append("<a href='link'> " + link);

          console.log("should save " + link + "and " + title);
			});
		return false;

  });
});// end document
