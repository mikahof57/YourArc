-- Record the economy and RPC hardening already deployed to the live database.
-- This migration is forward-only and does not alter existing account balances.

-- Allow protected profile fields to change only when the effective database role
-- is trusted. SECURITY DEFINER RPCs owned by postgres execute triggers as postgres;
-- direct authenticated profile writes continue to have protected values restored.
create or replace function public.protect_profile_server_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if current_user not in ('postgres', 'service_role') then
    if tg_op = 'UPDATE' then
      new.credits := old.credits;
      new.character_code := old.character_code;
    elsif tg_op = 'INSERT' then
      new.credits := 100;
      if new.character_code is null then
        new.character_code := public.generate_character_code();
      end if;
    end if;
  end if;

  return new;
end;
$function$;

-- New accounts receive one explicit, ledger-backed server-side initial grant.
-- Existing accounts are untouched because this function only runs after a new
-- auth.users row is inserted and the ledger row is conditional on profile insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  insert into public.profiles(
    id,
    user_id,
    email,
    credits,
    character_code,
    level,
    standard_points,
    is_online,
    created_at,
    updated_at
  )
  values(
    new.id,
    new.id,
    new.email,
    100,
    upper(
      'ARC-' ||
      substr(md5(new.id::text || random()::text), 1, 4) ||
      '-' ||
      substr(md5(random()::text || new.id::text), 1, 4)
    ),
    1,
    0,
    false,
    now(),
    now()
  )
  on conflict(id) do nothing;

  insert into public.credit_transactions(
    user_id,
    type,
    amount,
    balance_after,
    provider,
    reference_id,
    metadata
  )
  select
    new.id,
    'initial_grant',
    100,
    100,
    'internal',
    'signup',
    jsonb_build_object('source', 'account_creation')
  where exists (
    select 1
    from public.profiles p
    where p.id = new.id
      and p.credits = 100
  )
  and not exists (
    select 1
    from public.credit_transactions ct
    where ct.user_id = new.id
      and ct.type = 'initial_grant'
      and ct.reference_id = 'signup'
  );

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- The server chooses the daily reward and performs the claim, balance mutation,
-- and positive-reward ledger entry atomically in one database transaction.
create or replace function public.claim_daily_wheel()
returns table(reward integer, balance integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_claim_date date := current_date;
  v_roll double precision;
  v_reward integer;
  v_balance integer;
  v_inserted_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  v_roll := random();

  if v_roll < 0.01 then
    v_reward := 100;
  elsif v_roll < 0.11 then
    v_reward := 25;
  elsif v_roll < 0.51 then
    v_reward := 5;
  else
    v_reward := 0;
  end if;

  insert into public.daily_wheel_claims(user_id, claim_date, reward)
  values(v_user_id, v_claim_date, v_reward)
  on conflict(user_id, claim_date) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 0 then
    raise exception 'already_claimed_today';
  end if;

  update public.profiles
  set credits = credits + v_reward,
      updated_at = now()
  where user_id = v_user_id
  returning credits into v_balance;

  if v_balance is null then
    raise exception 'profile_not_found';
  end if;

  if v_reward > 0 then
    insert into public.credit_transactions(
      user_id,
      type,
      amount,
      balance_after,
      provider,
      reference_id,
      metadata
    )
    values(
      v_user_id,
      'daily_wheel',
      v_reward,
      v_balance,
      'internal',
      v_claim_date::text,
      jsonb_build_object('reward', v_reward, 'claim_date', v_claim_date)
    );
  end if;

  return query select v_reward, v_balance;
end;
$function$;

-- Normalize economy RPC permissions. PUBLIC is revoked explicitly because
-- PostgreSQL grants new functions EXECUTE to PUBLIC by default.
revoke all on function public.apply_paid_purchase(uuid,text) from public, anon, authenticated;
grant execute on function public.apply_paid_purchase(uuid,text) to service_role;

revoke all on function public.spend_credits(integer,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.spend_credits(integer,text,text,jsonb) to authenticated;

revoke all on function public.purchase_store_item(text) from public, anon, authenticated;
grant execute on function public.purchase_store_item(text) to authenticated;

revoke all on function public.claim_daily_wheel(date,integer) from public, anon, authenticated;
revoke all on function public.claim_daily_wheel() from public, anon, authenticated;
grant execute on function public.claim_daily_wheel() to authenticated;

revoke all on function public.arc_can_access_conversation(uuid) from public, anon, authenticated;
grant execute on function public.arc_can_access_conversation(uuid) to authenticated;

-- Social/community SECURITY DEFINER RPCs require an authenticated caller.
revoke all on function public.respond_to_friend_request(uuid,boolean) from public, anon, authenticated;
grant execute on function public.respond_to_friend_request(uuid,boolean) to authenticated;

revoke all on function public.create_clan(text,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_clan(text,text,text,text,jsonb) to authenticated;

revoke all on function public.accept_clan_join_request(uuid) from public, anon, authenticated;
grant execute on function public.accept_clan_join_request(uuid) to authenticated;

revoke all on function public.request_clan_join(uuid) from public, anon, authenticated;
grant execute on function public.request_clan_join(uuid) to authenticated;

revoke all on function public.decline_clan_join_request(uuid) from public, anon, authenticated;
grant execute on function public.decline_clan_join_request(uuid) to authenticated;

revoke all on function public.create_direct_conversation(uuid) from public, anon, authenticated;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

revoke all on function public.create_group_conversation(text,uuid[]) from public, anon, authenticated;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;

revoke all on function public.create_or_get_clan_conversation(uuid) from public, anon, authenticated;
grant execute on function public.create_or_get_clan_conversation(uuid) to authenticated;

revoke all on function public.send_clan_invitation(uuid,uuid) from public, anon, authenticated;
grant execute on function public.send_clan_invitation(uuid,uuid) to authenticated;

revoke all on function public.respond_to_clan_invitation(uuid,boolean) from public, anon, authenticated;
grant execute on function public.respond_to_clan_invitation(uuid,boolean) to authenticated;

revoke all on function public.set_clan_member_role(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.set_clan_member_role(uuid,uuid,text) to authenticated;

revoke all on function public.remove_clan_member(uuid,uuid) from public, anon, authenticated;
grant execute on function public.remove_clan_member(uuid,uuid) to authenticated;

revoke all on function public.leave_clan(uuid,uuid) from public, anon, authenticated;
grant execute on function public.leave_clan(uuid,uuid) to authenticated;

revoke all on function public.set_my_online_status(boolean) from public, anon, authenticated;
grant execute on function public.set_my_online_status(boolean) to authenticated;

revoke all on function public.block_user(uuid) from public, anon, authenticated;
grant execute on function public.block_user(uuid) to authenticated;

revoke all on function public.unblock_user(uuid) from public, anon, authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;

revoke all on function public.report_user(uuid,text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.report_user(uuid,text,uuid,uuid) to authenticated;

-- Trigger/event helpers are never client-callable directly.
revoke all on function public.generate_character_code() from public, anon, authenticated;
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_server_fields() from public, anon, authenticated;
