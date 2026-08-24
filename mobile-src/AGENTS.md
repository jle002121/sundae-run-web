# Sundae Run Mobile Instructions

This directory is an Expo application. These instructions supersede broader repository guidance for mobile work.

- `.env.local` is private local configuration and must never be printed or committed.
- Stack: Expo SDK 54, React Native, TypeScript, Expo Router, and Supabase. Use `npm test` for tests and `npm start` for the Expo development server.
- Use `npm install --legacy-peer-deps` when dependency installation is necessary.
- If a device cannot reach Metro, try `npx expo start --port 19000`; do not assume a tunnel will work on this machine.
- Keep changes consistent with `app.json`, `tsconfig.json`, and the deployment settings in `vercel.json`.
- Preserve the design tokens in `constants/theme.ts`: primary `#5B3FA6`, lavender `#C9B8FF`, pink `#FFB3C6`, and background `#F7F0FF`.
- Supabase schema and RLS changes belong in the repository's schema/migration files. Never place service-role keys in client code.
- Use this file and the repository specifications as the active instructions.
