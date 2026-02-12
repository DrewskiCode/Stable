# Stable 🐴

Ranch management made simple. Organize chores, track animals, and keep your team in sync.

## Features

- ✅ **Shared Chores** - Real-time task tracking so no one repeats work
- 🐎 **Animal Profiles** - Photos, medical history, and details in one place
- 📅 **Calendar** - Track events and upcoming appointments
- 👥 **Team Collaboration** - Invite members with role-based permissions
- ☁️ **Cloud Sync** - Access from any device, always up to date

## Tech Stack

- **Frontend**: Next.js 14 (React) + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Database**: PostgreSQL with Row Level Security

## Getting Started

### 1. Clone and Install

```bash
cd Stable
npm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your project URL and anon key
3. Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

4. Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Initialize Database

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the contents of `supabase/schema.sql`
3. Create storage buckets:
   - Go to **Storage** → Create bucket named `animal-photos` (public)
   - Create bucket named `medical-attachments` (private)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── barn/[barnId]/ # Barn-specific pages
│   │   └── help/          # Help & info pages
│   └── auth/callback/     # OAuth callback handler
├── components/            # React components
│   ├── dashboard/         # Navigation, layouts
│   ├── tasks/             # Chore list components
│   └── animals/           # Animal grid, profiles
└── lib/                   # Utilities
    ├── supabase/          # Supabase client configs
    └── types.ts           # TypeScript types
```

## User Roles

| Role    | Permissions                                      |
|---------|--------------------------------------------------|
| Owner   | Full control, delete barn, manage roles          |
| Manager | Add/edit chores, animals, events; invite members |
| Member  | Check off chores, add notes, view info           |
| Viewer  | Read-only access                                 |

## Build Phases

- [x] **Phase 1**: Project setup + Auth
- [x] **Phase 2**: Barn onboarding + invites
- [x] **Phase 3**: Chores (real-time task list)
- [ ] **Phase 4**: Calendar
- [x] **Phase 5**: Animals + photos
- [x] **Phase 6**: Help/Settings pages

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

Or connect your GitHub repo to Vercel for auto-deploys.

## License

MIT
