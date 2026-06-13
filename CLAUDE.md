# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint via next lint
```

No test suite is configured.

## Environment Setup

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The database schema lives in `supabase/schema.sql`. Run it in the Supabase SQL Editor to initialize. Two storage buckets are also required: `animal-photos` (public) and `medical-attachments` (private).

## Architecture

**Stable** is a ranch management app (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).

### Data Flow Pattern

Pages under `app/dashboard/` follow a consistent split:
- **Server Components** (page.tsx files) authenticate via `lib/supabase/server.ts`, verify barn membership/role, fetch initial data, and pass it as props.
- **Client Components** (components/) receive that initial data, then re-fetch on mount and subscribe to Supabase Realtime (`postgres_changes`) for live updates.

Always use `lib/supabase/server.ts` in Server Components and Route Handlers; use `lib/supabase/client.ts` in `'use client'` components.

### Route Structure

```
app/
├── login/ signup/          # Public auth pages
├── auth/callback/          # OAuth/magic link callback (Route Handler)
└── dashboard/
    ├── layout.tsx           # Auth gate + loads user's barns for nav
    ├── page.tsx             # Barn selector / onboarding
    ├── join/                # Join barn via code
    └── barn/[barnId]/
        ├── page.tsx         # Chores (TaskList)
        ├── animals/         # Animal grid + individual profiles
        ├── calendar/        # Events calendar
        └── settings/        # Members, roles, join code, danger zone
```

### Core Data Model

All data is barn-scoped. Every table has `barn_id` with cascade deletes and Row Level Security enforced at the DB level. Key tables: `barns`, `barn_members`, `tasks`, `animals`, `animal_medical_records`, `events`, `profiles`, `audit_log`.

**Roles** (enforced in both DB RLS and UI): `owner > manager > member > viewer`. The `canEdit` / `canDelete` pattern in components checks `userRole` prop against these values — don't bypass this by reading from the DB client-side.

**Tasks** support `repeat_type` (`daily`/`weekly`/`monthly`). The reset logic runs client-side in `TaskList` on mount — when a recurring task's `completed_at` is old enough, it gets reset to `todo` in the DB.

### Supabase Realtime

Subscriptions use the pattern `supabase.channel('name').on('postgres_changes', { filter: 'barn_id=eq.X' }, handler).subscribe()`. Always clean up with `supabase.removeChannel(channel)` in the `useEffect` return.

### Styling

Tailwind with two custom color scales defined in `tailwind.config.ts`:
- `stable-50` through `stable-900`: warm browns — the primary UI palette
- `chore-todo` (yellow), `chore-progress` (blue), `chore-done` (green): task status colors

### Profiles

User display names come from the `profiles` table (not directly from `auth.users`). When showing a member's name, query `profiles` by `user_id` — the `TaskList` and settings page both do a two-step query: fetch `barn_members` first, then fetch `profiles` by the resulting user IDs. Supabase RLS blocks direct joins on `auth.users`.
