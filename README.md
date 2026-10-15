# MR Realty

A responsive UAE real-estate website built with HTML, CSS and vanilla JavaScript. It includes property search and detail views, WhatsApp enquiry links, and a Supabase-backed owner dashboard.

## Preview

Open `index.html` in a browser. The included homes are sample preview listings. They are not shared or saved to a database; browser preview edits are intentionally not enabled without authentication.

## Connect Supabase

1. In the Supabase Dashboard, confirm you have the correct project and back up/export any existing policies you rely on. The migration in [`supabase-setup.sql`](./supabase-setup.sql) replaces the named MR Realty policies and re-applies the existing bucket configuration; inspect its opening `pg_policies` query and remove/reconcile any extra broad policies before running it.
2. Run the reviewed [`supabase-setup.sql`](./supabase-setup.sql) in the project’s SQL Editor. It keeps existing property rows, adds launch/reservation/featured fields and the company-settings table, enables RLS, and adds authorization policies. It does not insert demo listings or execute any SQL from the browser.
3. Create the owner account yourself in **Authentication → Users**. Keep public sign-ups disabled so visitors cannot create dashboard accounts.
4. In **Authentication → Users**, copy that user's UUID. In the SQL Editor, authorize only that account:

   ```sql
   insert into private.mr_realty_owners (user_id)
   values ('<AUTH_USER_UUID>'::uuid)
   on conflict (user_id) do nothing;
   ```

   Replace `<AUTH_USER_UUID>` with the copied UUID. The private allowlist is not accessible through the browser API; the SQL Editor administrator manages it.
5. In [`app.js`](./app.js), set `SUPABASE_URL` to the project URL and `SUPABASE_ANON_KEY` to the project's publishable/anon key. These browser-visible values are expected; never use a service-role or secret key here.
6. Set `WHATSAPP_NUMBER` to the business WhatsApp number in international format using digits only.
7. Serve the folder using any static host with HTTPS (for example, Netlify, Cloudflare Pages, or GitHub Pages). No build step is required.
8. Open the site and use **Owner login** in the footer. Sign in with the authorized owner account, open **Company Settings and Website Content**, then save the company details. Existing HTML text remains as the initial public presentation until a settings row is saved.

Row Level Security limits property management, company-setting writes, and image writes to users explicitly listed in `private.mr_realty_owners`, and additionally binds records and image paths to the signed-in user's UUID. Public visitors can read published property rows, the public-facing company settings row, and public property images. All columns in `company_settings` are intended for publication, including contact details. Do not store private information in that table, disable RLS, or share owner credentials.

## Notes

- Multiple property photos selected in the dashboard are uploaded to the `property-images` Supabase Storage bucket and shown in an interactive property gallery.
- Listing records can be added, edited, published, unpublished and removed from the owner dashboard. Launch date, reservation amount, featured-home status and Hot Deal status are editable there.
- A saved company logo is uploaded to the same bucket. Property and logo uploads are restricted to the authorized owner's UUID-prefixed folder.
- After running the migration and saving Company Settings, test public changes by refreshing the page; verify owner-only actions while signed in and confirm a non-authorized account cannot write.
- Starter listing photos are remote Unsplash sample images. Replace them with authorized listing photography before launch.
- Set your final WhatsApp phone number and Supabase project settings before publishing.

## Filters, sections and footer icons

- Property types: Apartment, Villa, Townhouse, Penthouse and Studio. Locations cover every UAE emirate and the main Middle Eastern countries.
- Each listing is shown in one or more sections chosen in the owner dashboard: Featured Homes, Today's Hot Deals, New Launches.
- The footer shows Instagram, Facebook, LinkedIn, X, YouTube, TikTok, email and phone icons only for values saved in the owner dashboard (Company settings). Empty fields show nothing.
- After pulling these changes, re-run `supabase-setup.sql` in the Supabase SQL Editor. It is idempotent and adds the Studio type, `region`, `property_status`, `is_new_launch` and the new social columns.
