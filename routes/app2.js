var express = require('express');
var app = express.Router();
var path = require("path");
var app2 = express();
// Our scraping tools
var request = require('request');
var cheerio = require('cheerio');
// Requiring our Comment and Article models
var Comment = require("../models/Comment.js");
var Article = require("../models/Article.js");
//creates a global array to store all articles
var titlesArray = [];
app2.locals.titlesArray = titlesArray;
var articleArray = [];
app2.locals.articleArray = articleArray;
//index route that redirects to articles route
app.get('/', function(req, res) {
    res.render('index');
});

app.get('/scrape', function(req, res){
  // New York Times Business Page Latest News - Top 3 w Timestamp
  url = 'http://www.nytimes.com/pages/business/index.html?hpw&rref&action=click&pgtype=Homepage&module=well-region&region=bottom-well&WT.nav=bottom-well/';

  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

       $('.story').each(function(i,element){
            var result = {};
            result.title = $(this).children('p').text().trim();
            result.link = $(this).children().children('a').attr('href');
            //checks that an empty articles arent pulled
            if(result.title !=="" && result.link !== ""){
              console.log("title: " + result.title);
              console.log("link: "  + result.link);

              // checks for empty articles
              if(titlesArray.indexOf(result.title) == -1){
                //pushes result.title and result.link into titlesArray if not empty title

                  titlesArray.push({
                    		title: result.title,
                    		link: result.link
                    	});
                 console.log("The Titles Array Has " + titlesArray);
                  //checks if article is already in database
/*
                  Article.count({ title: result.title}, function (err, test){
                  if(test == 0){
                    var entry = new Article(result);
                    //save the artcle to the Mongo database
                    entry.save(function(err, doc){
                      //log any errors
                      if (err){
                        console.log(err);
                      }//close if(err)
                      else{
                        console.log(doc);
                      }//close else
                    })
                  }//close if (test==0)
              })
              */
            }
            else{
              console.log("Already have this article.");
            }//close else
       }
       else{
         console.log("Not saved to DB, missing data");
       }//close else
    });
    //redirect to the home page after scrapped
    //  res.redirect('/');
    // render handlebars
      res.render("scraped-articles", {titlesArray});

  }
});

//route to show all the articles scrapped stored in the Mongo database
app.get('/articles', function (req, res){
  //query the database to sort all entries from new to oldest
  Article.find().sort({_id: -1})
  //.populate("comment")
  //execute the articles to handlebars and render
  .exec(function(err, doc){
    if (err) {
      console.log(err);
      res.status(500).json({
					   success: false,
					   message: "Internal server error. Please try your request again."
    })
  }
    else
      //var artcl = {article: doc};
    //  res.render('index', artcl);
    articleArray.push({
        articleTitle: req.body.title,
        articleLink: req.body.link
        });
      res.render("saved-articles", {articleArray});

  });
});
app.post('/articles', function(req, res) {
  var title = req.body.title;
  var link = req.body.link;
  var comment = req.body.comment;
  console.log("Post method wants to save the following:");
  console.log("Title : " + title);
  console.log("Link : " + link);
  console.log("Comment : " + comment);
  var articleObj = {
    title: title,
    link: link,
    comment: comment
  };
  Article.count({title: title}, function (err, test){
      if(test == 0) {
        //save article to database
        var newArticle = new Article(articleObj);
        newArticle.save(function(err, doc) {
          if (err) {
              console.log(err);
          } else {

              console.log("saved article");
              articleArray.push({
                  articleTitle: title,
                  articleLink: link
                  });
                  res.render('saved-articles', {articleArray});
                }

        });//newArticle
      }// close it test
      else {
        //alert("This article has already been saved");
        console.log("This article has already been saved " + title);
      }

  });//close article.count
});//close app.post
});
//




/*


router.get("/articles", function(req, res) {
    Article.find({})
    .populate("note")
    .exec(function(error, article) {
      if (error) {
        console.log(error);
      } else {
        res.render("index", {Article: article});
      }
    });
  });
  */
//route to post comments to article
/*
app.post('/comment/:id', function(req, res) {
  var user = req.body.name;
  var summary = req.body.comment;
  var articleId = req.params.id;

  var commentObj = {
    name: user,
    body: summary
  };

  //creates a new comment
  var newComment = new Comment(commentObj);

  //save comment to database to the ID of the article
  newComment.save(function(err, doc) {
      if (err) {
          console.log(err);
      } else {
          console.log("document ID: " + doc._id)
          console.log("Article ID: " + articleId)

          //find the article and push the comment in database to the ID
          Article.findOneAndUpdate({ "_id": req.params.id }, {$push: {'comment':doc._id}}, {new: true})
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/readArticle/' + articleId);
                }
            });
        }
  });
});
*/
/*
app.get("/articles/:id", function(req, res) {
    Article.findOne({ "_id": req.params.id })
    .populate("comment")
    .exec(function(error, doc) {
      if (error) {
        console.log(error);
      }
    });
  });
//route to get the article that user wants to read
/*
app.get('/readArticle/:id', function(req, res){
  var articleId = req.params.id;
  var articleObj = {
    article: [],
    body: []
  };

   //find the article at the id and populate comment
    Article.findOne({ _id: articleId })
      .populate('comment')
      .exec(function(err, doc){

      if(err){
        console.log(err)

      } else {
        articleObj.article = doc;
        var link = doc.link;
        //grab article from link to grab the article story just like in the scrape route
        request("http://www.nytimes.com/" + link, function(error, response, html) {
          var $ = cheerio.load(html);

          $('.story-content').each(function(i, element){
            articleObj.body = $(this).children('p').text();
            //render article and comments to the handlebars article file
            res.render('article', articleObj);
            return false;
          });
        });
      }
});
});
})

app.post("/articles/:id", function(req, res) {
    var newComment= new Comment(req.body);
    newComment.save(function(error, doc) {
      if (error) {
        console.log(error);
      } else {
        Article.findOneAndUpdate({ "_id": req.params.id },
        { $push: { notes:doc._id } },
				{ new: true })
        .exec(function(err, doc) {
          if (err) {
            console.log(err);
          } else {
            //res.redirect("/articles");
            res.send(doc);
          }
        });
      }
    });
  });

  app.delete('/comment/:id', function(req, res) {
  	var commentId = req.params.id;

  	Comment.remove({ '_id': commentId }, function(err) {

  		if (err)
  			res.status(500).json({
  				success: false,
  				message: "Error processing request."
  			});
  		else {
  			Article.update({
  				comment: commentId
  			}, {
  				$pull: { comment: commentId }
  			}, function(err) {
  				if (err)
  					res.status(500).json({
  						success: false,
  						message: 'Failed to delete note.'
  					});
  				else
  					res.status(200).json({
  						success: true,
  						message: 'Comment deleted.'
  					});
  			});
  		}

  	});
  });
  app.delete('/delete-article/:id', function(req, res) {
    Article.deleteOne({"_id": req.params.id})
      .exec(function(err, doc) {
       if (error) {
      console.log(error);
      res.send(error);
      } else {
        res.redirect('/articles');
      }
    });
  });
})
*/
module.exports = app;
