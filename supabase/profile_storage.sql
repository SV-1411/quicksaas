-- Gigzs profile + avatar storage setup

-- 1) Add profile fields to public.users
alter table public.users
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists ui_prefs jsonb not null default '{}'::jsonb;

-- 2) Create an avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- 3) Open access policies for avatars bucket (matches current open-access posture)
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "Anyone can upload avatars" on storage.objects;
create policy "Anyone can upload avatars" on storage.objects
for insert with check (bucket_id = 'avatars');

drop policy if exists "Anyone can update avatars" on storage.objects;
create policy "Anyone can update avatars" on storage.objects
for update using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

drop policy if exists "Anyone can delete avatars" on storage.objects;
create policy "Anyone can delete avatars" on storage.objects
for delete using (bucket_id = 'avatars');
