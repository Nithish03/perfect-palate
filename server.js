var express = require("express")
var session = require('express-session');
var path = require('path');
var crypto = require('crypto');
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var multer = require('multer');
var formidable = require("formidable");
var fs = require("fs");
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
var methodOverride = require('method-override');
const { urlencoded } = require("body-parser");
const { connect } = require("http2");
const { response } = require("express");
const { body, validationResult } = require('express-validator');

const port = 3000;
const app = express()
const router = express.Router();

// app.use(session({
//     name: "session-id",
//     secret: "GFGEnter", // Secret key,
//     saveUninitialized: false,
//     resave: false,
//     store: new filestore()
// }))


// Middleware
app.use("/static", express.static(__dirname + "/static"));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(session({secret:"hgvjblihoiu89yhugb",resave:false,saveUninitialized:true}));

app.use(bodyParser.json());
app.use(express.static(__dirname, {  index: '/admin/registration'}));
app.use(bodyParser.urlencoded({
     extended: false
}));
// MongoURI connection
const conn = mongoose.createConnection('mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook', { useNewUrlParser: true, useUnifiedTopology: true });
try {
    mongoose.connect('mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook' , { useNewUrlParser: true, useUnifiedTopology: true },
        () => console.log("Mongoose is connected"),);
    }catch(e) {
            console.log("Could not connect");
    }
var db = mongoose.connection;
//recipe

app.post('/admin/recipereg', function(req,res){
    //console.log(`${req.session.collection.email}`);
     //var email=req.session.collection.email;
     var recipe = req.body.recipe;
     var prep = req.body.prep;
     var cook = req.body.cook;
     var recipes = req.body.recipes;
     var ingredients = req.body.ingredients;
     var procedure = req.body.procedure;
    
     var data = {
         //"email": email,
         "recipe": recipe,
         "prep": prep,
         "cook": cook,
         "recipes": recipes,
         "ingredients": ingredients,
         "procedure": procedure
         
     }
     
    
                db.collection('recipe_post').insertOne(data,(err,collection) => {
                    if(err){
                        throw err;
                    }
                    console.log("Record Inserted Successfully");
                });
                return res.redirect('/admin/login')
})


// Init gridfs
let gfs;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

// Creating storage engine
const storage = new GridFsStorage({
    url: 'mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook',
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

// Converting to ejs //
// @route GET
app.get('/admin/index',function(req, res) {
    res.render("admin/index");
});
app.get('/admin/registration',function(req, res) {
    res.render("admin/registration");
});
app.get('/admin/categories',function(req, res) {
    res.render("admin/categories");
});
app.get('/admin/contact-us',function(req, res) {
    res.render("admin/contact-us");
});
app.get('/admin/recipe',function(req, res) {
    res.render("admin/recipe");
});

app.get('/admin/recipereg',function(req, res) {
    res.render("admin/recipereg");
});
app.get('/admin/login',function(req, res) {
    res.render("admin/login");
});

app.get('/admin/recipepage', (req,res) => {
    var db = mongoose.connection;
    var collection = db.collection('review');
    collection.find({}).toArray(function(err, review) {
      res.render('admin/recipepage', {'review': review})
    });  
})

app.get('/admin/recipereg',function(req, res) {
    gfs.files.find().toArray((err,files) => {
        // Check if files
        if(!files || files.length ===0) {
            res.render('index', {files: false});
         } else {
             files.map(file => {
                 if(file.contentType == 'image/jpeg' || file.contentType == 'image/png') 
                 {
                    file.isImage = true;
                 } else {
                     file.isImage = false;
                 }
             });
             res.render('index', {files: files});
         }
    });
});


// Get /files
// Displaiyng files
app.get('/files',(req,res) => {
    gfs.files.find().toArray((err,files) => {
        // Check if files
        if(!files || files.length ===0) {
            return res.status(404).json({
                err: 'No Files exist'
            });
         }
         //Files exisst
         return res.json(files);
    });
});

// Get /files/filename
// Displaiyng files
app.get('/files/:filename',(req,res) => {
    gfs.files.findOne({filename: req.params.filename},(err,file) => {
        if(!file || file.length ===0) {
            return res.status(404).json({
                err: 'No File exist'
            });
         }
         // File exists
         return res.json(file);
    });
});

// Get /files/filename
// Displaiyng images
app.get('/image/:filename',(req,res) => {
    gfs.files.findOne({filename: req.params.filename},(err,file) => {
        if(!file || file.length ===0) {
            return res.status(404).json({
                err: 'No File exist'
            });
         }
         // Check if image
         if(file.contentType === 'image/jpeg'|| file.contentType === 'img/png') {
            // Read output
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
         } else {
             res.status(404).json({
                 err: 'Not an image'
             });
         }
    });
});

// Converting to ejs //
app.get('/',function(req,res) {
    res.render('reg-form');
    res.sendFile(__dirname + '/admin/registration')
});
// @route POST
// Registeration 
var email_id;
app.post('/admin/registration', function(req,res){
     var name = req.body.name;
     var email = req.body.email;
     var password = req.body.password; 
     var confirm=req.body.confirm;
     var flag=0;
    var validator = require("email-validator");
    if(!validator.validate(email))
    {
        flag=1;
    }
    if(password==confirm)
    {
        flag=1;
    }
    if(flag==1)
    {
     var data = {
         "name": name,
         "email": email,
         "password": password
     }
     var data1 = {
        "email": email,
    }
     db.collection('users').findOne(data1,(err,collection) => {
        if(err){
            throw err;
        }
        else
        {
            console.log(collection);
            if(collection!=null)
            {
                return res.redirect('/admin/login')
            }
            else
            {
                db.collection('users').insertOne(data,(err,collection) => {
                    if(err){
                        throw err;
                    }
                    email_id=data.email;
                    req.session.collection=collection;
                    console.log("Record Inserted Successfully");
                });
                return res.redirect('/admin/login')
            }
        }
    });
}
else
{
    return res.redirect('/admin/registration')
}
})

//Upload
app.post('/upload', upload.single('file'), (req,res) => {
    res.redirect('/admin/recipepage');
});


//Login
app.get('/admin/login',function(req,res) {
    res.render('login-form');
    res.sendFile(__dirname + '/admin/login')
});

app.post('/admin/login', function(req,res){
     var email = req.body.email;
     var password = req.body.password; 
     var data = {
         "email": email,
         "password": password
     }
     console.log(`${email} and password is ${password}`)

    db.collection('users').findOne(data,(err,collection) => {
        if(err){
            throw err;
        }
        else
        {
            console.log(collection);
            if(collection!=null)
            {
                email_id=data.email;
                req.session.collection=collection;
                return res.redirect('/admin/categories')
            }
            else
            {
                return res.redirect('/admin/login')
            }
        }
    });
   
})

//review
app.get('/',function(req,res) {
    res.render('reg-form');
    res.sendFile(__dirname + '/admin/recipepage')
});

//Review
app.post('/admin/recipepage', function(req,res){
    console.log(`${req.session.collection.email}`);
     var email=req.session.collection.email;
     var stars = req.body.stars;
     var comment = req.body.comment;
    
     var data = {
         "email": email,
         "stars": stars,
         "comment": comment
         
     }
     console.log(`${stars} and password is ${comment}`)
     
    
                db.collection('review').insertOne(data,(err,collection) => {
                    if(err){
                        throw err;
                    }
                    console.log("Record Inserted Successfully");
                });
                return res.redirect('/admin/recipepage')
})

//review
app.get('/',function(req,res) {
    res.render(__dirname + "/admin/recipepage",{ details: null })
    res.sendFile(__dirname + '/admin/recipepage')
});



// //Review
// var details;
// app.post('/admin/recipepage', function(req,res){
    
//      db.collection('review').find({}, function (err, review) {
//         if(err){
//             throw err;
//         }
//         else
//         {
//             console.log(review);
//             //res.render(__dirname + "/admin/recipepage", { details: review })
//         }
//     });    
// })

app.listen(port);
console.log("Listening on PORT 3000");