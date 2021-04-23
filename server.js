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
var ObjectId = require('mongodb').ObjectID;

const port = 3000;
const app = express()
const router = express.Router();

// const http = require('http');
// const url = require('url');


router.use(express.static(__dirname+ "/uploads"));

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



// Init gridfs
// let gfs;

// conn.once('open', () => {
//     gfs = Grid(conn.db, mongoose.mongo);
//     gfs.collection('uploads');
// })

// Creating storage engine
// const storage = new GridFsStorage({
//     url: 'mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook',
//     file: (req, file) => {
//       return new Promise((resolve, reject) => {
//         crypto.randomBytes(16, (err, buf) => {
//           if (err) {
//             return reject(err);
//           }
//           const filename = buf.toString('hex') + path.extname(file.originalname);
//           const fileInfo = {
//             
//             bucketName: 'uploads'
//           };
//           resolve(fileInfo);
//         });
//       });
//     }
//   });
//   const upload = multer({ storage });

var Storage = multer.diskStorage({
    destination:"./uploads",
    filename:(req,file,cb) => {
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
    }
});

var upload = multer({
    storage: Storage
}).single('file');


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


app.get('/admin/myrecipe',function(req, res) {
    var db = mongoose.connection;
    var email= req.session.collection.email;
    
    var collection = db.collection('recipe_post');
    collection.find({'email':email}).toArray(function(err, recipe) {
      res.render('admin/myrecipe', {'recipe_post': recipe})
    }); 
    
});





app.get('/admin/recipe',function(req, res) {
    var db = mongoose.connection;
    var food=req.query.id;
    
    var collection = db.collection('recipe_post');
    collection.find({'recipes':food}).toArray(function(err, recipe) {
      res.render('admin/recipe', {'recipe_post': recipe})
    });  
});

app.get('/admin/recipereg',function(req, res) {
    res.render("admin/recipereg");
});
app.get('/admin/login',function(req, res) {
    res.render("admin/login");
});

// http.createServer(function (req, res) {
//     const queryObject = url.parse(req.url,true).query;
//     console.log(queryObject);
  
//     res.writeHead(200, {'Content-Type': 'text/html'});
//     res.end('Feel free to add query parameters to the end of the url');
//   }).listen(8080);
// 
app.get('/admin/recipereg',function(req, res) {
    res.render("admin/recipereg");
});

//rendering values in recipe page
var recipe_post=[];
var review=[];
app.get('/admin/recipepage', (req,res) => {
        var id=req.query.id;
        console.log(`${id}`);
        var o_id = new ObjectId(id); 
        var k;
        var rating_count=0;
        var collection = db.collection('recipe_post');
        collection.find({"_id":o_id}).toArray(function(err, recipe) {
            if(err)
            {
                throw err;
            }
            else
            {
                for(var i=0;i<recipe.length;i++)
                {
                    recipe_post[i]=recipe[i];
                }
            }
        //res.render('admin/recipepage', {'recipe_post': recipe})
    });
    var collection1 = db.collection('review');
        collection1.find({"recipe_id":id}).toArray(function(err, r) {
            if(err)
            {
                throw err;
            }
            else
            {
                for(var i=0;i<r.length;i++)
                {
                    var c=r[i].stars;
                    rating_count=parseInt(rating_count)+parseInt(c);
                    review[i]=r[i];
                }
            }
            
    });
    console.log(`${rating_count} rating count `);
    res.render('admin/recipepage', {
        recipe_post: recipe_post,
        review: review,
        //count:rating_count/4
      });
});  
         
    
    
// app.get('/admin/recipereg',function(req, res) {
//     gfs.files.find().toArray((err,files) => {
//         // Check if files
//         if(!files || files.length ===0) {
//             res.render('index', {files: false});
//          } else {
//              files.map(file => {
//                  if(file.contentType == 'image/jpeg' || file.contentType == 'image/png') 
//                  {
//                     file.isImage = true;
//                  } else {
//                      file.isImage = false;
//                  }
//              });
//              res.render('index', {files: files});
//          }
//     });
// });
        
//recipe_reg:
app.get('/admin/recipereg',function(req,res) {
    res.render('recipe');
    res.sendFile(__dirname + '/admin/recipereg')
});
app.post('/admin/recipereg', function(req,res){
    //console.log(`${req.session.collection.email}`);
    //  var email=req.session.collection.email;
     var recipe = req.body.recipe;
     var prep = req.body.prep;
     var cook = req.body.cook;
     var recipes = req.body.recipes;
     var ingredients = req.body.ingredients;
     var procedure = req.body.procedure;
     console.log(`${recipe} ${prep}`);
     var data = {
        //  "email": email,
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
        return res.redirect('/admin/categories')
})

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
     var user_name=req.session.collection.name;
     var stars = req.body.stars;
     var comment = req.body.comment;
     var recipe_id= req.query.id;
     
     var data = {
         "name": user_name,
         "stars": stars,
         "comment": comment,
         "recipe_id": recipe_id  
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

app.listen(port);
console.log("Listening on PORT 3000");