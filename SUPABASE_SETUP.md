# Supabase Integration Setup

To make the leaderboard work, you need to set up your Supabase database and environment variables.

## 1. Environment Variables
Add the following keys to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

> **Note**: Use the **Service Role Key** (secret) for `SUPABASE_SECRET_KEY` because the API routes handling user updates need write access.

## 2. Database Schema
Run the following SQL in your Supabase SQL Editor to create the necessary table:

```sql
create table if not exists users (
  fid bigint primary key,
  username text,
  display_name text,
  pfp_url text,
  wallet_address text,
  score int default 0,
  reaction_time int default 999999,
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Optional: Enable RLS if you plan to use client-side logic later
alter table users enable row level security;

-- Policy for API service role (it bypasses RLS by default, so this is just if you use anon key)
-- create policy "Public read access" on users for select using (true);
```

## 3. Verify
1. Restart your dev server (`npm run dev`).
2. Open the app. Your user should appear in the `users` table in Supabase.
3. Play a game. Your score should update in the `users` table.
4. Check the Leaderboard tab. It should show the top players.
