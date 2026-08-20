-- ARC Community + Credits + Stripe foundation
-- Run this migration in Supabase SQL Editor before using the new backend features.

create extension if not exists pgcrypto;

-- Extend the EXISTING profile table used by the current ARC auth flow.
-- The existing table uses `id` as the auth.users id.  The application/backend
-- uses `user_id` throughout the social graph, so we add and backfill that
-- compatibility column instead of replacing or recreating the table.
alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists name text,
  add column if not exists avatar_url text,
  add column if not exists gender text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists character_code text,
  add column if not exists level integer not null default 1,
  add column if not exists standard_points integer not null default 0,
  add column if not exists is_online boolean not null default false,
  add column if not exists last_seen timestamptz;

-- Existing ARC rows already identify their auth user through `id`.
update public.profiles
set user_id = id
where user_id is null;

-- Backfill profile presentation fields from the existing Auth metadata where possible.
update public.profiles p
set
  name = coalesce(nullif(p.name, ''), nullif(u.raw_user_meta_data->>'username', ''), nullif(u.raw_user_meta_data->>'name', ''), split_part(coalesce(u.email, p.email, 'Operative'), '@', 1)),
  email = coalesce(p.email, u.email)
from auth.users u
where u.id = p.id;

update public.profiles
set name = coalesce(nullif(name, ''), 'Operative'),
    credits = coalesce(credits, 0),
    updated_at = coalesce(updated_at, now());

alter table public.profiles
  alter column user_id set not null,
  alter column credits set not null;

-- The current auth flow inserts profiles without explicitly providing `id`.
-- Defaulting it to the authenticated user's id keeps old and new profile writes compatible.
alter table public.profiles
  alter column id set default auth.uid();

create unique index if not exists profiles_user_id_unique
  on public.profiles(user_id);

create unique index if not exists profiles_character_code_unique
  on public.profiles(character_code)
  where character_code is not null;

-- Server-side character code generator.
create or replace function public.generate_character_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'CYBER-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4)) || '-' || lpad((floor(random() * 100))::int::text, 2, '0');
    exit when not exists (select 1 from public.profiles where character_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Backfill missing codes.
update public.profiles
set character_code = public.generate_character_code()
where character_code is null;

-- Social graph.
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id, status, created_at desc);
create index if not exists friend_requests_sender_idx on public.friend_requests(sender_id, status, created_at desc);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a <> user_b),
  unique(user_a, user_b)
);

-- Chat.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group','clan')),
  name text,
  created_by uuid references auth.users(id) on delete set null,
  clan_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key(conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- Clans.
create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  tag text not null check (char_length(tag) between 2 and 8),
  description text not null default '',
  leader_id uuid not null references auth.users(id) on delete restrict,
  badge_emoji text not null default '🛡️',
  badge_config jsonb not null default '{}'::jsonb,
  clan_points integer not null default 0,
  max_members integer not null default 30,
  created_at timestamptz not null default now()
);

create unique index if not exists clans_name_lower_unique on public.clans(lower(name));
create unique index if not exists clans_tag_lower_unique on public.clans(lower(tag));

create table if not exists public.clan_members (
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('leader','officer','member')),
  joined_at timestamptz not null default now(),
  primary key(clan_id, user_id)
);

create unique index if not exists one_clan_per_user on public.clan_members(user_id);

create table if not exists public.clan_join_requests (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  unique(clan_id, user_id)
);

create table if not exists public.clan_invitations (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now()
);

-- Shop / credits.
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount integer not null,
  balance_after integer not null,
  provider text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_idx on public.credit_transactions(user_id, created_at desc);

create table if not exists public.store_products (
  id text primary key,
  name text not null,
  credits integer not null check (credits > 0),
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'eur',
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.store_products(id, name, credits, price_cents, currency)
values
  ('pack_100', 'Starter Pack', 100, 199, 'eur'),
  ('pack_500', 'Cyber Pro Pack', 500, 699, 'eur'),
  ('pack_1500', 'Overlord Vault', 1500, 1499, 'eur')
on conflict (id) do update set name = excluded.name, credits = excluded.credits, price_cents = excluded.price_cents, currency = excluded.currency;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.store_products(id),
  provider text not null default 'stripe',
  provider_payment_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists purchases_provider_payment_unique
  on public.purchases(provider, provider_payment_id)
  where provider_payment_id is not null;

-- RPC: atomic credit spending for in-game purchases.
create or replace function public.spend_credits(p_amount integer, p_type text, p_reference_id text default null, p_metadata jsonb default '{}'::jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  update public.profiles
  set credits = credits - p_amount, updated_at = now()
  where user_id = auth.uid() and credits >= p_amount
  returning credits into new_balance;

  if new_balance is null then raise exception 'insufficient_credits'; end if;

  insert into public.credit_transactions(user_id, type, amount, balance_after, provider, reference_id, metadata)
  values(auth.uid(), p_type, -p_amount, new_balance, 'internal', p_reference_id, coalesce(p_metadata, '{}'::jsonb));

  return new_balance;
end;
$$;

-- RPC used by the Stripe webhook to credit a purchase exactly once.
create or replace function public.apply_paid_purchase(p_purchase_id uuid, p_provider_payment_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  purchase_row public.purchases%rowtype;
  new_balance integer;
begin
  select * into purchase_row from public.purchases where id = p_purchase_id for update;
  if not found then raise exception 'purchase_not_found'; end if;
  if purchase_row.status = 'paid' then
    if purchase_row.provider_payment_id is null or purchase_row.provider_payment_id = p_provider_payment_id then
      select credits into new_balance from public.profiles where user_id = purchase_row.user_id;
      return coalesce(new_balance, 0);
    end if;
    raise exception 'payment_reference_mismatch';
  end if;

  if purchase_row.provider <> 'stripe' then raise exception 'unsupported_provider'; end if;
  if purchase_row.amount_cents <> (select price_cents from public.store_products where id=purchase_row.product_id)
     or purchase_row.currency <> (select currency from public.store_products where id=purchase_row.product_id) then
    raise exception 'purchase_amount_mismatch';
  end if;

  update public.purchases
  set status = 'paid', provider_payment_id = p_provider_payment_id, completed_at = now()
  where id = p_purchase_id;

  update public.profiles
  set credits = credits + (select credits from public.store_products where id = purchase_row.product_id), updated_at = now()
  where user_id = purchase_row.user_id
  returning credits into new_balance;

  insert into public.credit_transactions(user_id, type, amount, balance_after, provider, reference_id, metadata)
  values(purchase_row.user_id, 'purchase', (select credits from public.store_products where id = purchase_row.product_id), new_balance, 'stripe', p_provider_payment_id, jsonb_build_object('purchase_id', p_purchase_id));

  return new_balance;
end;
$$;

-- Generic profile bootstrap for new authenticated users.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, user_id, email, name, character_code, credits, created_at, updated_at)
  values(
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'Operative'), '@', 1)),
    public.generate_character_code(),
    100,
    now(),
    now()
  )
  on conflict(user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- RLS
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.clan_join_requests enable row level security;
alter table public.clan_invitations enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.store_products enable row level security;
alter table public.purchases enable row level security;

-- Profiles: public community fields readable; own profile writable.
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Friend requests.
drop policy if exists friend_requests_select_participant on public.friend_requests;
create policy friend_requests_select_participant on public.friend_requests for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());
drop policy if exists friend_requests_insert_sender on public.friend_requests;
create policy friend_requests_insert_sender on public.friend_requests for insert to authenticated with check (sender_id = auth.uid());
drop policy if exists friend_requests_update_participant on public.friend_requests;
create policy friend_requests_update_participant on public.friend_requests for update to authenticated using (receiver_id = auth.uid() or sender_id = auth.uid()) with check (receiver_id = auth.uid() or sender_id = auth.uid());

-- Friendships.
drop policy if exists friendships_select_self on public.friendships;
create policy friendships_select_self on public.friendships for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());

-- Conversations/messages.
drop policy if exists conversation_members_select_self on public.conversation_members;
create policy conversation_members_select_self on public.conversation_members for select to authenticated using (user_id = auth.uid());
drop policy if exists conversations_select_member on public.conversations;
create policy conversations_select_member on public.conversations for select to authenticated using (exists(select 1 from public.conversation_members cm where cm.conversation_id = id and cm.user_id = auth.uid()));
drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated using (exists(select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid()));
drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists(select 1 from public.conversation_members cm where cm.conversation_id = conversation_id and cm.user_id = auth.uid()));

-- Clans: authenticated users can discover clans. Membership/request writes should use RPCs.
drop policy if exists clans_select_authenticated on public.clans;
create policy clans_select_authenticated on public.clans for select to authenticated using (true);
drop policy if exists clan_members_select_authenticated on public.clan_members;
create policy clan_members_select_authenticated on public.clan_members for select to authenticated using (true);
drop policy if exists clan_join_requests_select_related on public.clan_join_requests;
create policy clan_join_requests_select_related on public.clan_join_requests for select to authenticated using (user_id = auth.uid() or exists(select 1 from public.clan_members cm where cm.clan_id = clan_id and cm.user_id = auth.uid() and cm.role in ('leader','officer')));
drop policy if exists clan_invitations_select_related on public.clan_invitations;
create policy clan_invitations_select_related on public.clan_invitations for select to authenticated using (receiver_id = auth.uid() or sender_id = auth.uid());

-- Credit history/purchases are private. Store products are public to authenticated users.
drop policy if exists credit_transactions_select_self on public.credit_transactions;
create policy credit_transactions_select_self on public.credit_transactions for select to authenticated using (user_id = auth.uid());
drop policy if exists store_products_select_authenticated on public.store_products;
create policy store_products_select_authenticated on public.store_products for select to authenticated using (active = true);
drop policy if exists purchases_select_self on public.purchases;
create policy purchases_select_self on public.purchases for select to authenticated using (user_id = auth.uid());

-- Realtime publication for chat and social notifications.
do $$
declare
  t text;
begin
  foreach t in array array['friend_requests','friendships','messages','clan_join_requests','clan_invitations'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Minimal write policies for the client-side social flow. Sensitive role changes should move to RPCs as the app scales.
drop policy if exists friendships_insert_participant on public.friendships;
create policy friendships_insert_participant on public.friendships for insert to authenticated with check (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists friendships_delete_participant on public.friendships;
create policy friendships_delete_participant on public.friendships for delete to authenticated using (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists clans_insert_leader on public.clans;
create policy clans_insert_leader on public.clans for insert to authenticated with check (leader_id = auth.uid());
drop policy if exists clan_members_insert_self on public.clan_members;
create policy clan_members_insert_self on public.clan_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists clan_join_requests_insert_self on public.clan_join_requests;
create policy clan_join_requests_insert_self on public.clan_join_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists clan_join_requests_update_self_or_admin on public.clan_join_requests;
create policy clan_join_requests_update_self_or_admin on public.clan_join_requests for update to authenticated using (user_id = auth.uid() or exists(select 1 from public.clan_members cm where cm.clan_id = clan_id and cm.user_id = auth.uid() and cm.role in ('leader','officer'))) with check (user_id = auth.uid() or exists(select 1 from public.clan_members cm where cm.clan_id = clan_id and cm.user_id = auth.uid() and cm.role in ('leader','officer')));

create or replace function public.accept_clan_join_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.clan_join_requests%rowtype;
  member_count integer;
  can_manage boolean;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into req from public.clan_join_requests where id = p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  select exists(select 1 from public.clan_members where clan_id = req.clan_id and user_id = auth.uid() and role in ('leader','officer')) into can_manage;
  if not can_manage then raise exception 'not_authorized'; end if;
  select count(*) into member_count from public.clan_members where clan_id = req.clan_id;
  if member_count >= (select max_members from public.clans where id = req.clan_id) then raise exception 'clan_full'; end if;
  insert into public.clan_members(clan_id,user_id,role) values(req.clan_id, req.user_id, 'member') on conflict(user_id) do nothing;
  insert into public.conversation_members(conversation_id,user_id)
  select id,req.user_id from public.conversations where type='clan' and clan_id=req.clan_id
  on conflict(conversation_id,user_id) do nothing;
  update public.clan_join_requests set status='accepted' where id=p_request_id;
  return req.clan_id;
end;
$$;

-- Realtime publication statements can be run more than once in some Supabase environments only by guarding manually.


drop policy if exists purchases_insert_self on public.purchases;

-- The service role used by the Stripe webhook is the only actor that should mark purchases paid.
-- No client update policy is intentionally created for purchases.


-- Secure conversation creation helpers. These are intentionally SECURITY DEFINER so the client never receives a service-role key.
create or replace function public.create_direct_conversation(p_friend_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_friend_id = auth.uid() then raise exception 'invalid_friend'; end if;
  if exists(select 1 from public.user_blocks where (blocker_id=auth.uid() and blocked_id=p_friend_id) or (blocker_id=p_friend_id and blocked_id=auth.uid())) then
    raise exception 'user_blocked';
  end if;
  if not exists (select 1 from public.friendships where user_a = least(auth.uid(), p_friend_id) and user_b = greatest(auth.uid(), p_friend_id)) then
    raise exception 'not_friends';
  end if;
  select c.id into conversation_id
  from public.conversations c
  join public.conversation_members cm1 on cm1.conversation_id = c.id and cm1.user_id = auth.uid()
  join public.conversation_members cm2 on cm2.conversation_id = c.id and cm2.user_id = p_friend_id
  where c.type = 'direct'
  limit 1;
  if conversation_id is not null then return conversation_id; end if;
  insert into public.conversations(type,created_by) values('direct',auth.uid()) returning id into conversation_id;
  insert into public.conversation_members(conversation_id,user_id) values(conversation_id,auth.uid()),(conversation_id,p_friend_id);
  return conversation_id;
end;
$$;

create or replace function public.create_or_get_clan_conversation(p_clan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.clan_members where clan_id=p_clan_id and user_id=auth.uid()) then raise exception 'not_clan_member'; end if;
  select id into conversation_id from public.conversations where type='clan' and clan_id=p_clan_id limit 1;
  if conversation_id is null then
    insert into public.conversations(type,name,created_by,clan_id) values('clan','Clan Chat',auth.uid(),p_clan_id) returning id into conversation_id;
  end if;
  insert into public.conversation_members(conversation_id,user_id)
  select conversation_id,user_id from public.clan_members where clan_id=p_clan_id
  on conflict(conversation_id,user_id) do nothing;
  return conversation_id;
end;
$$;

-- Protect server-owned profile fields from client tampering.
create or replace function public.protect_profile_server_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := current_setting('request.jwt.claim.role', true);
begin
  if jwt_role <> 'service_role' then
    if tg_op = 'UPDATE' then
      new.credits := old.credits;
      new.character_code := old.character_code;
    elsif tg_op = 'INSERT' then
      new.credits := 100;
      if new.character_code is null then new.character_code := public.generate_character_code(); end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_server_fields on public.profiles;
create trigger protect_profile_server_fields
before insert or update on public.profiles
for each row execute procedure public.protect_profile_server_fields();

-- Only the receiver may accept/decline an incoming friend request.
drop policy if exists friend_requests_update_participant on public.friend_requests;
create policy friend_requests_update_receiver on public.friend_requests for update to authenticated using (receiver_id = auth.uid()) with check (receiver_id = auth.uid());

-- Friendship rows are created by the acceptance flow; clients cannot forge them.
drop policy if exists friendships_insert_participant on public.friendships;

create or replace function public.respond_to_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.friend_requests%rowtype;
  a uuid;
  b uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into req from public.friend_requests where id=p_request_id and receiver_id=auth.uid() for update;
  if not found then raise exception 'request_not_found'; end if;
  if p_accept then
    a := least(req.sender_id, req.receiver_id);
    b := greatest(req.sender_id, req.receiver_id);
    insert into public.friendships(user_a,user_b) values(a,b) on conflict(user_a,user_b) do nothing;
    update public.friend_requests set status='accepted', updated_at=now() where id=p_request_id;
  else
    update public.friend_requests set status='declined', updated_at=now() where id=p_request_id;
  end if;
end;
$$;

create or replace function public.create_clan(p_name text, p_tag text, p_description text, p_badge_emoji text, p_badge_config jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  clan_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists(select 1 from public.clan_members where user_id=auth.uid()) then raise exception 'already_in_clan'; end if;
  insert into public.clans(name,tag,description,leader_id,badge_emoji,badge_config)
  values(trim(p_name),upper(trim(p_tag)),coalesce(trim(p_description),''),auth.uid(),coalesce(p_badge_emoji,'🛡️'),coalesce(p_badge_config,'{}'::jsonb))
  returning id into clan_id;
  insert into public.clan_members(clan_id,user_id,role) values(clan_id,auth.uid(),'leader');
  return clan_id;
end;
$$;

-- Do not permit arbitrary self-membership inserts; clan creation/join acceptance use server functions.
drop policy if exists clan_members_insert_self on public.clan_members;


-- ============================================================
-- ARC FINAL HARDENING: inventory, secure shop, groups, clan
-- management, invitations, leave flow, and daily wheel.
-- ============================================================

create table if not exists public.store_items (
  id text primary key,
  item_type text not null check (item_type in ('skin','color','animation','feature')),
  price_credits integer not null check (price_credits >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null check (item_type in ('skin','color','animation','feature')),
  purchased_at timestamptz not null default now(),
  primary key(user_id, item_id)
);

create index if not exists user_inventory_user_idx on public.user_inventory(user_id, item_type);

insert into public.store_items(id,item_type,price_credits) values
  ('design_customizer','feature',100),
  ('color_amber','color',100),('color_emerald','color',100),('color_purple','color',100),
  ('color_rose','color',100),('color_blue','color',100),('color_silver','color',100),('color_orange','color',100),
  ('anim_gold_rain','animation',750),('anim_electric_lines','animation',500),('anim_matrix_stream','animation',400),
  ('anim_zen_aura','animation',350),('anim_gentle_rain','animation',250)
on conflict(id) do update set item_type=excluded.item_type, price_credits=excluded.price_credits, active=true;

-- Skin catalog is kept in the app source as presentation data, but the
-- price is duplicated here so the client can never choose its own price.
insert into public.store_items(id,item_type,price_credits) values
  ('skin_sport_1','skin',100),('skin_sport_2','skin',250),('skin_sport_3','skin',350),('skin_sport_4','skin',600),('skin_sport_5','skin',1200),
  ('skin_zen_1','skin',120),('skin_zen_2','skin',280),('skin_zen_3','skin',400),('skin_zen_4','skin',700),('skin_zen_5','skin',1500),
  ('skin_biz_1','skin',150),('skin_biz_2','skin',300),('skin_biz_3','skin',500),('skin_biz_4','skin',800),('skin_biz_5','skin',1800),
  ('skin_fokus_1','skin',130),('skin_fokus_2','skin',320),('skin_fokus_3','skin',480),('skin_fokus_4','skin',850),
  ('title_teamleader','skin',150),('title_zenmaster','skin',300)
on conflict(id) do update set item_type=excluded.item_type, price_credits=excluded.price_credits, active=true;

create table if not exists public.daily_wheel_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null,
  reward integer not null check (reward >= 0),
  created_at timestamptz not null default now(),
  primary key(user_id, claim_date)
);

alter table public.user_inventory enable row level security;
alter table public.store_items enable row level security;
alter table public.daily_wheel_claims enable row level security;

drop policy if exists user_inventory_select_self on public.user_inventory;
create policy user_inventory_select_self on public.user_inventory for select to authenticated using (user_id = auth.uid());
drop policy if exists store_items_select_authenticated on public.store_items;
create policy store_items_select_authenticated on public.store_items for select to authenticated using (active = true);
drop policy if exists daily_wheel_claims_select_self on public.daily_wheel_claims;
create policy daily_wheel_claims_select_self on public.daily_wheel_claims for select to authenticated using (user_id = auth.uid());

create or replace function public.purchase_store_item(p_item_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.store_items%rowtype;
  new_balance integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into item from public.store_items where id=p_item_id and active=true for share;
  if not found then raise exception 'item_not_found'; end if;
  if item.price_credits < 0 then raise exception 'invalid_price'; end if;
  if exists(select 1 from public.user_inventory where user_id=auth.uid() and item_id=item.id) then
    raise exception 'already_owned';
  end if;

  update public.profiles
  set credits=credits-item.price_credits, updated_at=now()
  where user_id=auth.uid() and credits >= item.price_credits
  returning credits into new_balance;
  if new_balance is null then raise exception 'insufficient_credits'; end if;

  insert into public.user_inventory(user_id,item_id,item_type)
  values(auth.uid(),item.id,item.item_type);

  insert into public.credit_transactions(user_id,type,amount,balance_after,provider,reference_id,metadata)
  values(auth.uid(),'shop_purchase',-item.price_credits,new_balance,'internal',item.id,
         jsonb_build_object('item_id',item.id,'item_type',item.item_type));

  return new_balance;
end;
$$;

create or replace function public.claim_daily_wheel(p_claim_date date, p_reward integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
  inserted boolean;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_claim_date <> current_date then raise exception 'invalid_claim_date'; end if;
  if p_reward not in (0,5,25,100) then raise exception 'invalid_reward'; end if;

  insert into public.daily_wheel_claims(user_id,claim_date,reward)
  values(auth.uid(),p_claim_date,p_reward)
  on conflict(user_id,claim_date) do nothing;
  inserted := found;
  if not inserted then raise exception 'already_claimed_today'; end if;

  update public.profiles set credits=credits+p_reward, updated_at=now()
  where user_id=auth.uid() returning credits into new_balance;
  if new_balance is null then raise exception 'profile_not_found'; end if;

  if p_reward > 0 then
    insert into public.credit_transactions(user_id,type,amount,balance_after,provider,reference_id,metadata)
    values(auth.uid(),'daily_wheel',p_reward,new_balance,'internal',p_claim_date::text,
           jsonb_build_object('reward',p_reward));
  end if;
  return new_balance;
end;
$$;

-- Group conversations can only be created by authenticated users and only
-- with their friends as members.
create or replace function public.create_group_conversation(p_name text, p_friend_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
  friend_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 60 then raise exception 'invalid_group_name'; end if;
  if coalesce(array_length(p_friend_ids,1),0) < 1 then raise exception 'group_requires_friend'; end if;

  foreach friend_id in array p_friend_ids loop
    if friend_id = auth.uid() then raise exception 'invalid_group_member'; end if;
    if not exists(select 1 from public.friendships where user_a=least(auth.uid(),friend_id) and user_b=greatest(auth.uid(),friend_id)) then
      raise exception 'all_members_must_be_friends';
    end if;
  end loop;

  insert into public.conversations(type,name,created_by)
  values('group',trim(p_name),auth.uid()) returning id into conversation_id;
  insert into public.conversation_members(conversation_id,user_id) values(conversation_id,auth.uid());
  foreach friend_id in array p_friend_ids loop
    insert into public.conversation_members(conversation_id,user_id) values(conversation_id,friend_id);
  end loop;
  return conversation_id;
end;
$$;

create or replace function public.send_clan_invitation(p_clan_id uuid, p_receiver_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_id uuid;
  clan_member_count integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists(select 1 from public.clan_members where clan_id=p_clan_id and user_id=auth.uid() and role in ('leader','officer')) then
    raise exception 'not_authorized';
  end if;
  select count(*) into clan_member_count from public.clan_members where clan_id=p_clan_id;
  if clan_member_count >= (select max_members from public.clans where id=p_clan_id) then raise exception 'clan_full'; end if;
  if exists(select 1 from public.clan_members where clan_id=p_clan_id and user_id=p_receiver_id) then raise exception 'already_member'; end if;
  if exists(select 1 from public.clan_invitations where clan_id=p_clan_id and receiver_id=p_receiver_id and status='pending') then raise exception 'invitation_exists'; end if;

  insert into public.clan_invitations(clan_id,sender_id,receiver_id)
  values(p_clan_id,auth.uid(),p_receiver_id) returning id into invitation_id;
  return invitation_id;
end;
$$;

create or replace function public.respond_to_clan_invitation(p_invitation_id uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.clan_invitations%rowtype;
  clan_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into inv from public.clan_invitations where id=p_invitation_id and receiver_id=auth.uid() for update;
  if not found then raise exception 'invitation_not_found'; end if;
  if not p_accept then
    update public.clan_invitations set status='declined' where id=p_invitation_id;
    return inv.clan_id;
  end if;
  if exists(select 1 from public.clan_members where user_id=auth.uid()) then raise exception 'already_in_clan'; end if;
  if (select count(*) from public.clan_members where clan_id=inv.clan_id) >= (select max_members from public.clans where id=inv.clan_id) then raise exception 'clan_full'; end if;

  insert into public.clan_members(clan_id,user_id,role) values(inv.clan_id,auth.uid(),'member');
  insert into public.conversation_members(conversation_id,user_id)
  select id,auth.uid() from public.conversations where type='clan' and clan_id=inv.clan_id
  on conflict(conversation_id,user_id) do nothing;
  update public.clan_invitations set status='accepted' where id=p_invitation_id;
  clan_id := inv.clan_id;
  return clan_id;
end;
$$;

create or replace function public.set_clan_member_role(p_clan_id uuid, p_member_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_role not in ('officer','member') then raise exception 'invalid_role'; end if;
  if not exists(select 1 from public.clan_members where clan_id=p_clan_id and user_id=auth.uid() and role='leader') then raise exception 'not_authorized'; end if;
  if p_member_id=auth.uid() then raise exception 'cannot_change_own_role'; end if;
  if not exists(select 1 from public.clan_members where clan_id=p_clan_id and user_id=p_member_id) then raise exception 'member_not_found'; end if;
  update public.clan_members set role=p_role where clan_id=p_clan_id and user_id=p_member_id;
end;
$$;

create or replace function public.remove_clan_member(p_clan_id uuid, p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_role text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select role into actor_role from public.clan_members where clan_id=p_clan_id and user_id=auth.uid();
  select role into target_role from public.clan_members where clan_id=p_clan_id and user_id=p_member_id;
  if actor_role is null or target_role is null then raise exception 'member_not_found'; end if;
  if target_role='leader' then raise exception 'cannot_remove_leader'; end if;
  if actor_role='leader' or (actor_role='officer' and target_role='member') then
    delete from public.conversation_members
    where user_id=p_member_id and conversation_id in (select id from public.conversations where type='clan' and clan_id=p_clan_id);
    delete from public.clan_members where clan_id=p_clan_id and user_id=p_member_id;
    return;
  end if;
  raise exception 'not_authorized';
end;
$$;

create or replace function public.leave_clan(p_clan_id uuid, p_successor_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  member_count integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select role into actor_role from public.clan_members where clan_id=p_clan_id and user_id=auth.uid();
  if actor_role is null then raise exception 'not_clan_member'; end if;

  select count(*) into member_count from public.clan_members where clan_id=p_clan_id;
  if actor_role='leader' then
    if member_count > 1 then
      if p_successor_id is null or p_successor_id=auth.uid() then raise exception 'successor_required'; end if;
      if not exists(select 1 from public.clan_members where clan_id=p_clan_id and user_id=p_successor_id) then raise exception 'successor_not_member'; end if;
      delete from public.conversation_members
      where user_id=auth.uid() and conversation_id in (select id from public.conversations where type='clan' and clan_id=p_clan_id);
      update public.clan_members set role='member' where clan_id=p_clan_id and user_id=auth.uid();
      update public.clan_members set role='leader' where clan_id=p_clan_id and user_id=p_successor_id;
      update public.clans set leader_id=p_successor_id where id=p_clan_id;
      return;
    end if;
    delete from public.clans where id=p_clan_id;
    return;
  end if;

  delete from public.conversation_members
  where user_id=auth.uid() and conversation_id in (select id from public.conversations where type='clan' and clan_id=p_clan_id);
  delete from public.clan_members where clan_id=p_clan_id and user_id=auth.uid();
end;
$$;

-- Add public clan requests/invitation visibility needed by the UI without
-- exposing unrelated users' private data.
drop policy if exists clan_invitations_insert_related on public.clan_invitations;
create policy clan_invitations_insert_related on public.clan_invitations for insert to authenticated
with check (sender_id=auth.uid() and exists(select 1 from public.clan_members cm where cm.clan_id=clan_id and cm.user_id=auth.uid() and cm.role in ('leader','officer')));

drop policy if exists clan_invitations_update_receiver on public.clan_invitations;
create policy clan_invitations_update_receiver on public.clan_invitations for update to authenticated
using (receiver_id=auth.uid()) with check (receiver_id=auth.uid());

drop policy if exists clan_join_requests_insert_self on public.clan_join_requests;
create policy clan_join_requests_insert_self on public.clan_join_requests for insert to authenticated
with check (user_id=auth.uid() and not exists(select 1 from public.clan_members where user_id=auth.uid()));

-- Keep SECURITY DEFINER RPCs inaccessible to anonymous users.
revoke all on function public.purchase_store_item(text) from public;
grant execute on function public.purchase_store_item(text) to authenticated;
revoke all on function public.claim_daily_wheel(date,integer) from public;
grant execute on function public.claim_daily_wheel(date,integer) to authenticated;
revoke all on function public.create_group_conversation(text,uuid[]) from public;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;
revoke all on function public.send_clan_invitation(uuid,uuid) from public;
grant execute on function public.send_clan_invitation(uuid,uuid) to authenticated;
revoke all on function public.respond_to_clan_invitation(uuid,boolean) from public;
grant execute on function public.respond_to_clan_invitation(uuid,boolean) to authenticated;
revoke all on function public.set_clan_member_role(uuid,uuid,text) from public;
grant execute on function public.set_clan_member_role(uuid,uuid,text) to authenticated;
revoke all on function public.remove_clan_member(uuid,uuid) from public;
grant execute on function public.remove_clan_member(uuid,uuid) to authenticated;
revoke all on function public.leave_clan(uuid,uuid) from public;
grant execute on function public.leave_clan(uuid,uuid) to authenticated;

-- Realtime publication is idempotent-safe: add tables only when absent.
do $$
declare
  t text;
begin
  foreach t in array array['friend_requests','friendships','messages','clan_join_requests','clan_invitations'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;


-- Final RLS tightening: state-changing social operations are performed by
-- the SECURITY DEFINER RPCs above, not by arbitrary client updates.
drop policy if exists friend_requests_update_participant on public.friend_requests;
drop policy if exists friend_requests_update_receiver on public.friend_requests;

drop policy if exists clan_join_requests_update_self_or_admin on public.clan_join_requests;
drop policy if exists clan_join_requests_insert_self on public.clan_join_requests;

drop policy if exists clan_invitations_update_receiver on public.clan_invitations;
drop policy if exists clan_invitations_insert_related on public.clan_invitations;

drop policy if exists clans_insert_leader on public.clans;
drop policy if exists clan_members_insert_self on public.clan_members;

create or replace function public.request_clan_join(p_clan_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists(select 1 from public.clan_members where user_id=auth.uid()) then raise exception 'already_in_clan'; end if;
  if not exists(select 1 from public.clans where id=p_clan_id) then raise exception 'clan_not_found'; end if;
  if (select count(*) from public.clan_members where clan_id=p_clan_id) >= (select max_members from public.clans where id=p_clan_id) then raise exception 'clan_full'; end if;
  if exists(select 1 from public.clan_join_requests where clan_id=p_clan_id and user_id=auth.uid() and status='pending') then raise exception 'request_exists'; end if;

  insert into public.clan_join_requests(clan_id,user_id,status)
  values(p_clan_id,auth.uid(),'pending')
  on conflict(clan_id,user_id) do update set status='pending', created_at=now()
  returning id into request_id;
  return request_id;
end;
$$;

create or replace function public.decline_clan_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.clan_join_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into req from public.clan_join_requests where id=p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if not exists(select 1 from public.clan_members where clan_id=req.clan_id and user_id=auth.uid() and role in ('leader','officer')) then
    raise exception 'not_authorized';
  end if;
  update public.clan_join_requests set status='declined' where id=p_request_id;
end;
$$;

grant execute on function public.request_clan_join(uuid) to authenticated;
grant execute on function public.decline_clan_join_request(uuid) to authenticated;
revoke all on function public.request_clan_join(uuid) from public;
revoke all on function public.decline_clan_join_request(uuid) from public;


create or replace function public.set_my_online_status(p_is_online boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.profiles
  set is_online=p_is_online, last_seen=now(), updated_at=now()
  where user_id=auth.uid();
end;
$$;
revoke all on function public.set_my_online_status(boolean) from public;
grant execute on function public.set_my_online_status(boolean) to authenticated;

-- Lightweight moderation primitives. UI can be enabled without changing the
-- database model later.
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  check(blocker_id <> blocked_id)
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'open' check(status in ('open','reviewed','resolved','dismissed'))
);

alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
drop policy if exists user_blocks_select_self on public.user_blocks;
create policy user_blocks_select_self on public.user_blocks for select to authenticated using (blocker_id=auth.uid());
drop policy if exists user_reports_insert_self on public.user_reports;
create policy user_reports_insert_self on public.user_reports for insert to authenticated with check (reporter_id=auth.uid());
drop policy if exists user_reports_select_self on public.user_reports;
create policy user_reports_select_self on public.user_reports for select to authenticated using (reporter_id=auth.uid());

create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_blocked_id=auth.uid() then raise exception 'invalid_target'; end if;
  insert into public.user_blocks(blocker_id,blocked_id) values(auth.uid(),p_blocked_id) on conflict do nothing;
end;
$$;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.user_blocks where blocker_id=auth.uid() and blocked_id=p_blocked_id;
end;
$$;

create or replace function public.report_user(p_reported_user_id uuid,p_reason text,p_conversation_id uuid default null,p_message_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare report_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_reported_user_id=auth.uid() then raise exception 'invalid_target'; end if;
  insert into public.user_reports(reporter_id,reported_user_id,reason,conversation_id,message_id)
  values(auth.uid(),p_reported_user_id,trim(p_reason),p_conversation_id,p_message_id)
  returning id into report_id;
  return report_id;
end;
$$;

revoke all on function public.set_my_online_status(boolean) from public;
grant execute on function public.set_my_online_status(boolean) to authenticated;
revoke all on function public.block_user(uuid) from public;
grant execute on function public.block_user(uuid) to authenticated;
revoke all on function public.unblock_user(uuid) from public;
grant execute on function public.unblock_user(uuid) to authenticated;
revoke all on function public.report_user(uuid,text,uuid,uuid) from public;
grant execute on function public.report_user(uuid,text,uuid,uuid) to authenticated;


-- Function execution hardening. SECURITY DEFINER functions are not callable
-- anonymously and are granted only to the role that needs them.
revoke all on function public.generate_character_code() from public;
revoke all on function public.handle_new_user_profile() from public;
revoke all on function public.apply_paid_purchase(uuid,text) from public;
grant execute on function public.apply_paid_purchase(uuid,text) to service_role;
revoke all on function public.spend_credits(integer,text,text,jsonb) from public;
grant execute on function public.spend_credits(integer,text,text,jsonb) to authenticated;
revoke all on function public.respond_to_friend_request(uuid,boolean) from public;
grant execute on function public.respond_to_friend_request(uuid,boolean) to authenticated;
revoke all on function public.create_clan(text,text,text,text,jsonb) from public;
grant execute on function public.create_clan(text,text,text,text,jsonb) to authenticated;
revoke all on function public.accept_clan_join_request(uuid) from public;
grant execute on function public.accept_clan_join_request(uuid) to authenticated;
revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
revoke all on function public.create_or_get_clan_conversation(uuid) from public;
grant execute on function public.create_or_get_clan_conversation(uuid) to authenticated;


-- If either side blocks the other, chat messages are no longer readable or
-- writable through the normal client path.
drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated
using (
  exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_id and cm.user_id=auth.uid())
  and not exists (
    select 1 from public.conversation_members cm_other
    join public.user_blocks ub on (
      (ub.blocker_id=auth.uid() and ub.blocked_id=cm_other.user_id)
      or (ub.blocker_id=cm_other.user_id and ub.blocked_id=auth.uid())
    )
    where cm_other.conversation_id=conversation_id
  )
);

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert to authenticated
with check (
  sender_id=auth.uid()
  and exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_id and cm.user_id=auth.uid())
  and not exists (
    select 1 from public.conversation_members cm_other
    join public.user_blocks ub on (
      (ub.blocker_id=auth.uid() and ub.blocked_id=cm_other.user_id)
      or (ub.blocker_id=cm_other.user_id and ub.blocked_id=auth.uid())
    )
    where cm_other.conversation_id=conversation_id
  )
);
