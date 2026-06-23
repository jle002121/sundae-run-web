-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Entries table
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  flavor text not null,
  shop_name text,
  shop_place_id text,
  shop_lat float,
  shop_lng float,
  photo_url text,
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  price float,
  is_public boolean default false not null,
  created_at timestamptz default now() not null
);

-- Row Level Security: users can only see/edit their own entries
alter table entries enable row level security;

create policy "Users can view their own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on entries for delete
  using (auth.uid() = user_id);

-- Storage bucket for ice cream photos
insert into storage.buckets (id, name, public) values ('entry-photos', 'entry-photos', true);

create policy "Users can upload their own photos"
  on storage.objects for insert
  with check (bucket_id = 'entry-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'entry-photos');
