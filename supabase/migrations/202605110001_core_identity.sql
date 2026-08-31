create extension if not exists "uuid-ossp";

create table if not exists countries (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  demonym text,
  flag_url text,
  default_language text not null default 'fr',
  supported_languages jsonb not null default '["fr","en"]',
  currency_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists regions (
  id uuid primary key default uuid_generate_v4(),
  country_id uuid not null references countries(id),
  code text not null,
  name text not null,
  flag_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_id, code)
);

create table if not exists zones (
  id uuid primary key default uuid_generate_v4(),
  country_id uuid not null references countries(id),
  code text not null,
  name text not null,
  badge_color text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_id, code)
);

create table if not exists communities (
  id uuid primary key default uuid_generate_v4(),
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  zone_id uuid references zones(id),
  official_name text not null,
  code text not null unique,
  logo_url text,
  banner_url text,
  description text,
  contact_email text,
  support_email text,
  phone text,
  social_links jsonb not null default '[]',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists membership_tiers (
  id uuid primary key default uuid_generate_v4(),
  country_id uuid references countries(id),
  code text not null unique,
  name text not null,
  price_usd numeric(10, 2) not null,
  duration_years integer not null check (duration_years in (1, 2, 3)),
  description text not null,
  benefits jsonb not null default '[]',
  renewal_rules text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid,
  member_id text not null unique,
  verification_token uuid not null default uuid_generate_v4() unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  profile_photo_url text,
  country_code text not null,
  region_code text not null,
  zone_code_global text not null,
  state_code text not null,
  zone_code text not null,
  community_code text not null,
  tier text not null,
  duration_years integer not null check (duration_years in (1, 2, 3)),
  preferred_language text not null default 'fr' check (preferred_language in ('fr', 'en')),
  consent_accepted_at timestamptz not null,
  consent_version text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'invalid', 'suspended')),
  starts_at timestamptz,
  expires_at timestamptz,
  autopay_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_status_idx on members(status);
create index if not exists members_scope_idx on members(country_code, region_code, zone_code_global, community_code);
