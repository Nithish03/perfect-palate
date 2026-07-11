require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/perfect-palate';
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.error('SESSION_SECRET must be set in production.');
    process.exit(1);
}

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
    console.error('MONGODB_URI is not set. Add it to your host\'s environment '
        + 'variables (e.g. your MongoDB Atlas connection string).');
    process.exit(1);
}

const { User, Recipe, Review } = require('./models');

// Single shared connection: the session store reuses the Mongoose client
// instead of opening its own (whose failure would bypass start()'s error
// handling and crash with an unhandled rejection).
const dbClientPromise = mongoose.connect(MONGODB_URI)
    .then((m) => m.connection.getClient());
dbClientPromise.catch(() => { /* reported by start() */ });

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.set('view engine', 'ejs');
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: SESSION_SECRET || 'dev-only-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ clientPromise: dbClientPromise }),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== 'true',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // secure cookies behind Heroku/Render style proxies
}

// Recipe image uploads (multer was configured but never wired up originally)
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, /^image\//.test(file.mimetype));
    }
});

const requireLogin = (req, res, next) => {
    if (req.session.collection && req.session.collection.email) {
        return next();
    }
    res.redirect('/admin/login');
};

// Small helper so async route errors reach the error handler
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const formatDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${mm}-${dd}-${today.getFullYear()}`;
};

// ---------------------------------------------------------------------------
// Public pages
// ---------------------------------------------------------------------------
app.get('/', (req, res) => res.redirect('/admin/index'));
app.get('/admin/index', (req, res) => res.render('admin/index'));
app.get('/admin/registration', (req, res) => res.render('admin/registration'));
app.get('/admin/contact-us', (req, res) => res.render('admin/contact-us'));
app.get('/admin/login', (req, res) => res.render('admin/login'));

app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/index'));
});

// ---------------------------------------------------------------------------
// Registration / login
// ---------------------------------------------------------------------------
app.post('/admin/registration', wrap(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirm || '');

    if (!name || !emailValidator.validate(email) || password.length < 4 || password !== confirm) {
        return res.redirect('/admin/registration');
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.redirect('/admin/login');
    }

    await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.redirect('/admin/login');
}));

app.post('/admin/login', wrap(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.redirect('/admin/login');
    }

    req.session.collection = { name: user.name, email: user.email };
    res.redirect('/admin/categories');
}));

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
app.get('/admin/categories', requireLogin, (req, res) => res.render('admin/categories'));

// All recipes in a category (?id=Indian)
app.get('/admin/recipe', requireLogin, wrap(async (req, res) => {
    const category = String(req.query.id || '');
    const recipes = await Recipe.find({ recipes: category }).lean();
    res.render('admin/recipe', { recipe_post: recipes });
}));

// Recipes written by the logged-in user
app.get('/admin/myrecipe', requireLogin, wrap(async (req, res) => {
    const recipes = await Recipe.find({ email: req.session.collection.email }).lean();
    res.render('admin/myrecipe', { recipe_post: recipes });
}));

app.get('/admin/recipereg', requireLogin, (req, res) => res.render('admin/recipereg'));

app.post('/admin/recipereg', requireLogin, upload.single('file'), wrap(async (req, res) => {
    await Recipe.create({
        name: req.session.collection.name,
        email: req.session.collection.email,
        recipe: String(req.body.recipe || ''),
        prep: String(req.body.prep || ''),
        cook: String(req.body.cook || ''),
        recipes: String(req.body.recipes || ''),
        ingredients: String(req.body.ingredients || ''),
        procedure: String(req.body.procedure || ''),
        about: String(req.body.about || ''),
        servings: String(req.body.servings || ''),
        date: formatDate(),
        image: req.file ? req.file.filename : undefined
    });
    res.redirect('/admin/categories');
}));

// Single recipe page with its reviews (?id=<recipe ObjectId>)
app.get('/admin/recipepage', requireLogin, wrap(async (req, res) => {
    const id = String(req.query.id || '');
    if (!mongoose.isValidObjectId(id)) {
        return res.redirect('/admin/categories');
    }
    const recipe = await Recipe.findById(id).lean();
    if (!recipe) {
        return res.redirect('/admin/categories');
    }
    const reviews = await Review.find({ recipe_id: id }).lean();
    res.render('admin/recipepage', { recipe_post: [recipe], review: reviews });
}));

// Post a review
app.post('/admin/recipepage', requireLogin, wrap(async (req, res) => {
    const id = String(req.query.id || '');
    const stars = Math.min(5, Math.max(1, parseInt(req.body.stars, 10) || 0));
    if (!mongoose.isValidObjectId(id) || !req.body.stars) {
        return res.redirect('/admin/recipepage?id=' + encodeURIComponent(id));
    }

    await Review.create({
        name: req.session.collection.name,
        stars,
        comment: String(req.body.comment || ''),
        recipe_id: id
    });
    // average_rating is the running total of stars; templates divide by count
    await Recipe.updateOne({ _id: id }, { $inc: { average_rating: stars, count: 1 } });

    res.redirect('/admin/recipepage?id=' + encodeURIComponent(id));
}));

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use((req, res) => res.status(404).send('Page not found'));

app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).send('Something went wrong. Please try again.');
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function start() {
    try {
        await dbClientPromise;
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`Perfect Palate listening on port ${PORT}`));
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        console.error('Check the MONGODB_URI environment variable and your '
            + 'database\'s network access settings.');
        process.exit(1);
    }
}

if (require.main === module) {
    start();
}

module.exports = { app, start };
