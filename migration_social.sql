-- ══════════════════════════════════════════════════════════
-- Sundae Run — Social Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- Project: wnotlrbuzfiuxzpnkiwu.supabase.co
-- ══════════════════════════════════════════════════════════

-- 1. Add logged_date column to entries (user-selected date, separate from created_at)
alter table entries add column if not exists logged_date date;

-- Backfill logged_date from created_at for any existing entries
update entries set logged_date = created_at::date where logged_date is null;

-- 2. Profiles table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Anyone can view profiles"
  on profiles for select using (true);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- 3. Follows table
create table if not exists follows (
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Anyone can view follows"
  on follows for select using (true);

create policy "Users can follow others"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete using (auth.uid() = follower_id);

-- 4. Likes table
create table if not exists likes (
  entry_id uuid references entries(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (entry_id, user_id)
);

alter table likes enable row level security;

create policy "Anyone can view likes"
  on likes for select using (true);

create policy "Users can like entries"
  on likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike entries"
  on likes for delete using (auth.uid() = user_id);

-- 5. Allow viewing public entries from other users
-- (The existing "Users can view their own entries" policy remains — these stack with OR)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'entries' and policyname = 'Anyone can view public entries'
  ) then
    execute $policy$
      create policy "Anyone can view public entries"
        on entries for select
        using (is_public = true)
    $policy$;
  end if;
end $$;

-- ══════════════════════════════════════════════════════════
-- OPTIONAL: Disable email confirmation for easier testing
-- Dashboard → Authentication → Settings → "Enable email confirmations" OFF
-- ══════════════════════════════════════════════════════════
