# Sundae Run — Project Agent

## What This Is
An iPhone app for tracking ice cream — flavors, shops, streaks, and stats. Think Strava but for ice cream. Built with Expo (React Native) + TypeScript + Supabase.

## GitHub
https://github.com/jle002121/SundaeRun

## Tech Stack
- **Mobile:** Expo SDK 54, React Native, TypeScript, Expo Router (file-based navigation)
- **Backend:** Supabase (auth + PostgreSQL database + photo storage)
- **Testing:** Jest + React Native Testing Library (16 tests, all passing)
- **Dev:** Run with `npx expo start`, test on iPhone via Expo Go

## Running the App
```bash
cd /Users/jacoble/Downloads/SundaeRun
npx expo start
```
Scan QR with iPhone camera. iPhone and Mac must be on the same WiFi network.

**Known issue:** If you get "request timed out", try:
```bash
npx expo start --port 19000
```
Ngrok tunnel (`--tunnel`) does not work reliably on this machine.

## Supabase Project
- URL: https://wnotlrbuzfiuxzpnkiwu.supabase.co
- Keys are in `.env.local` (not committed to git)
- Schema is in `supabase/schema.sql` — already run in Supabase SQL Editor

## App Screens
| Screen | File | Description |
|---|---|---|
| Home | `app/(tabs)/index.tsx` | Streak card, calendar heatmap, stats row, recent logs |
| Log | `app/(tabs)/log.tsx` | Add new ice cream entry form (photo camera + library buttons) |
| Shops | `app/(tabs)/shops.tsx` | Map of all visited shops (pins, callouts, visit counts) + shop list |
| Profile | `app/(tabs)/profile.tsx` | Full log history + sign out |
| Login | `app/(auth)/login.tsx` | Email/password login |
| Signup | `app/(auth)/signup.tsx` | Create account |

## Design System
Colors in `constants/theme.ts`:
- Primary: `#5B3FA6` (deep lavender)
- Accent1: `#C9B8FF` (soft purple)
- Accent2: `#FFB3C6` (soft pink)
- Background: `#F7F0FF` (lavender white)
- Gradient: `['#C9B8FF', '#FFB3C6']` — used on streak card and buttons

## Key Files
```
app/
  _layout.tsx              # Root layout with auth gate
  (auth)/login.tsx         # Login screen
  (auth)/signup.tsx        # Signup screen
  (tabs)/_layout.tsx       # Tab bar (Home · + · Shops · Profile)
  (tabs)/index.tsx         # Home screen
  (tabs)/log.tsx           # Log screen
  (tabs)/shops.tsx         # Map of visited shops
  (tabs)/profile.tsx       # Profile screen
components/
  EntryCard.tsx            # Single ice cream log row
  StatsRow.tsx             # Scoops · Flavors · Shops stats
  StreakCalendarCard.tsx   # Combined streak counters + calendar heatmap
  ShopSearch.tsx           # Google Places shop search
  LogForm.tsx              # Full entry form
hooks/
  useAuth.ts               # Auth state, signIn, signUp, signOut
  useEntries.ts            # Fetch entries, add entry, refresh
lib/
  supabase.ts              # Supabase client + Entry type
  streaks.ts               # Pure streak computation (daily/weekly/monthly)
  entries.ts               # fetchEntries, uploadPhoto, createEntry
constants/
  theme.ts                 # Colors, gradients, spacing, border radii
supabase/
  schema.sql               # Database schema + RLS policies
__tests__/
  streaks.test.ts          # 16 tests, all passing
```

## MVP Status — COMPLETE (code done, app not yet running on device)
All 15 implementation tasks are done:
- [x] Project setup + Expo Router
- [x] Theme constants
- [x] Supabase schema + client
- [x] Streak logic (16 tests passing)
- [x] Entry CRUD + photo upload
- [x] Auth hook + login/signup screens
- [x] useEntries hook
- [x] EntryCard + StatsRow components
- [x] StreakCalendarCard (gradient + calendar heatmap)
- [x] Home screen
- [x] ShopSearch (Google Places — key not yet set up)
- [x] Log screen
- [x] Profile screen

## Pending / Next Session
- [ ] **Fix device connection** — app builds fine but iPhone can't connect to Metro bundler (timeout). Try `npx expo start --port 19000` or check if school/office WiFi blocks peer connections.
- [ ] **Google Places API key** — shop search is built but needs a key. Get one at console.cloud.google.com → enable Places API → add to `.env.local` as `EXPO_PUBLIC_GOOGLE_PLACES_KEY`
- [ ] Test the full flow on device: sign up → log an entry → verify streak updates

## User Context
Jacob is the sole developer, no prior React Native experience. Keep explanations clear. He knows some Java from class but this is his first mobile app. Run all installs with `--legacy-peer-deps` due to peer dependency conflicts in this project.

## V2 Features (deferred)
- Social feed, following, kudos
- Map of shops visited
- Yearly Wrapped (shareable stats card)
- Apple Sign In
- App Store submission
