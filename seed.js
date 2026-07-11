// Seeds the database with sample users, recipes and reviews.
// Usage: npm run seed   (wipes and repopulates the three collections)
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Recipe, Review } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/perfect-palate';

const users = [
    { name: 'Priya Raman', email: 'priya@example.com', password: 'tastylife' },
    { name: 'Marco Bianchi', email: 'marco@example.com', password: 'alforno1' },
    { name: 'Ji-woo Park', email: 'jiwoo@example.com', password: 'kimchi4u' },
    { name: 'Demo Chef', email: 'demo@example.com', password: 'demo1234' }
];

const recipes = [
    {
        author: 'priya@example.com', name: 'Priya Raman',
        recipe: 'Butter Chicken', recipes: 'Indian',
        prep: '20', cook: '40', servings: '4',
        about: 'A rich, creamy tomato-based curry with tender marinated chicken. A north Indian classic that pairs beautifully with naan or basmati rice.',
        ingredients: '500g chicken thigh, 1 cup yogurt, 2 tbsp butter, 400g tomato puree, 1 cup cream, 2 tsp garam masala, 1 tbsp ginger-garlic paste, 1 tsp chilli powder, Salt to taste',
        procedure: 'Marinate chicken in yogurt and spices for 1 hour, Grill the chicken until lightly charred, Simmer tomato puree with butter and spices, Add cream and the grilled chicken, Simmer 15 minutes and finish with garam masala'
    },
    {
        author: 'priya@example.com', name: 'Priya Raman',
        recipe: 'Masala Dosa', recipes: 'Indian',
        prep: '30', cook: '20', servings: '3',
        about: 'Crispy fermented rice crepes wrapped around a spiced potato filling, served with coconut chutney and sambar.',
        ingredients: '2 cups dosa batter, 3 boiled potatoes, 1 onion, 1 tsp mustard seeds, 8 curry leaves, 2 green chillies, 1/2 tsp turmeric, 2 tbsp oil, Salt to taste',
        procedure: 'Temper mustard seeds and curry leaves in oil, Add onions and chillies and saute, Add mashed potatoes and turmeric, Spread batter thin on a hot tawa, Fill with potato masala and fold'
    },
    {
        author: 'marco@example.com', name: 'Marco Bianchi',
        recipe: 'Mushroom Risotto', recipes: 'Continental',
        prep: '15', cook: '35', servings: '4',
        about: 'Creamy arborio rice slowly cooked with porcini mushrooms, white wine and parmesan. Comfort food from northern Italy.',
        ingredients: '300g arborio rice, 250g mixed mushrooms, 1L vegetable stock, 1 onion, 100ml white wine, 60g parmesan, 2 tbsp butter, 2 tbsp olive oil, Salt and pepper',
        procedure: 'Saute mushrooms and set aside, Soften onion in butter and oil, Toast the rice for two minutes, Deglaze with wine, Add stock one ladle at a time while stirring, Fold in mushrooms and parmesan'
    },
    {
        author: 'jiwoo@example.com', name: 'Ji-woo Park',
        recipe: 'Kimchi Jjigae', recipes: 'Korean',
        prep: '10', cook: '30', servings: '2',
        about: 'A bubbling, spicy stew of well-fermented kimchi, pork belly and tofu. The dish every Korean home cook keeps in rotation.',
        ingredients: '2 cups aged kimchi, 200g pork belly, 1 block tofu, 1 tbsp gochugaru, 1 tbsp gochujang, 1 onion, 2 spring onions, 3 cups water, 1 tsp sesame oil',
        procedure: 'Fry pork belly until the fat renders, Add kimchi and stir-fry 5 minutes, Add water and the pastes, Simmer 20 minutes, Add tofu and spring onion and simmer 5 more minutes'
    },
    {
        author: 'jiwoo@example.com', name: 'Ji-woo Park',
        recipe: 'Bibimbap', recipes: 'Korean',
        prep: '25', cook: '15', servings: '2',
        about: 'A colourful rice bowl topped with seasoned vegetables, beef and a fried egg, brought together with gochujang sauce.',
        ingredients: '2 cups cooked rice, 150g beef mince, 1 carrot, 1 zucchini, 100g spinach, 100g bean sprouts, 2 eggs, 2 tbsp gochujang, 1 tbsp soy sauce, 1 tbsp sesame oil',
        procedure: 'Season and blanch each vegetable separately, Stir-fry beef with soy sauce, Fry the eggs sunny side up, Arrange everything over warm rice, Serve with gochujang and sesame oil'
    },
    {
        author: 'marco@example.com', name: 'Marco Bianchi',
        recipe: 'Pad Thai', recipes: 'Thai',
        prep: '20', cook: '10', servings: '2',
        about: 'Stir-fried rice noodles with prawns, tamarind, fish sauce and peanuts. Sweet, sour and savoury in every bite.',
        ingredients: '200g flat rice noodles, 12 prawns, 2 eggs, 3 tbsp tamarind paste, 2 tbsp fish sauce, 1 tbsp palm sugar, 100g bean sprouts, 3 tbsp crushed peanuts, 2 spring onions, 1 lime',
        procedure: 'Soak noodles until pliable, Fry prawns and set aside, Scramble eggs in the wok, Add noodles and the tamarind sauce, Toss with sprouts and prawns, Top with peanuts and lime'
    },
    {
        author: 'priya@example.com', name: 'Priya Raman',
        recipe: 'Jerk Chicken', recipes: 'Caribbean',
        prep: '15', cook: '45', servings: '4',
        about: 'Fiery Jamaican grilled chicken marinated in scotch bonnet, allspice and thyme. Smoky, spicy and unforgettable.',
        ingredients: '8 chicken thighs, 2 scotch bonnet peppers, 4 spring onions, 1 tbsp allspice, 1 tbsp thyme, 3 cloves garlic, 2 tbsp soy sauce, 1 lime, 2 tbsp brown sugar, 1 tsp cinnamon',
        procedure: 'Blend all marinade ingredients to a paste, Coat the chicken and rest overnight, Grill over medium heat turning often, Rest 5 minutes and serve with rice and peas'
    },
    {
        author: 'jiwoo@example.com', name: 'Ji-woo Park',
        recipe: 'Vegetable Chow Mein', recipes: 'Chinese',
        prep: '15', cook: '10', servings: '3',
        about: 'Springy egg noodles tossed with crisp vegetables in a glossy soy-sesame sauce. Faster than takeaway.',
        ingredients: '250g egg noodles, 1 carrot, 1 bell pepper, 100g cabbage, 3 cloves garlic, 2 tbsp soy sauce, 1 tbsp oyster sauce, 1 tsp sesame oil, 2 spring onions',
        procedure: 'Boil noodles and drain, Stir-fry garlic and vegetables on high heat, Add noodles and the sauces, Toss two minutes until glossy, Finish with sesame oil and spring onion'
    }
];

// [recipe index, reviewer email, stars, comment]
const reviews = [
    [0, 'marco@example.com', 5, 'Silky sauce, perfectly balanced spice. My family asked for it twice in one week.'],
    [0, 'jiwoo@example.com', 4, 'Delicious! I reduced the cream slightly and it was still very rich.'],
    [2, 'priya@example.com', 5, 'The stirring is worth it. Creamiest risotto I have made at home.'],
    [3, 'marco@example.com', 5, 'Tastes exactly like the jjigae I had in Seoul. Use old kimchi, it matters.'],
    [5, 'jiwoo@example.com', 4, 'Great balance of sweet and sour. Extra peanuts recommended.'],
    [6, 'jiwoo@example.com', 5, 'The overnight marinade is the secret. Incredible flavour.'],
    [1, 'marco@example.com', 4, 'Crispy and light. My first dosa ever and the steps were easy to follow.']
];

const formatDate = (daysAgo) => {
    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
};

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

    await Promise.all([User.deleteMany({}), Recipe.deleteMany({}), Review.deleteMany({})]);

    const userDocs = await User.create(await Promise.all(users.map(async (u) => ({
        name: u.name,
        email: u.email,
        password: await bcrypt.hash(u.password, 10)
    }))));
    console.log(`Inserted ${userDocs.length} users`);

    const recipeDocs = await Recipe.create(recipes.map((r, i) => ({
        name: r.name,
        email: r.author,
        recipe: r.recipe,
        recipes: r.recipes,
        prep: r.prep,
        cook: r.cook,
        servings: r.servings,
        about: r.about,
        ingredients: r.ingredients,
        procedure: r.procedure,
        date: formatDate(60 - i * 7),
        average_rating: 0,
        count: 0
    })));
    console.log(`Inserted ${recipeDocs.length} recipes`);

    for (const [idx, email, stars, comment] of reviews) {
        const recipe = recipeDocs[idx];
        const reviewer = userDocs.find((u) => u.email === email);
        await Review.create({
            name: reviewer.name,
            stars,
            comment,
            recipe_id: String(recipe._id)
        });
        await Recipe.updateOne({ _id: recipe._id }, { $inc: { average_rating: stars, count: 1 } });
    }
    console.log(`Inserted ${reviews.length} reviews`);

    console.log('\nSample logins (email / password):');
    users.forEach((u) => console.log(`  ${u.email} / ${u.password}`));

    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
