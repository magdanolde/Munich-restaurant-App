# Tisch für 15

A small static web app listing Munich restaurants where a group of 15+ can book
without leaving credit card details or paying for no-shows.

## Files

| File          | What it is                                                   |
|---------------|--------------------------------------------------------------|
| `index.html`  | The page                                                     |
| `styles.css`  | Design (light and dark mode)                                 |
| `app.js`      | Search, filters, "we've been here" marks, copy buttons       |
| `data.js`     | **All restaurant data** – edit this to add or change places  |
| `favicon.svg` | Browser tab icon                                             |

No build step, no dependencies. Fonts load from Google Fonts.

## Try it locally

Double-click `index.html`. It opens in your browser and works offline
(except the fonts).

## Publish on Vercel (recommended)

**Option A – Vercel CLI:**
1. Install Node.js if you don't have it: https://nodejs.org
2. Open a terminal (PowerShell) in this `app` folder:
   ```
   cd "C:\Users\Magda\OneDrive\Desktop\AI\Restaurant Agent\app"
   npx vercel
   ```
3. Answer the questions (defaults are fine). You get a preview URL.
4. Publish the live version:
   ```
   npx vercel --prod
   ```

**Option B – via GitHub:**
1. Create a new GitHub repository and upload the files in this folder.
2. On https://vercel.com/new import the repository. Framework preset: "Other".
   Leave build command empty. Deploy.
3. Every change you push to GitHub updates the site automatically.

## Other free hosts

- **Netlify Drop:** go to https://app.netlify.com/drop and drag this `app` folder onto the page.
- **GitHub Pages:** push to a repo, then Settings → Pages → deploy from `main` branch, root folder.

## Updating the list

Open `data.js` and edit `window.RESTAURANTS`. Each place looks like this:

```js
{id:"pschorr", name:"Der Pschorr", cuisine:"Bavarian", area:"Altstadt",
 addr:"Viktualienmarkt 15", price:"not listed", veg:"…", group:"…",
 book:"…", direct:true, url:"https://der-pschorr.de/"}
```

- `area` must match one of `window.AREAS`.
- Add `fullyVeg:"Vegan"` (or `"Vegetarian & vegan"`) for fully veggie places.
- Add `caution:"…"` to show an "Ask first" badge.
- Change `window.CHECKED_ON` when you re-check the list.

Then redeploy (`npx vercel --prod`, or push to GitHub).

## "We've been here"

Tap **Mark as visited** on a place after a dinner. It gets a green
"Been here" badge with today's date, which you can change with the date field.
Use the **Not been yet / Been there** filters to plan the next dinner, and
**Copy our list** to paste your visits into the group chat.

Visits are stored in the browser of the person who marks them (localStorage),
so they don't sync between phones. If one person keeps the list, that works
best. Syncing for the whole group would need a small backend (for example
Supabase).
