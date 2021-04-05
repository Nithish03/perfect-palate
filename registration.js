var express = require("express")
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
const { urlencoded } = require("body-parser")
const port = 3000;
const app = express()
const router = express.Router();

app.use("/static", express.static(__dirname + "/static"));
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(express.static(__dirname, {  index: 'registration.html'}));
app.use(bodyParser.urlencoded({
     extended: false
}));
const mongoAtlasUri = "mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook";
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
app.get('/admin/recipepage',function(req, res) {
    res.render("admin/recipepage");
});
app.get('/admin/recipereg',function(req, res) {
    res.render("admin/recipereg");
});

// Converting to ejs //
app.get('/',function(req,res) {
    res.render('reg-form');
    res.sendFile(__dirname + '/registration.html')
});

app.post('/', function(req,res){
     var name = req.body.name;
     var email = req.body.email;
     var password = req.body.password; 

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
                return res.redirect('/login.html')
            }
            else
            {
                db.collection('users').insertOne(data,(err,collection) => {
                    if(err){
                        throw err;
                    }
                    console.log("Record Inserted Successfully");
                });
                return res.redirect('/categories.html')
            }
        }
    });
})
app.listen(port);
console.log("Listening on PORT 3000");