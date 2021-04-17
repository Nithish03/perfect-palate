const express = require('express')
const app = express()
const port = 3000
var mongoose = require('mongoose');

app.use("/static", express.static(__dirname + "/static"));
app.set('view engine', 'ejs')

app.get('/admin/recipepage', (req,res) => {
    // let device_list = [{'name':'dht22'}, {'name':'tmp36'}]
    var db = mongoose.connection;
    var collection = db.collection('review');
    // Find some documents
    collection.find({}).toArray(function(err, review) {
      res.render('review', {'review': review})
    });  
})
app.get('/', (req,res) => res.send('Hello World!'))

//Mongoose connection
try {
    mongoose.connect('mongodb+srv://Recipe_book:recipe@database.plch0.mongodb.net/RecipeBook' , { useNewUrlParser: true, useUnifiedTopology: true },
        () => console.log("Mongoose is connected"),);
    }catch(e) {
            console.log("Could not connect");
    }
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
