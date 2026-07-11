# Perfect Palate

A recipe sharing platform where chefs can register, browse recipes by cuisine
(Indian, Continental, Korean, Chinese, Thai, Caribbean), publish their own
recipes with photos, and rate and review other chefs' dishes.

Built with **Node.js + Express**, server-rendered **EJS** views, and
**MongoDB** (Mongoose). Originally a 2021 college project deployed on Heroku;
recovered and modernized in 2026.

## Tech stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| Runtime   | Node.js ≥ 18                                      |
| Server    | Express 4                                         |
| Views     | EJS templates + Bootstrap (static assets)         |
| Database  | MongoDB (Mongoose 8) — local or Atlas             |
| Sessions  | express-session, persisted in MongoDB             |
| Uploads   | multer (recipe photos stored in `uploads/`)       |
| Passwords | bcryptjs                                          |

## Running locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start MongoDB.** Either run a local server
   (`docker run -d -p 27017:27017 mongo:7` is the quickest way), or create a
   free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster:
   - Create a cluster, then a database user under *Database Access*
   - Allow your IP under *Network Access*
   - Copy the connection string (`mongodb+srv://...`) and append the database
     name, e.g. `/perfect-palate`

3. **Configure environment**

   ```bash
   cp .env.example .env
   # edit .env: set MONGODB_URI and SESSION_SECRET
   ```

4. **Seed sample data** (4 users, 8 recipes, 7 reviews — prints the sample
   login credentials when done)

   ```bash
   npm run seed
   ```

5. **Start the app**

   ```bash
   npm start        # or: npm run dev (auto-restart on changes)
   ```

   Open http://localhost:3000 — log in with `demo@example.com` / `demo1234`.

## Environment variables

| Variable           | Required   | Description                                                              |
| ------------------ | ---------- | ------------------------------------------------------------------------ |
| `MONGODB_URI`      | yes        | MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/perfect-palate` for local dev. |
| `SESSION_SECRET`   | production | Random string used to sign session cookies. The app refuses to start in production without it. |
| `PORT`             | no         | HTTP port (default `3000`). Hosting platforms set this automatically.   |
| `NODE_ENV`         | production | Set to `production` on your host; enables secure cookies.               |
| `INSECURE_COOKIES` | no         | Escape hatch (`true`) if your proxy setup breaks secure cookies. Leave unset normally. |

## Project structure

```
server.js     Express app: middleware, routes, error handling, startup
models.js     Mongoose models (users, recipe_post, review collections)
seed.js       Sample-data seeder (npm run seed)
views/admin/  EJS templates (one per page)
static/       CSS, fonts, images, client JS (served at /static)
assets/       Second Bootstrap theme bundle used by some pages (/assets)
uploads/      User-uploaded recipe photos (served at /uploads, git-ignored)
```

## Deployment

The app is a single server-rendered Express monolith, so it deploys as **one
web service plus a MongoDB Atlas database**.

### Recommended: Render (or Railway/Fly.io)

Vercel is designed for static frontends and serverless functions; this app
needs a long-lived server (MongoDB-backed sessions, multer disk uploads), so a
container/VM host is the right fit. A `render.yaml` blueprint is included:

1. Create a MongoDB Atlas cluster (free tier is fine). In *Network Access*
   allow `0.0.0.0/0` or Render's outbound IPs.
2. On [Render](https://render.com): *New → Blueprint*, point it at this repo.
3. Set the `MONGODB_URI` env var to your Atlas connection string when
   prompted (`SESSION_SECRET` is generated automatically).
4. Deploy. Run the seeder once from the service's *Shell* tab: `npm run seed`.

Note: Render's free tier has an ephemeral filesystem — uploaded recipe photos
disappear on redeploy (recipes fall back to the stock photo). Attach a paid
persistent disk mounted at `/opt/render/project/src/uploads`, or move uploads
to S3/Cloudinary, if photo persistence matters.

### Heroku (original host)

The original `Procfile` still works: `heroku create`, set `MONGODB_URI`,
`SESSION_SECRET`, and `NODE_ENV=production` config vars, `git push heroku main`.
