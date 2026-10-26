# Supabase test setup

This copy keeps the existing site content as a local fallback and can read published content from Supabase. Its experimental admin screen is at `/supabase-admin/`; the original Decap screen at `/admin/` remains available for comparison.

## 1. Create a Supabase project

Create a separate Supabase project for this experiment. Do not connect it to production data.

## 2. Create the content table

In Supabase, open **SQL Editor** and run `supabase/migrations/202610260001_site_content.sql`.

The table stores the existing JSON content records. Visitors can read published records. Only signed-in users whose trusted `app_metadata.role` is `admin` can manage records.

## 3. Add your first admin

In Supabase **Authentication > Users**, create a user for your own email with a password. Then run this in SQL Editor, replacing the email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'you@example.com';
```

Sign out and sign back in after changing the role so the new role is in the session token.

## 4. Configure the app

Copy `.env.example` to `.env`. Put your project's URL and publishable key in the `VITE_` settings. Add the project URL and secret key to `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for the one-time content import.

Keep the secret key local. It is only used by `npm run seed:content`, never by the browser. For Netlify, add only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as site environment variables, then trigger a deploy.

## 5. Import the current site content

Install project dependencies, then run:

```sh
npm run seed:content
```

This imports site settings, the about page, projects, categories, testimonials, and team members. The command can be run again after editing the local JSON content; it updates matching records by collection and slug.

## 6. Try the Supabase admin

Run the site locally with `npm run dev`, open `/supabase-admin/`, and sign in with the admin account. The dashboard can create, edit, publish, unpublish, and delete JSON content records. The public site reads published records from Supabase after startup.

The custom admin checks the user's trusted app metadata role. Do not grant the role through editable user metadata.
