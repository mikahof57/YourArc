-- ARC Community request, clan-membership, and moderation integrity hardening.

begin;

-- Remove any historical clan-chat access created without matching clan
-- membership. Shared conversations and messages remain untouched.
delete from public.conversation_members conversation_membership
using public.conversations clan_conversation
where clan_conversation.id = conversation_membership.conversation_id
  and clan_conversation.type = 'clan'
  and not exists (
    select 1
    from public.clan_members clan_membership
    where clan_membership.clan_id = clan_conversation.clan_id
      and clan_membership.user_id = conversation_membership.user_id
  );

-- Preserve historical request rows while leaving exactly one actionable row
-- for each unordered user pair before enforcing the invariant permanently.
with ranked_pending as (
  select
    fr.id,
    pg_catalog.row_number() over (
      partition by least(fr.sender_id, fr.receiver_id),
                   greatest(fr.sender_id, fr.receiver_id)
      order by fr.created_at, fr.id
    ) as pending_rank
  from public.friend_requests fr
  where fr.status = 'pending'
)
update public.friend_requests fr
set status = 'cancelled',
    updated_at = pg_catalog.clock_timestamp()
from ranked_pending ranked
where ranked.id = fr.id
  and ranked.pending_rank > 1;

create unique index friend_requests_one_pending_pair
  on public.friend_requests (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  where status = 'pending';

drop policy if exists friend_requests_insert_sender on public.friend_requests;
revoke insert, update, delete on table public.friend_requests
  from public, anon, authenticated;

create or replace function public.send_friend_request(p_receiver_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_sender_id uuid := auth.uid();
  v_request_id uuid;
begin
  if v_sender_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_receiver_id is null
    or not exists (select 1 from auth.users u where u.id = p_receiver_id)
  then
    raise exception 'PLAYER_NOT_FOUND';
  end if;
  if p_receiver_id = v_sender_id then
    raise exception 'SELF_REQUEST';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(v_sender_id, p_receiver_id)::text
      || ':'
      || greatest(v_sender_id, p_receiver_id)::text,
      27000101
    )
  );

  if exists (
    select 1
    from public.user_blocks ub
    where (ub.blocker_id = v_sender_id and ub.blocked_id = p_receiver_id)
       or (ub.blocker_id = p_receiver_id and ub.blocked_id = v_sender_id)
  ) then
    raise exception 'USER_BLOCKED';
  end if;

  if exists (
    select 1
    from public.friendships f
    where f.user_a = least(v_sender_id, p_receiver_id)
      and f.user_b = greatest(v_sender_id, p_receiver_id)
  ) then
    raise exception 'ALREADY_FRIENDS';
  end if;

  if exists (
    select 1
    from public.friend_requests fr
    where fr.status = 'pending'
      and least(fr.sender_id, fr.receiver_id)
        = least(v_sender_id, p_receiver_id)
      and greatest(fr.sender_id, fr.receiver_id)
        = greatest(v_sender_id, p_receiver_id)
  ) then
    raise exception 'REQUEST_EXISTS';
  end if;

  insert into public.friend_requests(sender_id, receiver_id, status)
  values(v_sender_id, p_receiver_id, 'pending')
  returning id into v_request_id;

  return v_request_id;
end;
$function$;

create or replace function public.respond_to_friend_request(
  p_request_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_request public.friend_requests%rowtype;
  v_user_a uuid;
  v_user_b uuid;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_accept is null then
    raise exception 'INVALID_FRIEND_RESPONSE';
  end if;

  select *
  into v_request
  from public.friend_requests fr
  where fr.id = p_request_id
    and fr.receiver_id = v_user_id
    and fr.status = 'pending'
  for update;

  if not found then
    raise exception 'FRIEND_REQUEST_NOT_PENDING';
  end if;

  if p_accept then
    v_user_a := least(v_request.sender_id, v_request.receiver_id);
    v_user_b := greatest(v_request.sender_id, v_request.receiver_id);

    if exists (
      select 1
      from public.user_blocks ub
      where (ub.blocker_id = v_user_a and ub.blocked_id = v_user_b)
         or (ub.blocker_id = v_user_b and ub.blocked_id = v_user_a)
    ) then
      raise exception 'USER_BLOCKED';
    end if;

    insert into public.friendships(user_a, user_b)
    values(v_user_a, v_user_b)
    on conflict(user_a, user_b) do nothing;

    update public.friend_requests
    set status = 'accepted', updated_at = pg_catalog.clock_timestamp()
    where id = v_request.id;
  else
    update public.friend_requests
    set status = 'declined', updated_at = pg_catalog.clock_timestamp()
    where id = v_request.id;
  end if;
end;
$function$;

create or replace function public.accept_clan_join_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_request public.clan_join_requests%rowtype;
  v_member_count integer;
begin
  if v_actor_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select *
  into v_request
  from public.clan_join_requests request_row
  where request_row.id = p_request_id
    and request_row.status = 'pending'
  for update;

  if not found then
    raise exception 'CLAN_REQUEST_NOT_PENDING';
  end if;
  if not exists (
    select 1
    from public.clan_members actor_membership
    where actor_membership.clan_id = v_request.clan_id
      and actor_membership.user_id = v_actor_id
      and actor_membership.role in ('leader', 'officer')
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_request.user_id::text, 27000102)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_request.clan_id::text, 27000103)
  );

  if exists (
    select 1 from public.clan_members existing_membership
    where existing_membership.user_id = v_request.user_id
  ) then
    raise exception 'TARGET_ALREADY_IN_CLAN';
  end if;

  select pg_catalog.count(*)
  into v_member_count
  from public.clan_members cm
  where cm.clan_id = v_request.clan_id;

  if v_member_count >= (
    select c.max_members from public.clans c where c.id = v_request.clan_id
  ) then
    raise exception 'CLAN_FULL';
  end if;

  insert into public.clan_members(clan_id, user_id, role)
  values(v_request.clan_id, v_request.user_id, 'member');

  insert into public.conversation_members(conversation_id, user_id)
  select c.id, v_request.user_id
  from public.conversations c
  where c.type = 'clan'
    and c.clan_id = v_request.clan_id
  on conflict(conversation_id, user_id) do nothing;

  update public.clan_join_requests
  set status = 'accepted'
  where id = v_request.id;

  return v_request.clan_id;
end;
$function$;

create or replace function public.decline_clan_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_request public.clan_join_requests%rowtype;
begin
  if v_actor_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select *
  into v_request
  from public.clan_join_requests request_row
  where request_row.id = p_request_id
    and request_row.status = 'pending'
  for update;

  if not found then
    raise exception 'CLAN_REQUEST_NOT_PENDING';
  end if;
  if not exists (
    select 1
    from public.clan_members actor_membership
    where actor_membership.clan_id = v_request.clan_id
      and actor_membership.user_id = v_actor_id
      and actor_membership.role in ('leader', 'officer')
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  update public.clan_join_requests
  set status = 'declined'
  where id = v_request.id;
end;
$function$;

create or replace function public.respond_to_clan_invitation(
  p_invitation_id uuid,
  p_accept boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.clan_invitations%rowtype;
  v_member_count integer;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_accept is null then
    raise exception 'INVALID_CLAN_INVITATION_RESPONSE';
  end if;

  select *
  into v_invitation
  from public.clan_invitations invitation_row
  where invitation_row.id = p_invitation_id
    and invitation_row.receiver_id = v_user_id
    and invitation_row.status = 'pending'
  for update;

  if not found then
    raise exception 'CLAN_INVITATION_NOT_PENDING';
  end if;

  if not p_accept then
    update public.clan_invitations
    set status = 'declined'
    where id = v_invitation.id;
    return v_invitation.clan_id;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 27000102)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_invitation.clan_id::text, 27000103)
  );

  if exists (
    select 1 from public.clan_members existing_membership
    where existing_membership.user_id = v_user_id
  ) then
    raise exception 'ALREADY_IN_CLAN';
  end if;
  if not exists (
    select 1 from public.clans c where c.id = v_invitation.clan_id
  ) then
    raise exception 'CLAN_NOT_FOUND';
  end if;

  select pg_catalog.count(*)
  into v_member_count
  from public.clan_members cm
  where cm.clan_id = v_invitation.clan_id;

  if v_member_count >= (
    select c.max_members from public.clans c where c.id = v_invitation.clan_id
  ) then
    raise exception 'CLAN_FULL';
  end if;

  insert into public.clan_members(clan_id, user_id, role)
  values(v_invitation.clan_id, v_user_id, 'member');

  insert into public.conversation_members(conversation_id, user_id)
  select c.id, v_user_id
  from public.conversations c
  where c.type = 'clan'
    and c.clan_id = v_invitation.clan_id
  on conflict(conversation_id, user_id) do nothing;

  update public.clan_invitations
  set status = 'accepted'
  where id = v_invitation.id;

  return v_invitation.clan_id;
end;
$function$;

drop policy if exists user_reports_insert_self on public.user_reports;
revoke insert, update, delete on table public.user_reports
  from public, anon, authenticated;

create or replace function public.report_user(
  p_reported_user_id uuid,
  p_reason text,
  p_conversation_id uuid default null,
  p_message_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_reporter_id uuid := auth.uid();
  v_reason text := pg_catalog.btrim(p_reason);
  v_report_id uuid;
begin
  if v_reporter_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_reported_user_id is null
    or not exists (select 1 from auth.users u where u.id = p_reported_user_id)
  then
    raise exception 'REPORTED_USER_NOT_FOUND';
  end if;
  if p_reported_user_id = v_reporter_id then
    raise exception 'INVALID_REPORT_TARGET';
  end if;
  if v_reason is null or pg_catalog.char_length(v_reason) not between 3 and 500 then
    raise exception 'INVALID_REPORT_REASON';
  end if;
  if p_message_id is not null and p_conversation_id is null then
    raise exception 'REPORT_CONVERSATION_REQUIRED';
  end if;

  if p_conversation_id is not null then
    if not exists (
      select 1
      from public.conversation_members reporter_membership
      where reporter_membership.conversation_id = p_conversation_id
        and reporter_membership.user_id = v_reporter_id
    ) then
      raise exception 'REPORT_CONVERSATION_NOT_ACCESSIBLE';
    end if;
    if not exists (
      select 1
      from public.conversation_members reported_membership
      where reported_membership.conversation_id = p_conversation_id
        and reported_membership.user_id = p_reported_user_id
    ) then
      raise exception 'REPORTED_USER_NOT_IN_CONVERSATION';
    end if;
  end if;

  if p_message_id is not null and not exists (
    select 1
    from public.messages reported_message
    where reported_message.id = p_message_id
      and reported_message.conversation_id = p_conversation_id
      and reported_message.sender_id = p_reported_user_id
      and reported_message.created_at >= (
        select reporter_membership.history_visible_from
        from public.conversation_members reporter_membership
        where reporter_membership.conversation_id = p_conversation_id
          and reporter_membership.user_id = v_reporter_id
      )
  ) then
    raise exception 'INVALID_REPORTED_MESSAGE';
  end if;

  insert into public.user_reports(
    reporter_id,
    reported_user_id,
    reason,
    conversation_id,
    message_id,
    status
  ) values (
    v_reporter_id,
    p_reported_user_id,
    v_reason,
    p_conversation_id,
    p_message_id,
    'open'
  )
  returning id into v_report_id;

  return v_report_id;
end;
$function$;

alter function public.send_friend_request(uuid) owner to postgres;
alter function public.respond_to_friend_request(uuid, boolean) owner to postgres;
alter function public.accept_clan_join_request(uuid) owner to postgres;
alter function public.decline_clan_join_request(uuid) owner to postgres;
alter function public.respond_to_clan_invitation(uuid, boolean) owner to postgres;
alter function public.report_user(uuid, text, uuid, uuid) owner to postgres;

revoke all on function public.send_friend_request(uuid)
  from public, anon, authenticated;
revoke all on function public.respond_to_friend_request(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.accept_clan_join_request(uuid)
  from public, anon, authenticated;
revoke all on function public.decline_clan_join_request(uuid)
  from public, anon, authenticated;
revoke all on function public.respond_to_clan_invitation(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.report_user(uuid, text, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, boolean) to authenticated;
grant execute on function public.accept_clan_join_request(uuid) to authenticated;
grant execute on function public.decline_clan_join_request(uuid) to authenticated;
grant execute on function public.respond_to_clan_invitation(uuid, boolean) to authenticated;
grant execute on function public.report_user(uuid, text, uuid, uuid) to authenticated;

commit;
