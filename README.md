# MR Realty

A responsive UAE real-estate website built with HTML, CSS and vanilla JavaScript. It includes property search and detail views, WhatsApp enquiry links, and a Supabase-backed owner dashboard.

## Preview

Open `index.html` in a browser. The included homes are sample preview listings. They are not shared or saved to a database; browser preview edits are intentionally not enabled without authentication.

## Connect Supabase

1. Create a Supabase project and run [`supabase-setup.sql`](./supabase-setup.sql) in its SQL Editor.
2. Create the owner account yourself in **Authentication → Users**. Keep public sign-ups disabled so visitors cannot create dashboard accounts.
3. In [`app.js`](./app.js), set `SUPABASE_URL` to the project URL and `SUPABASE_ANON_KEY` to the project's publishable/anon key. These browser-visible values are expected; never use a service-role or secret key here.
4. Set `WHATSAPP_NUMBER` to the business WhatsApp number in international format using digits only.
5. Serve the folder using any static host with HTTPS (for example, Netlify, Cloudflare Pages, or GitHub Pages). No build step is required.
6. Open the site and use **Owner login** in the footer. Sign in with the owner account you created.

Row Level Security limits property writes to the authenticated `owner_id`. The storage policies likewise limit image uploads and management to the owner's UUID-prefixed folder. Public visitors can only read published property rows and public property images. Do not disable RLS or share owner credentials.

## Notes

- Multiple property photos selected in the dashboard are uploaded to the `property-images` Supabase Storage bucket and shown in an interactive property gallery.
- Listing records can be added, edited, published, unpublished and removed from the owner dashboard.
- Starter listing photos are remote Unsplash sample images. Replace them with authorized listing photography before launch.
- Set your final WhatsApp phone number and Supabase project settings before publishing.
