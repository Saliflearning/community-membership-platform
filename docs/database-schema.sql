create extension if not exists "uuid-ossp";

create table countries (
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

create table regions (
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

create table zones (
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

create table zone_regions (
  zone_id uuid not null references zones(id),
  region_id uuid not null references regions(id),
  primary key(zone_id, region_id)
);

create table communities (
  id uuid primary key default uuid_generate_v4(),
  official_name text not null,
  code text not null unique,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  global_zone_id uuid references zones(id),
  state_code text not null,
  zone_code text not null,
  logo_url text,
  banner_url text,
  description text,
  contact_email text,
  support_email text,
  phone text,
  social_links jsonb not null default '[]',
  admin_user_id uuid,
  state_flag_url text,
  country_flag_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table platform_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table membership_tiers (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  country_id uuid references countries(id),
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

create table members (
  id uuid primary key default uuid_generate_v4(),
  member_id text not null unique,
  verification_token uuid not null default uuid_generate_v4() unique,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  profile_photo_url text,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  global_zone_id uuid references zones(id),
  state_code text not null,
  zone_code text not null,
  community_id uuid not null references communities(id),
  tier text not null,
  duration_years integer not null check (duration_years in (1, 2, 3)),
  preferred_language text not null default 'fr' check (preferred_language in ('fr', 'en')),
  consent_accepted_at timestamptz,
  consent_version text,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'invalid', 'suspended')),
  starts_at date,
  expires_at date,
  autopay_enabled boolean not null default false,
  physical_card_request jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index members_email_community_unique on members (lower(email), community_id);
create index members_status_idx on members(status);
create index members_zone_state_idx on members(zone_code, state_code);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id),
  provider text not null check (provider in ('stripe', 'manual')),
  provider_transaction_id text not null,
  provider_event_id text,
  amount_usd numeric(10, 2) not null,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  notes text,
  recorded_by_admin_id uuid,
  retry_url text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_transaction_id),
  unique(provider, provider_event_id)
);

create table cards (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id),
  version integer not null default 1,
  verification_url text not null,
  qr_code_url text,
  card_image_url text,
  card_svg_url text,
  generated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table physical_card_print_requests (
  id uuid primary key default uuid_generate_v4(),
  member_id text not null,
  community_code text not null,
  card_version integer not null default 1,
  option_name text not null,
  material text not null,
  delivery_method text not null check (delivery_method in ('pickup', 'mail')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'canceled')),
  print_status text not null default 'requested' check (print_status in ('requested', 'paid', 'ready_to_print', 'printed', 'canceled')),
  shipping_status text not null default 'not_required' check (shipping_status in ('not_required', 'pending', 'shipped', 'delivered', 'picked_up', 'canceled')),
  delivery_status text not null default 'requested' check (delivery_status in ('requested', 'shipped', 'delivered', 'picked_up', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table account_closure_requests (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id),
  email text not null,
  request_type text not null check (request_type in ('delete_data', 'close_account')),
  reason text,
  status text not null default 'open' check (status in ('open', 'verified', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table impersonation_sessions (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null,
  member_id uuid references members(id),
  reason text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table admin_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  role text not null check (role in ('super_admin', 'country_admin', 'zone_admin', 'region_admin', 'community_admin')),
  scope_type text not null check (scope_type in ('global', 'country', 'zone', 'region', 'community')),
  scope_id text,
  community_id uuid references communities(id),
  mfa_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table support_tickets (
  id uuid primary key default uuid_generate_v4(),
  member_name text not null,
  email text not null,
  issue_category text not null,
  message text not null,
  country_id uuid references countries(id),
  region_id uuid references regions(id),
  global_zone_id uuid references zones(id),
  community_id uuid references communities(id),
  assigned_admin_id uuid,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table reassignment_requests (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id),
  previous_country_id uuid references countries(id),
  previous_region_id uuid references regions(id),
  previous_global_zone_id uuid references zones(id),
  previous_state_code text not null,
  previous_zone_code text not null,
  previous_community_id uuid not null references communities(id),
  requested_country_id uuid references countries(id),
  requested_region_id uuid references regions(id),
  requested_global_zone_id uuid references zones(id),
  requested_state_code text not null,
  requested_zone_code text not null,
  requested_community_id uuid not null references communities(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  admin_notes text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create table reassignment_history (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references members(id),
  previous_country_id uuid references countries(id),
  previous_region_id uuid references regions(id),
  previous_global_zone_id uuid references zones(id),
  previous_state_code text not null,
  previous_zone_code text not null,
  previous_community_id uuid not null references communities(id),
  new_country_id uuid references countries(id),
  new_region_id uuid references regions(id),
  new_global_zone_id uuid references zones(id),
  new_state_code text not null,
  new_zone_code text not null,
  new_community_id uuid not null references communities(id),
  changed_at timestamptz not null default now(),
  changed_by uuid not null,
  reason text,
  admin_notes text
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table notification_events (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id),
  channel text not null check (channel in ('email', 'sms')),
  template_key text not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
