-- zoftware-reach-out initial schema
-- Website & online store outreach CRM for Ottawa service businesses

create extension if not exists pgcrypto;

-- Enums
create type zoftware_industry as enum (
  'cleaning', 'contractor', 'fitness', 'salon', 'bakery', 'retail', 'hospitality',
  'professional_services', 'other'
);

create type zoftware_lead_stage as enum (
  'prospect', 'contacted', 'replied', 'meeting', 'client', 'disqualified', 'unreachable'
);

create type zoftware_interaction_type as enum (
  'whatsapp_sent', 'whatsapp_reply', 'call', 'email', 'note'
);

create type zoftware_message_stage as enum (
  'initial', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'breakup', 're_engagement'
);

-- Companies table
create table zoftware_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  industry zoftware_industry,
  city text,
  state text,
  phone text,
  website text,
  google_place_id text,
  size text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index zoftware_companies_normalized_name_key on zoftware_companies (normalized_name);

-- Contacts table
create table zoftware_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references zoftware_companies (id) on delete set null,
  name text,
  role text,
  phone text,
  email text,
  linkedin_url text,
  is_decision_maker boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index zoftware_contacts_company_id_idx on zoftware_contacts (company_id);

-- Leads table (main tracking)
create table zoftware_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references zoftware_companies (id) on delete cascade,
  contact_id uuid references zoftware_contacts (id) on delete set null,
  stage zoftware_lead_stage not null default 'prospect',
  source text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  priority smallint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index zoftware_leads_company_id_key on zoftware_leads (company_id);
create index zoftware_leads_stage_idx on zoftware_leads (stage);
create index zoftware_leads_next_follow_up_at_idx on zoftware_leads (next_follow_up_at) where next_follow_up_at is not null;

-- Interactions table
create table zoftware_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references zoftware_leads (id) on delete cascade,
  type zoftware_interaction_type not null,
  message_content text,
  sent_at timestamptz,
  replied_at timestamptz,
  reply_content text,
  notes text,
  created_at timestamptz not null default now()
);

create index zoftware_interactions_lead_id_idx on zoftware_interactions (lead_id);

-- Messages table (AI-generated)
create table zoftware_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references zoftware_leads (id) on delete cascade,
  stage zoftware_message_stage not null,
  variant text,
  content text not null,
  generated_at timestamptz not null default now()
);

create index zoftware_messages_lead_id_idx on zoftware_messages (lead_id);

-- Saved searches table
create table zoftware_saved_searches (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  industry zoftware_industry,
  city text,
  keywords text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index zoftware_saved_searches_is_active_idx on zoftware_saved_searches (is_active) where is_active;

-- Ingestion runs table
create table zoftware_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  duplicate_count integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

-- RLS policies (single-user: authenticated users have full access)
alter table zoftware_companies enable row level security;
alter table zoftware_contacts enable row level security;
alter table zoftware_leads enable row level security;
alter table zoftware_interactions enable row level security;
alter table zoftware_messages enable row level security;
alter table zoftware_saved_searches enable row level security;
alter table zoftware_ingestion_runs enable row level security;

create policy "auth_all" on zoftware_companies for all to authenticated using (true) with check (true);
create policy "auth_all" on zoftware_contacts for all to authenticated using (true) with check (true);
create policy "auth_all" on zoftware_leads for all to authenticated using (true) with check (true);
create policy "auth_all" on zoftware_interactions for all to authenticated using (true) with check (true);
create policy "auth_all" on zoftware_messages for all to authenticated using (true) with check (true);
create policy "auth_all" on zoftware_saved_searches for all to authenticated using (true) with check (true);
create policy "auth_all" on zoftware_ingestion_runs for all to authenticated using (true) with check (true);