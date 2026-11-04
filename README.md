# zoftware reach out

WhatsApp & email outreach CRM for Ottawa service businesses. Built for Zoftware Development: real lead ingestion from Google Places, AI-generated messages, click-to-chat WhatsApp, email drafts, and full pipeline tracking.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (shared project `zd-outreach-ng`, tables prefixed `zoftware_`)
- Groq (free tier) for AI message generation
- Google Places API for real Ottawa company data
- Vercel deployment

## Setup

### 1. Supabase
No new project needed — this shares `zd-outreach-ng` (`pplpwdufxfioqyzmirwc`). All tables are prefixed `zoftware_`, isolated from the Larkspur recruitment pipeline.

Run the migration:
```sh
supabase db push
```

### 2. Environment
Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Source |
|----------|--------|
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console → Places API |
| `GROQ_API_KEY` | https://console.groq.com/keys |
| `CRON_SECRET` | Random string: `openssl rand -hex 32` |

Supabase URL/keys are already set from the shared project.

### 3. Install & Run
```sh
pnpm install
pnpm dev
```

Visit `http://localhost:3000`, sign in with magic link.

### 4. Seed Saved Searches
```sh
pnpm tsx scripts/seed.ts
```

Seeds Ottawa searches for cleaning services, contractors, fitness studios, salons, and bakeries.

### 5. Ingest Leads
```sh
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/ingest
```

Or trigger via Vercel cron (daily at 8am UTC).

## How It Works

1. **Triage** (`/companies-to-approve`) — Ottawa companies from Google Places appear here. Approve to create a lead, discard to remove.
2. **Leads** (`/leads`) — Your pipeline. Filter by stage, click through to any lead.
3. **Lead Detail** (`/leads/[id]`) — Click "Open WhatsApp" to start a chat with a pre-filled number. Generate AI-tailored messages per stage. Prepare an email fallback. Update stage with one click.
4. **Settings** (`/settings`) — Manage saved searches and view ingestion history.

## Database Schema

All tables prefixed `zoftware_`:
- `zoftware_companies` — Real companies from Google Places
- `zoftware_contacts` — Decision-makers at each company
- `zoftware_leads` — Main tracking table (stage, source, follow-up dates)
- `zoftware_interactions` — Auto-logged WhatsApp/call/email history
- `zoftware_messages` — AI-generated messages per stage
- `zoftware_saved_searches` — Google Places search configurations
- `zoftware_ingestion_runs` — Cron job logging

## Outreach positioning

Messages introduce Mishael from Zoftware Development and offer websites and online stores for Ottawa service businesses (flat packages from $1,800 CAD, live in 2–4 weeks), per zoftwaredevelopment.com. All targeting is Ottawa, Ontario, with CAD pricing.