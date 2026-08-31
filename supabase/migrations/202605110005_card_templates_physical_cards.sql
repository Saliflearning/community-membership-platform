alter table members
  add column if not exists physical_card_request jsonb;

create table if not exists physical_card_print_requests (
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

create index if not exists physical_card_print_requests_member_idx on physical_card_print_requests(member_id);
create index if not exists physical_card_print_requests_community_idx on physical_card_print_requests(community_code);
create index if not exists physical_card_print_requests_status_idx on physical_card_print_requests(print_status, shipping_status);

alter table physical_card_print_requests enable row level security;

drop policy if exists "service role manages physical card print requests" on physical_card_print_requests;
create policy "service role manages physical card print requests" on physical_card_print_requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
