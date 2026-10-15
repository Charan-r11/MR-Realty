-- Run in the Supabase SQL Editor after creating your project.
-- Create the owner account in Supabase Dashboard > Authentication > Users.
-- Public anon keys belong in app.js; never use a service-role key in the browser.
--
-- Before running against an existing project, inspect policies on properties
-- and storage.objects. PostgreSQL combines permissive policies with OR, so any
-- additional broad policy can grant access beyond the policies defined here:
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where (schemaname = 'public' and tablename = 'properties')
--    or (schemaname = 'storage' and tablename = 'objects')
-- order by schemaname, tablename, policyname;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  location text not null check (char_length(location) between 1 and 100),
  type text not null check (type in ('Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio')),
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

alter table public.properties
  add column if not exists photos text[] not null default '{}';
alter table public.properties
  add column if not exists launch_date date,
  add column if not exists reservation_amount numeric(14, 2),
  add column if not exists is_hot_deal boolean not null default false,
  add column if not exists is_featured boolean not null default false;

alter table public.properties
  add column if not exists region text not null default '',
  add column if not exists property_status text not null default 'ready',
  add column if not exists is_new_launch boolean not null default false;

alter table public.properties drop constraint if exists properties_type_check;
alter table public.properties
  add constraint properties_type_check
  check (type in ('Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio'));

alter table public.properties drop constraint if exists properties_property_status_check;
alter table public.properties
  add constraint properties_property_status_check
  check (property_status in ('ready', 'off_plan'));

update public.properties
set is_hot_deal = true
where lower(badge) = 'hot deal' and is_hot_deal = false;

-- Only project administrators can manage this allowlist. Add the owner's Auth
-- user UUID after running this setup; do not grant membership to all users.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.mr_realty_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  authorized_at timestamptz not null default now()
);
revoke all on table private.mr_realty_owners from public, anon, authenticated;
alter table private.mr_realty_owners enable row level security;

-- After this migration has run, authorize only the intended Auth user in a
-- separate SQL Editor query. Replace the placeholder with that user's UUID:
--
-- insert into private.mr_realty_owners (user_id)
-- values ('<AUTH_USER_UUID>'::uuid)
-- on conflict (user_id) do nothing;

create or replace function public.is_mr_realty_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.mr_realty_owners
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_mr_realty_owner() from public, anon;
grant execute on function public.is_mr_realty_owner() to authenticated;

alter table public.properties enable row level security;

drop policy if exists "Anyone can read published properties" on public.properties;
create policy "Anyone can read published properties"
  on public.properties for select
  using (published = true);

drop policy if exists "Owners can read their own properties" on public.properties;
create policy "Owners can read their own properties"
  on public.properties for select to authenticated
  using (
    public.is_mr_realty_owner()
    and owner_id = (select auth.uid())
  );

drop policy if exists "Owners can insert their own properties" on public.properties;
create policy "Owners can insert their own properties"
  on public.properties for insert to authenticated
  with check (
    public.is_mr_realty_owner()
    and owner_id = (select auth.uid())
  );

drop policy if exists "Owners can update their own properties" on public.properties;
create policy "Owners can update their own properties"
  on public.properties for update to authenticated
  using (
    public.is_mr_realty_owner()
    and owner_id = (select auth.uid())
  )
  with check (
    public.is_mr_realty_owner()
    and owner_id = (select auth.uid())
  );

drop policy if exists "Owners can delete their own properties" on public.properties;
create policy "Owners can delete their own properties"
  on public.properties for delete to authenticated
  using (
    public.is_mr_realty_owner()
    and owner_id = (select auth.uid())
  );

create index if not exists properties_published_created_at_idx
  on public.properties (published, created_at desc);

create table if not exists public.company_settings (
  id boolean primary key default true check (id is true),
  company_name text not null default 'MR Realty',
  tagline text not null default '',
  logo_url text not null default '',
  about_text text not null default '',
  business_phone text not null default '',
  whatsapp_number text not null default '',
  contact_email text not null default '',
  office_address text not null default '',
  website_headline text not null default '',
  homepage_introduction text not null default '',
  about_heading text not null default '',
  about_summary text not null default '',
  contact_heading text not null default '',
  contact_text text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  linkedin_url text not null default '',
  footer_text text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.company_settings
  add column if not exists x_url text not null default '',
  add column if not exists youtube_url text not null default '',
  add column if not exists tiktok_url text not null default '';
alter table public.company_settings add column if not exists site_content jsonb not null default '{}'::jsonb;
alter table public.company_settings enable row level security;
revoke all on table public.company_settings from public, anon, authenticated;
grant select on table public.company_settings to anon, authenticated;
grant insert, update on table public.company_settings to authenticated;

drop policy if exists "Anyone can read published company settings" on public.company_settings;
create policy "Anyone can read published company settings"
  on public.company_settings for select to anon, authenticated
  using (true);

drop policy if exists "Authorized owners can create company settings" on public.company_settings;
create policy "Authorized owners can create company settings"
  on public.company_settings for insert to authenticated
  with check (public.is_mr_realty_owner() and id is true);

drop policy if exists "Authorized owners can update company settings" on public.company_settings;
create policy "Authorized owners can update company settings"
  on public.company_settings for update to authenticated
  using (public.is_mr_realty_owner() and id is true)
  with check (public.is_mr_realty_owner() and id is true);

-- One public image bucket. Object policies restrict every write to the signed-in
-- owner's own UUID-prefixed directory; public visitors can only read images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Anyone can view property images" on storage.objects;
create policy "Anyone can view property images"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Owners can upload property images" on storage.objects;
create policy "Owners can upload property images"
  on storage.objects for insert to authenticated
  with check (
    public.is_mr_realty_owner()
    and bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Owners can update their property images" on storage.objects;
create policy "Owners can update their property images"
  on storage.objects for update to authenticated
  using (
    public.is_mr_realty_owner()
    and bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    public.is_mr_realty_owner()
    and bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Owners can delete their property images" on storage.objects;
create policy "Owners can delete their property images"
  on storage.objects for delete to authenticated
  using (
    public.is_mr_realty_owner()
    and bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
