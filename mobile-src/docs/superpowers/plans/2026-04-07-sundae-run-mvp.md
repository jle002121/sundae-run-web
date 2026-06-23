# Sundae Run MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working iPhone ice cream tracker with logging, streaks, a calendar heatmap, and a profile screen — all backed by Supabase.

**Architecture:** Expo Router (file-based navigation) with three tabs (Home, Log, Profile). Pure streak computation functions live in `lib/streaks.ts` and are tested independently. Supabase handles auth, database, and photo storage. All UI is React Native with a shared theme.

**Tech Stack:** Expo SDK 52, React Native, TypeScript, Expo Router, Supabase (auth + database + storage), Google Places API, Jest + React Native Testing Library, expo-image-picker

---

## File Map

```
SundaeRun/
├── .env.local                          # API keys (never commit)
├── app/
│   ├── _layout.tsx                     # Root layout, auth gate
│   ├── (auth)/
│   │   ├── _layout.tsx                 # Auth stack layout
│   │   ├── login.tsx                   # Login screen
│   │   └── signup.tsx                  # Signup screen
│   └── (tabs)/
│       ├── _layout.tsx                 # Tab bar (Home · + · Profile)
│       ├── index.tsx                   # Home screen
│       ├── log.tsx                     # Log screen (+ tab)
│       └── profile.tsx                 # Profile screen
├── components/
│   ├── EntryCard.tsx                   # Single ice cream log row
│   ├── StatsRow.tsx                    # Scoops · Flavors · Shops
│   ├── StreakCalendarCard.tsx          # Combined streak + calendar card
│   ├── ShopSearch.tsx                  # Google Places shop search input
│   └── LogForm.tsx                     # Full log entry form
├── lib/
│   ├── supabase.ts                     # Supabase client singleton
│   ├── streaks.ts                      # Pure streak computation functions
│   └── entries.ts                      # Entry CRUD (create, fetch)
├── hooks/
│   ├── useAuth.ts                      # Auth state + sign in/out
│   └── useEntries.ts                   # Fetch entries, create entry
├── constants/
│   └── theme.ts                        # Colors, gradients, spacing
├── supabase/
│   └── schema.sql                      # Database schema
└── __tests__/
    ├── streaks.test.ts                 # Unit tests for streak logic
    └── entries.test.ts                 # Unit tests for entry helpers
```

---

## Task 1: Project Initialization

**Files:**
- Create: `SundaeRun/` (Expo project)
- Modify: `package.json` (add dependencies)
- Create: `.env.local`
- Create: `.gitignore` entry for `.env.local`

- [ ] **Step 1: Create the Expo project**

Run in your terminal (inside `/Users/jacoble/Downloads/`):
```bash
npx create-expo-app@latest SundaeRun --template blank-typescript
cd SundaeRun
```

- [ ] **Step 2: Install all dependencies**

```bash
npx expo install expo-router expo-image-picker expo-secure-store expo-file-system expo-constants @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

- [ ] **Step 3: Configure Expo Router in app.json**

Open `app.json` and replace its contents with:
```json
{
  "expo": {
    "name": "Sundae Run",
    "slug": "sundae-run",
    "version": "1.0.0",
    "scheme": "sundaerun",
    "web": { "bundler": "metro" },
    "ios": { "supportsTablet": false },
    "plugins": ["expo-router", "expo-image-picker"]
  }
}
```

- [ ] **Step 4: Configure Jest in package.json**

Add this to `package.json` (after `"dependencies"`):
```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ]
},
"scripts": {
  "test": "jest"
}
```

- [ ] **Step 5: Create .env.local**

```bash
touch .env.local
```

Add this content to `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_GOOGLE_PLACES_KEY=your_google_places_key_here
```

- [ ] **Step 6: Add .env.local to .gitignore**

Add to `.gitignore`:
```
.env.local
```

- [ ] **Step 7: Create folder structure**

```bash
mkdir -p app/\(auth\) app/\(tabs\) components lib hooks constants supabase __tests__
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize Expo project with dependencies"
```

---

## Task 2: Theme Constants

**Files:**
- Create: `constants/theme.ts`

- [ ] **Step 1: Create theme file**

Create `constants/theme.ts`:
```typescript
export const colors = {
  primary: '#5B3FA6',
  accent1: '#C9B8FF',
  accent2: '#FFB3C6',
  background: '#F7F0FF',
  card: '#FFFFFF',
  textSecondary: '#9B7ED4',
  textPrimary: '#1C1C1E',
  divider: '#EEE8FF',
} as const

export const gradients = {
  streakCard: ['#C9B8FF', '#FFB3C6'] as [string, string],
} as const

export const radii = {
  card: 20,
  button: 16,
  chip: 10,
  pill: 50,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const
```

- [ ] **Step 2: Commit**

```bash
git add constants/theme.ts
git commit -m "chore: add theme constants"
```

---

## Task 3: Supabase Setup

**Files:**
- Create: `supabase/schema.sql`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create a Supabase project (manual)**

1. Go to supabase.com → New project
2. Name it `sundae-run`
3. Save the database password somewhere safe
4. Once created, go to Settings → API
5. Copy **Project URL** → paste into `.env.local` as `EXPO_PUBLIC_SUPABASE_URL`
6. Copy **anon public** key → paste into `.env.local` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 2: Create the database schema**

Create `supabase/schema.sql`:
```sql
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
```

- [ ] **Step 3: Run schema in Supabase (manual)**

1. Go to your Supabase project → SQL Editor
2. Paste the entire contents of `supabase/schema.sql`
3. Click Run
4. Confirm no errors

- [ ] **Step 4: Create Supabase client**

Create `lib/supabase.ts`:
```typescript
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Entry = {
  id: string
  user_id: string
  flavor: string
  shop_name: string | null
  shop_place_id: string | null
  shop_lat: number | null
  shop_lng: number | null
  photo_url: string | null
  rating: number | null
  notes: string | null
  price: number | null
  is_public: boolean
  created_at: string
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql lib/supabase.ts
git commit -m "feat: add Supabase schema and client"
```

---

## Task 4: Streak Logic (TDD)

**Files:**
- Create: `lib/streaks.ts`
- Create: `__tests__/streaks.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `__tests__/streaks.test.ts`:
```typescript
import {
  computeDailyStreak,
  computeWeeklyStreak,
  computeMonthlyStreak,
  getCalendarDays,
} from '../lib/streaks'

// Helper: create a date string N days ago
const daysAgo = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

// Helper: create a date string in a specific month/year
const dateIn = (year: number, month: number, day: number): string =>
  new Date(year, month - 1, day, 12).toISOString()

describe('computeDailyStreak', () => {
  it('returns 0 when no entries', () => {
    expect(computeDailyStreak([])).toBe(0)
  })

  it('returns 0 when most recent entry is not today', () => {
    expect(computeDailyStreak([{ created_at: daysAgo(1) }])).toBe(0)
  })

  it('returns 1 when only today has an entry', () => {
    expect(computeDailyStreak([{ created_at: daysAgo(0) }])).toBe(1)
  })

  it('counts consecutive days including today', () => {
    const entries = [
      { created_at: daysAgo(0) },
      { created_at: daysAgo(1) },
      { created_at: daysAgo(2) },
    ]
    expect(computeDailyStreak(entries)).toBe(3)
  })

  it('stops counting at a gap', () => {
    const entries = [
      { created_at: daysAgo(0) },
      { created_at: daysAgo(1) },
      // gap: day 2 missing
      { created_at: daysAgo(3) },
    ]
    expect(computeDailyStreak(entries)).toBe(2)
  })

  it('counts multiple entries on the same day as one day', () => {
    const entries = [
      { created_at: daysAgo(0) },
      { created_at: daysAgo(0) }, // duplicate today
      { created_at: daysAgo(1) },
    ]
    expect(computeDailyStreak(entries)).toBe(2)
  })
})

describe('computeWeeklyStreak', () => {
  it('returns 0 when no entries', () => {
    expect(computeWeeklyStreak([])).toBe(0)
  })

  it('returns 1 when only this week has an entry', () => {
    expect(computeWeeklyStreak([{ created_at: daysAgo(0) }])).toBe(1)
  })

  it('counts consecutive weeks', () => {
    const entries = [
      { created_at: daysAgo(0) },  // this week
      { created_at: daysAgo(7) },  // last week
      { created_at: daysAgo(14) }, // 2 weeks ago
    ]
    expect(computeWeeklyStreak(entries)).toBe(3)
  })
})

describe('computeMonthlyStreak', () => {
  it('returns 0 when no entries', () => {
    expect(computeMonthlyStreak([])).toBe(0)
  })

  it('returns 1 when only this month has an entry', () => {
    expect(computeMonthlyStreak([{ created_at: daysAgo(0) }])).toBe(1)
  })
})

describe('getCalendarDays', () => {
  it('returns a set of date strings (YYYY-MM-DD) for days with entries', () => {
    const entries = [
      { created_at: dateIn(2026, 4, 5) },
      { created_at: dateIn(2026, 4, 5) }, // duplicate
      { created_at: dateIn(2026, 4, 7) },
    ]
    const days = getCalendarDays(entries)
    expect(days.has('2026-04-05')).toBe(true)
    expect(days.has('2026-04-07')).toBe(true)
    expect(days.size).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/streaks.test.ts --no-coverage
```

Expected: All tests FAIL with "Cannot find module '../lib/streaks'"

- [ ] **Step 3: Implement streak logic**

Create `lib/streaks.ts`:
```typescript
type EntryDate = { created_at: string }

// Convert ISO string to local YYYY-MM-DD
const toDateStr = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Today as YYYY-MM-DD
const todayStr = (): string => toDateStr(new Date().toISOString())

// Get unique days with entries as a Set of YYYY-MM-DD strings
export const getCalendarDays = (entries: EntryDate[]): Set<string> => {
  return new Set(entries.map(e => toDateStr(e.created_at)))
}

// Daily streak: consecutive days ending today
export const computeDailyStreak = (entries: EntryDate[]): number => {
  const days = getCalendarDays(entries)
  const today = todayStr()
  if (!days.has(today)) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  while (days.has(toDateStr(cursor.toISOString()))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Get ISO week key: "YYYY-WW"
const toWeekStr = (iso: string): string => {
  const d = new Date(iso)
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${d.getFullYear()}-${String(week).padStart(2, '0')}`
}

// Weekly streak: consecutive Mon–Sun weeks ending this week
export const computeWeeklyStreak = (entries: EntryDate[]): number => {
  const weeks = new Set(entries.map(e => toWeekStr(e.created_at)))
  const thisWeek = toWeekStr(new Date().toISOString())
  if (!weeks.has(thisWeek)) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)

  while (weeks.has(toWeekStr(cursor.toISOString()))) {
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}

// Get month key: "YYYY-MM"
const toMonthStr = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Monthly streak: consecutive calendar months ending this month
export const computeMonthlyStreak = (entries: EntryDate[]): number => {
  const months = new Set(entries.map(e => toMonthStr(e.created_at)))
  const thisMonth = toMonthStr(new Date().toISOString())
  if (!months.has(thisMonth)) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setDate(1)
  cursor.setHours(12, 0, 0, 0)

  while (months.has(toMonthStr(cursor.toISOString()))) {
    streak++
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return streak
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/streaks.test.ts --no-coverage
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/streaks.ts __tests__/streaks.test.ts
git commit -m "feat: add streak computation logic with tests"
```

---

## Task 5: Entry Operations

**Files:**
- Create: `lib/entries.ts`

- [ ] **Step 1: Create entry operations**

Create `lib/entries.ts`:
```typescript
import { supabase, Entry } from './supabase'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'

// Fetch all entries for the current user, newest first
export const fetchEntries = async (): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// Upload a photo to Supabase Storage, return public URL
export const uploadPhoto = async (localUri: string, userId: string): Promise<string> => {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const ext = localUri.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('entry-photos')
    .upload(path, decode(base64), { contentType: `image/${ext}` })

  if (error) throw error

  const { data } = supabase.storage.from('entry-photos').getPublicUrl(path)
  return data.publicUrl
}

export type NewEntry = {
  flavor: string
  shop_name?: string
  shop_place_id?: string
  shop_lat?: number
  shop_lng?: number
  photo_uri?: string  // local URI, will be uploaded
  rating?: number
  notes?: string
  price?: number
  is_public: boolean
}

// Create a new entry, uploading photo if provided
export const createEntry = async (input: NewEntry): Promise<Entry> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let photo_url: string | null = null
  if (input.photo_uri) {
    photo_url = await uploadPhoto(input.photo_uri, user.id)
  }

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      flavor: input.flavor,
      shop_name: input.shop_name ?? null,
      shop_place_id: input.shop_place_id ?? null,
      shop_lat: input.shop_lat ?? null,
      shop_lng: input.shop_lng ?? null,
      photo_url,
      rating: input.rating ?? null,
      notes: input.notes ?? null,
      price: input.price ?? null,
      is_public: input.is_public,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

- [ ] **Step 2: Install base64-arraybuffer**

```bash
npm install base64-arraybuffer
```

- [ ] **Step 3: Commit**

```bash
git add lib/entries.ts
git commit -m "feat: add entry CRUD and photo upload"
```

---

## Task 6: Auth Hook + Screens

**Files:**
- Create: `hooks/useAuth.ts`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/signup.tsx`
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create auth hook**

Create `hooks/useAuth.ts`:
```typescript
import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { session, loading, signIn, signUp, signOut }
}
```

- [ ] **Step 2: Create root layout with auth gate**

Create `app/_layout.tsx`:
```typescript
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useAuth } from '../hooks/useAuth'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '../constants/theme'

export default function RootLayout() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) router.replace('/(auth)/login')
    if (session && inAuth) router.replace('/(tabs)')
  }, [session, loading])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return <Slot />
}
```

- [ ] **Step 3: Create auth stack layout**

Create `app/(auth)/_layout.tsx`:
```typescript
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 4: Create Login screen**

Create `app/(auth)/login.tsx`:
```typescript
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { colors, spacing, radii } from '../../constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Fill in all fields')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>Sundae Run 🍨</Text>
      <Text style={styles.subtitle}>Track every scoop</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.textSecondary}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.textSecondary}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Log In'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/signup" style={styles.link}>
        No account? Sign up
      </Link>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl * 2 },
  input: {
    backgroundColor: colors.card, borderRadius: radii.button, padding: spacing.lg,
    marginBottom: spacing.md, fontSize: 16, color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent1, borderRadius: radii.button,
    padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm,
  },
  buttonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.textSecondary },
})
```

- [ ] **Step 5: Create Signup screen**

Create `app/(auth)/signup.tsx`:
```typescript
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { colors, spacing, radii } from '../../constants/theme'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSignup = async () => {
    if (!email || !password) return Alert.alert('Fill in all fields')
    if (password.length < 6) return Alert.alert('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signUp(email, password)
      Alert.alert('Check your email to confirm your account!')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>Sundae Run 🍨</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.textSecondary}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 chars)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.textSecondary}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl * 2 },
  input: {
    backgroundColor: colors.card, borderRadius: radii.button, padding: spacing.lg,
    marginBottom: spacing.md, fontSize: 16, color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent1, borderRadius: radii.button,
    padding: spacing.lg, alignItems: 'center', marginTop: spacing.sm,
  },
  buttonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: spacing.lg, color: colors.textSecondary },
})
```

- [ ] **Step 6: Commit**

```bash
git add hooks/useAuth.ts app/_layout.tsx app/\(auth\)/
git commit -m "feat: add auth hook and login/signup screens"
```

---

## Task 7: Entries Hook

**Files:**
- Create: `hooks/useEntries.ts`

- [ ] **Step 1: Create entries hook**

Create `hooks/useEntries.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react'
import { Entry } from '../lib/supabase'
import { fetchEntries, createEntry, NewEntry } from '../lib/entries'

export const useEntries = () => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchEntries()
      setEntries(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addEntry = useCallback(async (input: NewEntry): Promise<void> => {
    const entry = await createEntry(input)
    setEntries(prev => [entry, ...prev])
  }, [])

  return { entries, loading, error, refresh: load, addEntry }
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useEntries.ts
git commit -m "feat: add useEntries hook"
```

---

## Task 8: EntryCard Component

**Files:**
- Create: `components/EntryCard.tsx`

- [ ] **Step 1: Create EntryCard**

Create `components/EntryCard.tsx`:
```typescript
import { View, Text, Image, StyleSheet } from 'react-native'
import { Entry } from '../lib/supabase'
import { colors, spacing, radii } from '../constants/theme'

const FLAVOR_COLORS = ['#FFB3C6', '#C9B8FF', '#B8F0E6', '#FFE4A0', '#FFD6B3']

const flavorColor = (flavor: string): string =>
  FLAVOR_COLORS[flavor.charCodeAt(0) % FLAVOR_COLORS.length]

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Props = { entry: Entry }

export default function EntryCard({ entry }: Props) {
  return (
    <View style={styles.card}>
      {entry.photo_url ? (
        <Image source={{ uri: entry.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.colorChip, { backgroundColor: flavorColor(entry.flavor) }]} />
      )}
      <View style={styles.info}>
        <Text style={styles.flavor}>{entry.flavor}</Text>
        <Text style={styles.meta}>
          {entry.shop_name ?? 'Unknown shop'} · {formatDate(entry.created_at)}
        </Text>
        {entry.rating && (
          <Text style={styles.rating}>{'🍨'.repeat(entry.rating)}</Text>
        )}
      </View>
      <Text style={styles.privacy}>{entry.is_public ? '🌍' : '🔒'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: radii.card,
    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.xs,
  },
  colorChip: { width: 32, height: 32, borderRadius: radii.chip, flexShrink: 0 },
  photo: { width: 32, height: 32, borderRadius: radii.chip, flexShrink: 0 },
  info: { flex: 1 },
  flavor: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  rating: { fontSize: 10, marginTop: 2 },
  privacy: { fontSize: 14, opacity: 0.4 },
})
```

- [ ] **Step 2: Commit**

```bash
git add components/EntryCard.tsx
git commit -m "feat: add EntryCard component"
```

---

## Task 9: StatsRow Component

**Files:**
- Create: `components/StatsRow.tsx`

- [ ] **Step 1: Create StatsRow**

Create `components/StatsRow.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native'
import { Entry } from '../lib/supabase'
import { colors, spacing, radii } from '../constants/theme'

type Props = { entries: Entry[] }

export default function StatsRow({ entries }: Props) {
  const scoops = entries.length
  const flavors = new Set(entries.map(e => e.flavor.toLowerCase().trim())).size
  const shops = new Set(entries.filter(e => e.shop_place_id).map(e => e.shop_place_id!)).size

  const stats = [
    { value: scoops, label: 'scoops' },
    { value: flavors, label: 'flavors' },
    { value: shops, label: 'shops' },
  ]

  return (
    <View style={styles.row}>
      {stats.map(({ value, label }) => (
        <View key={label} style={styles.card}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  card: {
    flex: 1, backgroundColor: colors.card, borderRadius: radii.card,
    padding: spacing.md, alignItems: 'center',
  },
  value: { fontSize: 20, fontWeight: '800', color: colors.primary },
  label: { fontSize: 9, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
})
```

- [ ] **Step 2: Commit**

```bash
git add components/StatsRow.tsx
git commit -m "feat: add StatsRow component"
```

---

## Task 10: StreakCalendarCard Component

**Files:**
- Create: `components/StreakCalendarCard.tsx`

- [ ] **Step 1: Create StreakCalendarCard**

Create `components/StreakCalendarCard.tsx`:
```typescript
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Entry } from '../lib/supabase'
import {
  computeDailyStreak,
  computeWeeklyStreak,
  computeMonthlyStreak,
  getCalendarDays,
} from '../lib/streaks'
import { colors, gradients, spacing, radii } from '../constants/theme'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const toDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

type Props = { entries: Entry[] }

export default function StreakCalendarCard({ entries }: Props) {
  const [viewDate, setViewDate] = useState(new Date())
  const scoopDays = getCalendarDays(entries)

  const daily = computeDailyStreak(entries)
  const weekly = computeWeeklyStreak(entries)
  const monthly = computeMonthlyStreak(entries)

  // Build calendar grid for viewDate's month
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toDateStr(new Date())

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d)
  }
  const nextMonth = () => {
    const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d)
  }

  const streaks = [
    { icon: '🔥', value: daily, label: 'DAILY' },
    { icon: '✅', value: weekly, label: 'WEEKLY' },
    { icon: '📅', value: monthly, label: 'MONTHLY' },
  ]

  return (
    <LinearGradient colors={gradients.streakCard} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Streak counters */}
      <View style={styles.streakRow}>
        {streaks.map(({ icon, value, label }, i) => (
          <View key={label} style={styles.streakItem}>
            <Text style={styles.streakIcon}>{icon}</Text>
            <Text style={styles.streakValue}>{value}</Text>
            <Text style={styles.streakLabel}>{label}</Text>
            {i < 2 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.horizontalDivider} />

      {/* Calendar */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={prevMonth}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth}>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.grid}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Calendar cells */}
      <View style={styles.grid}>
        {Array.from({ length: firstDay }, (_, i) => (
          <View key={`empty-${i}`} style={styles.cell} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasScoop = scoopDays.has(dateStr)
          const isToday = dateStr === todayStr
          return (
            <View
              key={day}
              style={[
                styles.cell,
                hasScoop && styles.scoopCell,
                isToday && styles.todayCell,
              ]}
            >
              <Text style={[styles.dayNum, isToday && styles.todayNum, hasScoop && styles.scoopNum]}>
                {day}
              </Text>
            </View>
          )
        })}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, padding: spacing.lg, marginBottom: spacing.md },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, position: 'relative' },
  streakItem: { flex: 1, alignItems: 'center' },
  streakIcon: { fontSize: 20 },
  streakValue: { fontSize: 22, fontWeight: '800', color: 'white', lineHeight: 26 },
  streakLabel: { fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 0.5 },
  divider: { position: 'absolute', right: 0, top: 4, bottom: 4, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  horizontalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: spacing.md },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  arrow: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', paddingHorizontal: spacing.sm },
  monthLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 3 },
  cell: { width: '14.28%', aspectRatio: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  scoopCell: { backgroundColor: 'rgba(255,255,255,0.3)' },
  todayCell: { backgroundColor: 'white' },
  dayNum: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  scoopNum: { color: 'white' },
  todayNum: { color: colors.primary, fontWeight: '800' },
})
```

- [ ] **Step 2: Install expo-linear-gradient**

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 3: Commit**

```bash
git add components/StreakCalendarCard.tsx
git commit -m "feat: add StreakCalendarCard component"
```

---

## Task 11: Home Screen

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create tab bar layout**

Create `app/(tabs)/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router'
import { colors } from '../../constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: colors.divider,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log', tabBarIcon: () => <LogButton /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tabs>
  )
}

import { Text, View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { gradients } from '../../constants/theme'

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>
}

function LogButton() {
  return (
    <LinearGradient colors={gradients.streakCard} style={styles.logBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '300' }}>+</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  logBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
})
```

- [ ] **Step 2: Create Home screen**

Create `app/(tabs)/index.tsx`:
```typescript
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useEntries } from '../../hooks/useEntries'
import StreakCalendarCard from '../../components/StreakCalendarCard'
import StatsRow from '../../components/StatsRow'
import EntryCard from '../../components/EntryCard'
import { colors, spacing } from '../../constants/theme'

export default function HomeScreen() {
  const { entries, loading } = useEntries()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Sundae Run 🍨</Text>
          <View style={styles.avatar} />
        </View>

        {/* Streak + Calendar */}
        <StreakCalendarCard entries={entries} />

        {/* Stats */}
        <StatsRow entries={entries} />

        {/* Recent Scoops */}
        <Text style={styles.sectionLabel}>RECENT SCOOPS</Text>
        {loading && <Text style={styles.empty}>Loading…</Text>}
        {!loading && entries.length === 0 && (
          <Text style={styles.empty}>No scoops yet — tap + to log your first! 🍦</Text>
        )}
        {entries.slice(0, 10).map(entry => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  logo: { fontSize: 20, fontWeight: '700', color: colors.primary },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.sm },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: spacing.xl },
})
```

- [ ] **Step 3: Test on Expo Go**

```bash
npx expo start
```

Scan the QR code with your iPhone's camera. You should see the Home screen with the streak card, calendar, stats row, and empty state.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/
git commit -m "feat: add Home screen with streak card, calendar, and stats"
```

---

## Task 12: Shop Search Component

**Files:**
- Create: `components/ShopSearch.tsx`

- [ ] **Step 1: Get a Google Places API key (manual)**

1. Go to console.cloud.google.com
2. Create a new project called "SundaeRun"
3. Enable the **Places API**
4. Go to APIs & Services → Credentials → Create API Key
5. Copy the key → paste into `.env.local` as `EXPO_PUBLIC_GOOGLE_PLACES_KEY`

- [ ] **Step 2: Create ShopSearch component**

Create `components/ShopSearch.tsx`:
```typescript
import { useState } from 'react'
import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native'
import { colors, spacing, radii } from '../constants/theme'

export type Shop = {
  place_id: string
  name: string
  vicinity: string
  lat: number
  lng: number
}

type Props = {
  value: Shop | null
  onChange: (shop: Shop | null) => void
}

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY!

export default function ShopSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (text: string) => {
    setQuery(text)
    if (text.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(text + ' ice cream')}&key=${PLACES_KEY}`
      const res = await fetch(url)
      const json = await res.json()
      const shops: Shop[] = (json.results ?? []).slice(0, 5).map((r: any) => ({
        place_id: r.place_id,
        name: r.name,
        vicinity: r.formatted_address ?? r.vicinity ?? '',
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
      }))
      setResults(shops)
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const select = (shop: Shop) => {
    setQuery(shop.name)
    setResults([])
    onChange(shop)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    onChange(null)
  }

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a shop…"
          value={query}
          onChangeText={search}
          placeholderTextColor={colors.textSecondary}
        />
        {loading && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        {value && <TouchableOpacity onPress={clear}><Text style={styles.clear}>✕</Text></TouchableOpacity>}
      </View>
      {results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map(shop => (
            <TouchableOpacity key={shop.place_id} style={styles.result} onPress={() => select(shop)}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopAddr} numberOfLines={1}>{shop.vicinity}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.button, paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  input: { flex: 1, paddingVertical: spacing.lg, fontSize: 15, color: colors.textPrimary },
  spinner: { marginLeft: spacing.sm },
  clear: { color: colors.textSecondary, fontSize: 16, paddingLeft: spacing.sm },
  dropdown: { backgroundColor: colors.card, borderRadius: radii.button, overflow: 'hidden', marginBottom: spacing.sm },
  result: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  shopName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  shopAddr: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
})
```

- [ ] **Step 3: Commit**

```bash
git add components/ShopSearch.tsx
git commit -m "feat: add ShopSearch component with Google Places"
```

---

## Task 13: Log Screen

**Files:**
- Create: `components/LogForm.tsx`
- Create: `app/(tabs)/log.tsx`

- [ ] **Step 1: Create LogForm**

Create `components/LogForm.tsx`:
```typescript
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, Switch, Alert, ScrollView
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import ShopSearch, { Shop } from './ShopSearch'
import { NewEntry } from '../lib/entries'
import { colors, spacing, radii, gradients } from '../constants/theme'

type Props = {
  onSubmit: (entry: NewEntry) => Promise<void>
}

export default function LogForm({ onSubmit }: Props) {
  const [flavor, setFlavor] = useState('')
  const [shop, setShop] = useState<Shop | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const handleSubmit = async () => {
    if (!flavor.trim()) return Alert.alert('Add a flavor!')
    setLoading(true)
    try {
      await onSubmit({
        flavor: flavor.trim(),
        shop_name: shop?.name,
        shop_place_id: shop?.place_id,
        shop_lat: shop?.lat,
        shop_lng: shop?.lng,
        photo_uri: photoUri ?? undefined,
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        is_public: isPublic,
      })
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Photo */}
      <TouchableOpacity style={styles.photoArea} onPress={pickPhoto} onLongPress={pickFromLibrary}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoIcon}>📸</Text>
            <Text style={styles.photoHint}>Tap for camera · Hold for library</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Flavor */}
      <TextInput
        style={styles.input}
        placeholder="Flavor *"
        value={flavor}
        onChangeText={setFlavor}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Shop */}
      <ShopSearch value={shop} onChange={setShop} />

      {/* Rating */}
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(n === rating ? 0 : n)}>
            <Text style={[styles.scoopIcon, n <= rating && styles.scoopActive]}>🍨</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes…"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        placeholderTextColor={colors.textSecondary}
      />

      {/* Price (small, bottom) */}
      <TextInput
        style={[styles.input, styles.priceInput]}
        placeholder="$ Price (optional)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textSecondary}
      />

      {/* Public toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{isPublic ? '🌍 Public' : '🔒 Private'}</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ true: colors.accent1, false: colors.divider }}
          thumbColor={isPublic ? colors.primary : '#ccc'}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.submitWrapper}>
        <LinearGradient colors={gradients.streakCard} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.submitText}>{loading ? 'Logging…' : 'Log It 🍦'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  photoArea: { marginBottom: spacing.md },
  photoPreview: { width: '100%', height: 200, borderRadius: radii.card },
  photoPlaceholder: {
    height: 120, backgroundColor: colors.card, borderRadius: radii.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    borderColor: colors.divider, borderStyle: 'dashed',
  },
  photoIcon: { fontSize: 32, marginBottom: spacing.xs },
  photoHint: { fontSize: 11, color: colors.textSecondary },
  input: {
    backgroundColor: colors.card, borderRadius: radii.button,
    padding: spacing.lg, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.md,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  priceInput: { fontSize: 13, color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  scoopIcon: { fontSize: 28, opacity: 0.25 },
  scoopActive: { opacity: 1 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radii.button, padding: spacing.lg, marginBottom: spacing.lg,
  },
  toggleLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  submitWrapper: { marginTop: spacing.sm },
  submitBtn: { borderRadius: radii.button, padding: spacing.lg, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '700', fontSize: 16 },
})
```

- [ ] **Step 2: Create Log screen**

Create `app/(tabs)/log.tsx`:
```typescript
import { SafeAreaView, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import LogForm from '../../components/LogForm'
import { useEntries } from '../../hooks/useEntries'
import { colors, spacing } from '../../constants/theme'

export default function LogScreen() {
  const { addEntry } = useEntries()
  const router = useRouter()

  const handleSubmit = async (entry: Parameters<typeof addEntry>[0]) => {
    await addEntry(entry)
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>New Scoop 🍦</Text>
      <LogForm onSubmit={handleSubmit} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '800', color: colors.primary, padding: spacing.lg, paddingBottom: 0 },
})
```

- [ ] **Step 3: Test the full log flow on device**

In terminal:
```bash
npx expo start
```

1. Open app on iPhone
2. Tap the + tab
3. Add a flavor name, tap "Log It"
4. Confirm you return to Home and see the entry in Recent Scoops
5. Confirm the calendar dot fills in for today
6. Confirm streak counters updated

- [ ] **Step 4: Commit**

```bash
git add components/LogForm.tsx app/\(tabs\)/log.tsx
git commit -m "feat: add Log screen with full entry form"
```

---

## Task 14: Profile Screen

**Files:**
- Create: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Create Profile screen**

Create `app/(tabs)/profile.tsx`:
```typescript
import { SafeAreaView, FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useEntries } from '../../hooks/useEntries'
import { useAuth } from '../../hooks/useAuth'
import EntryCard from '../../components/EntryCard'
import { colors, spacing } from '../../constants/theme'

export default function ProfileScreen() {
  const { entries, loading, refresh } = useEntries()
  const { session, signOut } = useAuth()

  const email = session?.user?.email ?? ''

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.avatarLarge} />
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.count}>{entries.length} scoops logged</Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>ALL SCOOPS</Text>
          </View>
        }
        renderItem={({ item }) => <EntryCard entry={item} />}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No scoops yet — go get some ice cream! 🍦</Text> : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { marginBottom: spacing.md, alignItems: 'center' },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent1, marginBottom: spacing.md },
  email: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.xs },
  count: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  signOutBtn: { marginBottom: spacing.xl, padding: spacing.sm },
  signOutText: { color: colors.textSecondary, fontSize: 13 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, alignSelf: 'flex-start' },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },
})
```

- [ ] **Step 2: Test Profile on device**

1. Open app on iPhone
2. Tap Profile tab
3. Confirm all logged entries appear
4. Pull to refresh works
5. Sign out and confirm you return to login screen

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/profile.tsx
git commit -m "feat: add Profile screen with full log history"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests PASS

- [ ] **Step 2: Full device walkthrough**

Run through every success criterion from the spec:

```
✅ Can create an account and log in with email/password
✅ Can log an ice cream entry (flavor required, all others optional)
✅ Daily, weekly, and monthly streaks update after each log
✅ Calendar heatmap fills in for each day with a log
✅ Stats row shows correct scoops, distinct flavors, distinct shops
✅ Profile shows full log history, newest first
✅ App runs on iPhone via Expo Go
✅ Data persists in Supabase after closing and reopening app
✅ Price is stored but never shown on Home or Profile screens
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Sundae Run MVP — all screens, streaks, and Supabase integration"
```

---

## Setup Checklist (Do Before Starting)

Before Task 1, make sure you have these installed on your Mac:

| Tool | Check | Install |
|---|---|---|
| Node.js | `node -v` | nodejs.org → download LTS |
| Git | `git --version` | git-scm.com |
| VS Code or Cursor | Open it | code.visualstudio.com |
| Expo Go | On your iPhone | App Store → "Expo Go" |
| Supabase account | supabase.com | Free |
| Google Cloud account | console.cloud.google.com | Free (Places API has free tier) |
