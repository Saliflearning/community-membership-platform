create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  member_id text not null,
  provider text not null check (provider in ('stripe', 'manual')),
  provider_transaction_id text not null,
  provider_event_id text,
  amount_usd numeric(10, 2) not null,
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  notes text,
  recorded_by_admin_id text,
  retry_url text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_transaction_id),
  unique(provider, provider_event_id)
);

create table if not exists cards (
  id uuid primary key default uuid_generate_v4(),
  member_id text not null,
  version integer not null,
  verification_url text not null,
  qr_code_url text,
  card_image_url text,
  card_svg_url text,
  generated_at timestamptz not null default now(),
  generated_by text not null default 'system',
  reason text not null,
  revoked_at timestamptz,
  unique(member_id, version)
);

create table if not exists admin_roles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid,
  email text not null,
  role text not null check (role in ('super_admin', 'country_admin', 'zone_admin', 'region_admin', 'community_admin')),
  scope_type text not null check (scope_type in ('global', 'country', 'zone', 'region', 'community')),
  scope_id text,
  active boolean not null default true,
  mfa_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id text,
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id uuid primary key default uuid_generate_v4(),
  member_name text not null,
  email text not null,
  issue_category text not null,
  message text not null,
  country_code text not null,
  region_code text not null,
  zone_code text not null,
  community_code text not null,
  assigned_admin_id text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
