-- MR Realty — Supabase schema, Row Level Security and storage policies.
--
-- Run the whole file in the Supabase SQL Editor. It is safe to re-run.
--
-- Security model: the website talks to Supabase directly with the public anon
-- key, so THESE RULES are the security boundary. In summary:
--   * Only users listed in public.site_owners can create, edit or delete
--     listings or upload photos. Any other signed-in user can do nothing extra.
--   * Owners can only touch their own rows and their own "<user-id>/" photo folder.
--   * Visitors can read published listings only, and cannot see owner_id.
--   * owner_id, created_at and updated_at are controlled by the database,
--     not by the browser.
--   * Nobody can list the contents of the photo bucket.
--
-- After running, add your owner account (see STEP 6 at the bottom).

-- ---------------------------------------------------------------------------
-- 1. Site owners allow-list
-- ---------------------------------------------------------------------------
create table if not exists public.site_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS on with no policies = nobody can read or change this table through the
-- API. Manage it only from the SQL Editor / dashboard.
alter table public.site_owners enable row level security;
revoke all on public.site_owners from anon, authenticated;

-- Used by every policy below. SECURITY DEFINER so it can read site_owners even
-- though API users cannot; fixed search_path so it cannot be hijacked.
create or replace function public.is_site_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.site_owners where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_site_owner() from public;
grant execute on function public.is_site_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Properties table and data rules
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  location text not null check (char_length(location) between 1 and 100),
  type text not null check (type in ('Apartment', 'Villa', 'Townhouse', 'Penthouse')),
  price numeric(14, 2) not null check (price > 0),
  beds integer not null default 0 check (beds >= 0),
  baths integer not null default 0 check (baths >= 0),
  description text not null default '' check (char_length(description) <= 1600),
  image_url text not null,
  photos text[] not null default '{}',
  badge text not null default 'FOR SALE',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrades for projects created with the earlier version of this file.
alter table public.properties add column if not exists photos text[] not null default '{}';
alter table public.properties alter column owner_id set default auth.uid();

alter table public.properties drop constraint if exists properties_badge_check;
alter table public.properties add constraint properties_badge_check
  check (badge in ('FOR SALE', 'HOT DEAL', 'NEW LAUNCH', 'OFF PLAN'));

alter table public.properties drop constraint if exists properties_beds_max_check;
alter table public.properties add constraint properties_beds_max_check
  check (beds <= 50 and baths <= 50);

alter table public.properties drop constraint if exists properties_photos_check;
alter table public.properties add constraint properties_photos_check
  check (cardinality(photos) <= 20);

alter table public.properties drop constraint if exists properties_image_url_check;
alter table public.properties add constraint properties_image_url_check
  check (image_url ~ '^https://');

-- The database, not the browser, decides owner_id and timestamps, and every
-- photo URL must be https.
create or replace function public.properties_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  photo_url text;
begin
  if tg_op = 'INSERT' then
    -- Signed-in users always own what they create. (In the SQL Editor there is
    -- no signed-in user, so an explicitly given owner_id is kept for seeding.)
    new.owner_id := coalesce((select auth.uid()), new.owner_id);
    new.created_at := now();
  else
    new.owner_id := old.owner_id;     -- ownership can never be transferred
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();

  foreach photo_url in array new.photos loop
    if photo_url is null or photo_url !~ '^https://' then
      raise exception 'Every photo URL must use https' using errcode = '22023';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists properties_before_write on public.properties;
create trigger properties_before_write
  before insert or update on public.properties
  for each row execute function public.properties_before_write();

-- ---------------------------------------------------------------------------
-- 3. Table privileges (what each role may touch at all)
-- ---------------------------------------------------------------------------
-- Visitors: read-only, and only the public columns (owner_id stays hidden).
revoke all on public.properties from anon;
grant select (id, title, location, type, price, beds, baths, description,
              image_url, photos, badge, published, created_at)
  on public.properties to anon;

-- Signed-in users: normal CRUD, but no TRUNCATE / TRIGGER / REFERENCES.
-- RLS below further limits this to site owners and their own rows.
revoke all on public.properties from authenticated;
grant select, insert, update, delete on public.properties to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security on properties
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.properties force row level security;

drop policy if exists "Anyone can read published properties" on public.properties;
create policy "Anyone can read published properties"
  on public.properties for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Owners can read their own properties" on public.properties;
create policy "Owners can read their own properties"
  on public.properties for select
  to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_site_owner()));

drop policy if exists "Owners can insert their own properties" on public.properties;
create policy "Owners can insert their own properties"
  on public.properties for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_site_owner()));

drop policy if exists "Owners can update their own properties" on public.properties;
create policy "Owners can update their own properties"
  on public.properties for update
  to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_site_owner()))
  with check (owner_id = (select auth.uid()) and (select public.is_site_owner()));

drop policy if exists "Owners can delete their own properties" on public.properties;
create policy "Owners can delete their own properties"
  on public.properties for delete
  to authenticated
  using (owner_id = (select auth.uid()) and (select public.is_site_owner()));

create index if not exists properties_published_created_at_idx
  on public.properties (published, created_at desc);
create index if not exists properties_owner_id_idx
  on public.properties (owner_id);

-- ---------------------------------------------------------------------------
-- 5. Photo storage
-- ---------------------------------------------------------------------------
-- Public bucket: anyone with a photo's URL can view it (needed for the site),
-- but there is deliberately NO public SELECT policy, so nobody can list or
-- browse the bucket's contents. Only JPG/PNG/WebP up to 10 MB are accepted.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Removed: this let anyone list every file in the bucket.
drop policy if exists "Anyone can view property images" on storage.objects;

-- Owners can see their own folder (needed to replace or delete their photos).
drop policy if exists "Owners can view their property images" on storage.objects;
create policy "Owners can view their property images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_site_owner())
  );

drop policy if exists "Owners can upload property images" on storage.objects;
create policy "Owners can upload property images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    and (select public.is_site_owner())
  );

drop policy if exists "Owners can update their property images" on storage.objects;
create policy "Owners can update their property images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_site_owner())
  )
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    and (select public.is_site_owner())
  );

drop policy if exists "Owners can delete their property images" on storage.objects;
create policy "Owners can delete their property images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_site_owner())
  );

-- ---------------------------------------------------------------------------
-- 6. Add your owner account (run once, after creating the user in
--    Authentication -> Users). Replace the email, uncomment, and run.
-- ---------------------------------------------------------------------------
-- insert into public.site_owners (user_id)
-- select id from auth.users where email = 'owner@yourdomain.com'
-- on conflict do nothing;
