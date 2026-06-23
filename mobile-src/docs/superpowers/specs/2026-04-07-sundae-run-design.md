# Sundae Run — MVP Design Spec
**Date:** 2026-04-07
**Version:** 1.0
**Status:** Approved

---

## Overview

Sundae Run is an iPhone app for tracking ice cream — flavors, shops, streaks, and stats. Think Strava but for ice cream. Inspired by a friend who tracked every ice cream she ate in 2025 manually on Google Docs. V1 is a personal tracker; V2 adds social (feed, kudos, following) and Yearly Wrapped.

---

## Scope — MVP (V1)

### Screens
| Screen | Description |
|---|---|
| Home | Personal dashboard — streak+calendar card, stats row, recent logs |
| Log (＋) | Add a new ice cream entry |
| Profile | Full scrollable log history |

### Tab Bar
3 tabs only: **Home · ＋ · Profile**

### Explicitly Out of Scope for V1
- Social feed, following, kudos
- Map of shops visited
- Yearly Wrapped
- Apple Sign In
- App Store submission

---

## Visual Design

**Aesthetic:** Soft & Dreamy
**Colors:**
- Primary: `#5B3FA6` (deep lavender)
- Accent 1: `#C9B8FF` (soft purple)
- Accent 2: `#FFB3C6` (soft pink)
- Background: `#F7F0FF` (lavender white)
- Card background: `#FFFFFF`
- Secondary text: `#9B7ED4`

**Gradient:** `linear-gradient(135deg, #C9B8FF, #FFB3C6)` — used on streak card and primary buttons

**Typography:** System UI (San Francisco on iOS) — clean, no custom fonts needed for MVP

---

## Screen Designs

### Home Screen

Top to bottom (scrollable):

1. **Header** — "Sundae Run 🍨" + avatar circle (top right)
2. **Streak + Calendar Card** (single gradient card)
   - Top half: three streak counters side by side — 🔥 Daily · ✅ Weekly · 📅 Monthly
   - Thin white divider
   - Bottom half: compact monthly calendar heatmap — scoop days lit in soft purple, today highlighted in `#C9B8FF`, empty days faint
   - Month label + left/right arrows to swipe between months
3. **Stats Row** — 3 white cards: Scoops · Flavors · Shops
   - ⚠️ No $ spend shown — hidden from dashboard entirely
4. **"Recent Scoops" label**
5. **Log entries** — each entry shows: flavor emoji color chip, flavor name, shop name, date, public/private icon (🌍 or 🔒)

### Log Screen (＋ flow)

Single scrollable form:

| Order | Field | Type | Required |
|---|---|---|---|
| 1 | Photo | Camera / library tap area | Optional |
| 2 | Flavor | Text input | Required |
| 3 | Shop | Google Places search | Optional |
| 4 | Rating | 1–5 🍨 tap row | Optional |
| 5 | Notes | Caption text field | Optional |
| 6 | Price | Number input (small, bottom) | Optional |
| 7 | Public / Private | Toggle (default: private) | Required |

**Submit:** "Log It" — full-width gradient button
**After submit:** Navigate to Home, streak updates, calendar dot fills for today

### Profile Screen

- User avatar + name at top
- Full log history — same entry card format as Home recent logs
- Newest entries at top, infinite scroll
- No spend stats shown here

---

## Data Model

### Users (Supabase Auth)
| Field | Type |
|---|---|
| id | UUID (auto) |
| email | string |
| display_name | string |
| avatar_url | string (optional) |
| created_at | timestamp |

### Entries
| Field | Type | Notes |
|---|---|---|
| id | UUID (auto) | |
| user_id | UUID | FK → users |
| flavor | string | Required |
| shop_name | string | Optional |
| shop_place_id | string | Google Places ID |
| shop_lat | float | Optional |
| shop_lng | float | Optional |
| photo_url | string | Supabase Storage URL |
| rating | int (1–5) | Optional |
| notes | string | Optional |
| price | float | Stored, never shown on dashboard |
| is_public | boolean | Default false |
| created_at | timestamp | Auto |

---

## Streak Logic

All three streaks run independently and are **strict — no freeze mechanic.**

| Streak | Rule | Reset condition |
|---|---|---|
| Daily | At least 1 entry today | Miss any calendar day |
| Weekly | At least 1 entry in the Mon–Sun week | Miss an entire week |
| Monthly | At least 1 entry in the calendar month | Miss an entire month |

Streaks are **computed from entries** at render time — no separate streak table needed for MVP. Query entries, group by day/week/month, count backwards from today.

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Mobile | Expo (React Native) | JavaScript, runs on iPhone |
| Dev testing | Expo Go (iPhone app) | No Xcode required during dev |
| Backend | Supabase | Auth, database, file storage |
| Auth | Supabase Auth | Email/password for MVP |
| Photos | Supabase Storage | Ice cream photo uploads |
| Location | Google Places API | Shop search and tagging — requires free API key from Google Cloud Console |
| Editor | VS Code or Cursor | User runs commands, Claude writes code |

---

## MVP Success Criteria

The MVP is complete when all of the following are true:

- [ ] User can create an account and log in with email/password
- [ ] User can log an ice cream entry (flavor required, all other fields optional)
- [ ] Daily, weekly, and monthly streaks compute correctly and update after each log
- [ ] Calendar heatmap fills in correctly for each day with a log
- [ ] Stats row shows correct scoops (total entries), flavors tried (distinct flavor names), and shops visited (distinct shop_place_ids) counts
- [ ] Profile screen shows full log history, newest first
- [ ] App runs on a real iPhone via Expo Go
- [ ] All data persists in Supabase (survives app close and reopen)
- [ ] Price is stored but never displayed on Home or Profile screens

---

## V2 Features (Deferred)

- Social feed — public posts, following, kudos
- Map tab — geo map of every shop visited
- Yearly Wrapped — shareable stats card (scoops, top flavor, top shop, streak, peak month, personality type)
- Spend stats — total $, avg per scoop, most expensive shop (opt-in, in Wrapped only)
- Apple Sign In
- App Store submission
- Ice cream shop partnerships / verified shops
