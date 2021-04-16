var express = require("express")
var session = require('express-session')
var path = require('path');
var crypto = require('crypto');
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream')
var methodOverride = require('method-override')
const { urlencoded } = require("body-parser");
const { connect } = require("http2");
const { response } = require("express");

var ejs= require("ejs");
const { DH_UNABLE_TO_CHECK_GENERATOR } = require("constants");

const port = 3000;
const app = express()
const router = express.Router();

// Middleware
app.use("/static", express.static(__dirname + "/static"));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(session({secret:"hgvjblihoiu89yhugb",resave:false,saveUninitialized:true}));

app.use(bodyParser.json());
app.use(express.static(__dirname, {  index: '/admin/test1'}));
app.use(bodyParser.urlencoded({
     extended: false
}));
// MongoURI connection
const mongoAtlasUri = "mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook";

const conn = mongoose.createConnection(mongoAtlasUri);
try {
    mongoose.connect(mongoAtlasUri,{ useNewUrlParser: true, useUnifiedTopology: true },
        () => console.log("Mongoose is connected"),);
    }catch(e) {
            console.log("Could not connect");
    }
var db = mongoose.connection;
db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))

// Converting to ejs //
// @route GET
app.get('/admin/test1',function(req, res) {
    res.render("admin/test1");
});
//const review = await dbcon.getProducts();
app.get('/admin/test1',function(req,res) {
    res.render("test1",{ review: null })
});
app.post('/admin/test1', function(req,res)
{
    db.collection('review').find({}, function (err, reviews) {
        if (err) {
            console.log(err);
        } else {
            res.render('test1', { review: reviews})
        }
    }) 
 })



// var schema = new mongoose.Schema({
//   route : String,
//   origin : String,
//   destination : String,
//   estimatedTimeOfArrival : String,
//   date : String,
//   time : String
// }) 
// var detailsModel = mongoose.model("detailsModel", schema);
// app.get("/admin/test1", function (req, res) {
// res.render("/admin/test1",{ error :false })
// })
// app.get("/admin/test1", function (req, res) {   
// detailsModel.find({}, function (err, allDetails) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log(allDetails)
//          res.render("/admin/test1", { details: allDetails })
//     }
// })
// })

app.listen(port);
console.log("Listening on PORT 3000");

