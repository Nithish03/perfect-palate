const mongoose = require('mongoose');

// Schemas are bound to the original collection names (users, recipe_post,
// review) so any surviving data from the old deployment keeps working.

const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true } // bcrypt hash
}, { collection: 'users' }));

const Recipe = mongoose.model('Recipe', new mongoose.Schema({
    name: String,            // author display name
    email: String,           // author email
    recipe: { type: String, required: true },   // dish name
    prep: String,
    cook: String,
    recipes: String,         // category (Indian, Thai, ...)
    ingredients: String,     // comma separated
    procedure: String,       // comma separated
    about: String,
    date: String,            // mm-dd-yyyy, kept for template compatibility
    servings: String,
    image: String,           // uploaded image filename in uploads/
    average_rating: { type: Number, default: 0 }, // running SUM of stars (legacy naming)
    count: { type: Number, default: 0 }           // number of ratings
}, { collection: 'recipe_post' }));

const Review = mongoose.model('Review', new mongoose.Schema({
    name: String,
    stars: Number,
    comment: String,
    recipe_id: String
}, { collection: 'review' }));

module.exports = { User, Recipe, Review };
