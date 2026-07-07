# Moderna — Website

Your storefront: browse shoes → add to bag → "Order via WhatsApp" sends you a formatted
message with items, sizes, colors and total. No payment gateway, no fees.

You manage everything (adding shoes, photos, prices, sold-out status) from `/admin` —
no code required after the one-time setup below.

**Total cost to run this: $0/month**, using free tiers of Supabase (database + photo
storage + your login) and Vercel (hosting).

---

## 1. One-time setup (about 20 minutes)

### A. Create your database (Supabase)

1. Go to [supabase.com](https://supabase.com) → sign up free → **New project**.
2. Pick a name (e.g. `moderna`), set a database password (save it somewhere), choose a region close to Lebanon (e.g. Frankfurt), click **Create**.
3. Once it's ready, go to **SQL Editor** → **New query**, paste the entire contents of
   `supabase/schema.sql` from this project, and click **Run**.
4. Go to **Storage** (left sidebar) → **New bucket** → name it exactly `product-images` →
   toggle **Public bucket** ON → **Create bucket**.
5. Go to **Project Settings → API**. Copy two values, you'll need them in step C:
   - **Project URL**
   - **anon public** key

### B. Create your admin login

1. In Supabase, go to **Authentication → Users → Add user → Create new user**.
2. Enter your own email and a password. This is what you'll use to log into `/admin`.

### C. Connect the website to your database

1. In this project folder, duplicate `.env.example` and rename the copy to `.env`.
2. Paste your Project URL and anon key from step A5:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

### D. Set your WhatsApp number and store details

Open `src/config.js` and edit:
```js
whatsappNumber: "9613000000",   // your number, country code, no + or spaces
instagramHandle: "moderna_lebanon",
```

### E. Try it locally (optional but recommended)

```bash
npm install
npm run dev
```
Open the URL it prints. Go to `/admin`, log in, add a couple of test products, then check
they show up on the homepage and shop page.

---

## 2. Put it online for free (Vercel)

1. Push this project to a GitHub repo (or ask Claude Code to do this for you).
2. Go to [vercel.com](https://vercel.com) → sign up free with GitHub → **Add New → Project**
   → pick this repo.
3. Before deploying, open **Environment Variables** and add the same two values from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. In ~1 minute you'll get a live URL like `moderna.vercel.app`.
5. Optional: in Vercel → **Settings → Domains**, add your own domain (e.g. `modernalebanon.com`) later — still free hosting either way.

---

## 3. Day-to-day: adding products

1. Go to `yoursite.com/admin`, log in with the email/password from step B.
2. **Add product** → fill in name, price, category, sizes (e.g. `36, 37, 38, 39`), colors,
   upload photos, save.
3. Toggle **Feature on homepage** to show it in "New arrivals."
4. Uncheck **In stock** to show "Sold out" without deleting it.
5. Edit or delete any product any time from the same table.

Orders always arrive as a WhatsApp message to the number in `src/config.js` — nothing
else to check or manage.

---

## Project structure

```
src/
  config.js              store name, WhatsApp number, categories (edit this)
  pages/                 Home, Shop, ProductDetail, Admin
  components/            Navbar, Footer, ProductCard, CartDrawer
  context/                Cart state, Auth state
  lib/                    Supabase queries, WhatsApp message builder
supabase/schema.sql       run once in Supabase SQL editor
```

## Changing the look

Colors and fonts live in `src/index.css` under `@theme`. Change a hex value there and it
updates everywhere (buttons, text, backgrounds) automatically.
