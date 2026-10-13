# MR Realty

A responsive UAE real-estate website built with HTML, CSS and vanilla JavaScript. It includes property search and detail views, WhatsApp enquiry links, and a Supabase-backed owner dashboard.

## Preview

Open `index.html` in a browser. The included homes are sample preview listings. They are not shared or saved to a database; browser preview edits are intentionally not enabled without authentication.

## Connect Supabase

1. Create a Supabase project and run [`supabase-setup.sql`](./supabase-setup.sql) in its SQL Editor. The script is safe to re-run after future changes.
2. Create the owner account yourself in **Authentication → Users**. Keep public sign-ups disabled.
3. Add that account to the owner allow-list by running this in the SQL Editor (with your email):
   ```sql
   insert into public.site_owners (user_id)
   select id from auth.users where email = 'owner@yourdomain.com'
   on conflict do nothing;
   ```
4. In [`app.js`](./app.js), set `SUPABASE_URL` to the project URL and `SUPABASE_ANON_KEY` to the project's publishable/anon key. These browser-visible values are expected; never use a service-role or secret key here.
5. Set `WHATSAPP_NUMBER` to the business WhatsApp number in international format using digits only.
6. Serve the folder using any static host with HTTPS (for example, Netlify, Cloudflare Pages, or GitHub Pages). No build step is required.
7. Open the site and use **Owner login** in the footer. Sign in with the owner account you created.

## Security model

The browser talks to Supabase directly, so the database rules in `supabase-setup.sql` are the security boundary:

- Only accounts in `public.site_owners` can create, edit or delete listings or upload photos. Any other signed-in account (for example, if sign-ups are ever enabled by mistake) gets read-only access to published listings.
- Owners can only change their own listings and their own `<user-id>/` photo folder. The database sets `owner_id`, `created_at` and `updated_at`, so the browser cannot spoof them or transfer ownership.
- Visitors can only read published listings, and cannot see `owner_id`.
- Listing data is checked by the database (allowed property types and badges, sizes, https-only photo URLs, at most 20 photos).
- Photos must be JPG, PNG or WebP under 10 MB. Nobody can list the bucket's contents, though anyone with a photo's URL can view it, including photos on draft listings.

Do not disable RLS, use a service-role key in the browser, or share owner credentials.

## Notes

- Multiple property photos selected in the dashboard are uploaded to the `property-images` Supabase Storage bucket and shown in an interactive property gallery.
- Listing records can be added, edited, published, unpublished and removed from the owner dashboard.
- Starter listing photos are remote Unsplash sample images. Replace them with authorized listing photography before launch.
- Set your final WhatsApp phone number and Supabase project settings before publishing.
