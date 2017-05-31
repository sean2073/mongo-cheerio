// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models

// Initialize Express
var app = express();


// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static(process.cwd() + '/public'));
// Set Handlebars.
var exphbs = require("express-handlebars");
//express handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//database configuration with MongoDB
//mongoose.connect('mongodb://heroku_3k78dgc5:8gnei7rt86otr05rdvf40qjdag@ds143608.mlab.com:43608/heroku_3k78dgc5');
mongoose.connect('mongodb://localhost/mongoCheerio');

//check mongoose for errors
var db = mongoose.connection;
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// Once logged in to the db through mongoose, log a success connect message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});

var routes = require('./routes/app2.js');
app.use('/', routes);


//app connects at localhost 3000
var port = 8082;
app.listen(port, function(){
  console.log('Running on port: ' + port);
});
