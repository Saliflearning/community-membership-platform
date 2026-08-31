create table if not exists platform_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table platform_config enable row level security;

drop policy if exists "service role manages platform config" on platform_config;
create policy "service role manages platform config" on platform_config
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
