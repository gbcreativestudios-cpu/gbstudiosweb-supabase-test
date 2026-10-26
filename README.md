# GB Studios Portfolio — Supabase Test Copy

This is a separate test copy of the GB Studios website. The original `gbstudiosweb` repository is unchanged.

- The custom Supabase admin is at `/supabase-admin/`.
- The original Decap CMS remains at `/admin/` for comparison.
- Supabase setup, table policies, admin role instructions, and content import steps are in `README-SUPABASE.md`.
- `.env.example` is a template. Keep your real `.env` file and Supabase secret key private.

Extract this ZIP, then upload the folder contents to your new `gbstudiosweb-supabase-test` repository.

---

# GB Studios Portfolio

React + Vite + Framer Motion portfolio site. Every piece of content — projects,
motion reels, testimonials, team, hero section, about page — is stored as JSON
files under `/content` and is fully editable through **Decap CMS** at `/admin`
once deployed.

## 1. Push to GitHub

```bash
cd gb-studios-portfolio
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Connect your GitHub account and pick this repo.
3. Build settings are already set via `netlify.toml` (build command `npm run build`, publish `dist`) — just click **Deploy**.

## 3. Turn on the CMS (Netlify Identity + Git Gateway)

This is what lets you log in at `yoursite.com/admin` and edit everything.

1. In your Netlify site dashboard: **Site configuration → Identity → Enable Identity**.
2. Under Identity settings, set **Registration** to **Invite only** (so random people can't sign up).
3. Scroll to **Services → Git Gateway → Enable Git Gateway**. This lets Decap CMS commit content changes to your repo on your behalf, without you needing a personal GitHub token.
4. Back on the main Identity tab, click **Invite users** and invite yourself (your email). You'll get an email — click the link, set a password.
5. Visit `yoursite.com/admin`. Log in with that email/password. You're in.

That's the whole setup — no GitHub OAuth app needed.

## 4. Using the CMS

Once logged in at `/admin` you'll see five sections in the left sidebar:

- **Projects** — every case study on the site. Click **New Project** to add one, or open any existing project and use the **⋮ menu → Duplicate** to clone it as a starting point. Delete removes it.
- **Motion Reel Categories** — the subcategory groupings shown under the "Motion" filter on the homepage (Motion Reels, Ad Motion, etc).
- **Testimonials**
- **Team**
- **Site Settings** — hero headline/video, brand ticker logos, founder bio, contact email, footer text.

### Images
Click any image field → **Choose an image** → either upload a new file or pick one already in your media library.

### Video
Every video field gives you two options, and you can use either one:
- **Upload video file** — pick a file straight from your computer, same flow as images. Good for shorter clips.
- **Or paste a video URL** — a Vimeo, YouTube, or direct `.mp4` link. Better for longer/heavier files so your repo doesn't balloon in size — GitHub repos get unwieldy past a few hundred MB, and very large video files can slow down git operations.

If both are filled in, the uploaded file takes priority.

## 5. Local development

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`. Note the CMS (`/admin`) itself only works against
a deployed Netlify site with Git Gateway enabled — it won't log you in locally.

## What was fixed from the original prototype

- The Neon Nights Festival thumbnail was pointing at a dead/invalid Unsplash image ID — replaced with a working image.
- Added an automatic fallback so any image or video that fails to load swaps to a placeholder instead of showing a broken icon — future dead links won't visibly break the site.
- The old "CMS Simulator" modal was a non-functional visual mockup (buttons didn't do anything) — replaced with a real, working Decap CMS at `/admin`.
- All hardcoded content moved into `/content/*.json` files so it's actually editable.
- Contact and Start-a-Project forms now submit to Netlify Forms (previously they didn't go anywhere) — submissions show up under Site configuration → Forms in your Netlify dashboard.
- Added meta tags/favicon for link previews and browser tabs.

## A note on the sample Vimeo clips

The placeholder motion assets use signed Vimeo CDN links carried over from the
original prototype (`player.vimeo.com/external/...?s=...`). Signed links like
this can expire. They're now fully CMS-editable — if one ever stops playing,
open that entry in `/admin` and paste in a fresh URL or upload your own file.
