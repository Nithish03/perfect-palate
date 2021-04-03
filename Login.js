var express = require("express")
var bodyParser = require("body-parser")
var mongoose = require("mongoose")
const { urlencoded } = require("body-parser")
const port = 3000;
const app = express()
const router = express.Router();

app.use(bodyParser.json());
app.use(express.static(__dirname, {  index: 'login.html'}));
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



app.get('/',function(req,res) {
    res.render('login-form');
    res.sendFile(__dirname + '/login.html')
});

app.post('/', function(req,res){
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
                return res.redirect('/categories.html')
            }
            else
            {
                return res.redirect('/login.html')
            }
        }
    });
   
})
 app.listen(port);
console.log("Listening on PORT 3000");