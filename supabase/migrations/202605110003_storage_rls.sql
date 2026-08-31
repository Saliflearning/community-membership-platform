insert into storage.buckets (id, name, public)
values
  ('member-photos', 'member-photos', false),
  ('community-assets', 'community-assets', true),
  ('cards', 'cards', false)
on conflict (id) do nothing;

alter table countries enable row level security;
alter table regions enable row level security;
alter table zones enable row level security;
alter table communities enable row level security;
alter table membership_tiers enable row level security;
alter table members enable row level security;
alter table payments enable row level security;
alter table cards enable row level security;
alter table admin_roles enable row level security;
alter table audit_logs enable row level security;
alter table support_tickets enable row level security;

create policy "public can read active countries" on countries for select using (active = true);
create policy "public can read active regions" on regions for select using (active = true);
create policy "public can read active zones" on zones for select using (active = true);
create policy "public can read active communities" on communities for select using (active = true);
create policy "public can read active tiers" on membership_tiers for select using (active = true);

create policy "members can read own member record" on members
  for select using (auth.uid() = auth_user_id);

create policy "members can read own cards" on cards
  for select using (
    exists (
      select 1 from members
      where members.member_id = cards.member_id
      and members.auth_user_id = auth.uid()
    )
  );

create policy "community assets are public" on storage.objects
  for select using (bucket_id = 'community-assets');

-- No direct client policy exists for member photos or generated cards. Server
-- routes use the service role only after member ownership or scoped admin
-- authorization and return short-lived signed URLs when required.
