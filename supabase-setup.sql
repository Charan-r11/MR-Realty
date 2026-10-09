-- Run in the Supabase SQL Editor after creating your project.
-- Create the owner account in Supabase Dashboard > Authentication > Users.
-- Public anon keys belong in app.js; never use a service-role key in the browser.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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

alter table public.properties
  add column if not exists photos text[] not null default '{}';

alter table public.properties enable row level security;

drop policy if exists "Anyone can read published properties" on public.properties;
create policy "Anyone can read published properties"
  on public.properties for select
  using (published = true);

drop policy if exists "Owners can read their own properties" on public.properties;
create policy "Owners can read their own properties"
  on public.properties for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Owners can insert their own properties" on public.properties;
create policy "Owners can insert their own properties"
  on public.properties for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update their own properties" on public.properties;
create policy "Owners can update their own properties"
  on public.properties for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their own properties" on public.properties;
create policy "Owners can delete their own properties"
  on public.properties for delete to authenticated
  using (owner_id = (select auth.uid()));

create index if not exists properties_published_created_at_idx
  on public.properties (published, created_at desc);

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
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Owners can update their property images" on storage.objects;
create policy "Owners can update their property images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Owners can delete their property images" on storage.objects;
create policy "Owners can delete their property images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
