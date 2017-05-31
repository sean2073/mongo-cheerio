var express = require('express');
var path = require('path');
var fs  = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var Comment = require("../models/Comment.js");
var Article = require("../models/Article.js");

//index route that redirects to articles route
app.get('/', function(req, res) {
    res.redirect('/articles');
});

app.get('/scrape', function(req, res){
  // New York Times Business Page Latest News - Top 3 w Timestamp
  url = 'http://www.nytimes.com/pages/business/index.html?hpw&rref&action=click&pgtype=Homepage&module=well-region&region=bottom-well&WT.nav=bottom-well/';

  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);
       var titlesArray = [];
       $('.story').each(function(i,element){
            var result = {};
            result.story = $(this).children('p').text().trim();
            result.link = $(this).children().children('a').attr('href');
            //checks that an empty articles arent pulled
            if(result.story !=="" && result.link !== ""){
              console.log("story: " + result.story);
              console.log("link: "  + result.link);

              // checks for empty articles
              if(titlesArray.indexOf(result.story) == -1){
                //pushes result.title into titlesArray if not empty title
                  titlesArray.push(result.story);
                  //checks if article is already in database
                  Article.count({ title: result.story}, function (err, test){
                  if(test == 0){
                    var entry = new Article(result);
                    //save the artcle to the Mongo database
                    entry.save(function(err, doc){
                      //log any errors
                      if (err){
                        console.log(err);
                      }
                      else{
                        console.log(doc);
                      }
                    })
                  }
              })
            }
            else{
              console.log("Already have this article.");
            }
       }
       else{
         console.log("Not saved to DB, missing data");
       }
    });
    //redirect to the home page after scrapped
      res.redirect('/');

  }
});

//route to show all the articles scrapped stored in the Mongo database
app.get('/articles', function (req, res){
  //query the database to sort all entries from new to oldest
  Article.find().sort({_id: -1})
  //execute the articles to handlebars and render
  .exec(function(err, doc){
    if (err){
      console.log(err);
    }
    else{
      var artcl = {article: doc};
      res.render('index', artcl);
    }
  });
});
//route to post comments to article
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

//route to get the article that user wants to read
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
module.exports = app;
