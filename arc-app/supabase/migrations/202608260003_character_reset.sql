-- ARC destructive character reset and durable chat-history membership boundary.

begin;

alter table public.conversation_members
  add column history_visible_from timestamptz;

update public.conversation_members cm
set history_visible_from = c.created_at
from public.conversations c
where c.id = cm.conversation_id;

alter table public.conversation_members
  alter column history_visible_from set default now(),
  alter column history_visible_from set not null;

create or replace function public.arc_can_read_conversation_message(
  p_conversation_id uuid,
  p_message_created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.conversation_members as own_membership
      where own_membership.conversation_id = p_conversation_id
        and own_membership.user_id = auth.uid()
        and p_message_created_at >= own_membership.history_visible_from
    )
    and not exists (
      select 1
      from public.conversation_members as other_member
      join public.user_blocks as block_relation
        on (
          (
            block_relation.blocker_id = auth.uid()
            and block_relation.blocked_id = other_member.user_id
          )
          or (
            block_relation.blocker_id = other_member.user_id
            and block_relation.blocked_id = auth.uid()
          )
        )
      where other_member.conversation_id = p_conversation_id
    );
$function$;

alter function public.arc_can_read_conversation_message(uuid, timestamptz)
  owner to postgres;

revoke all on function public.arc_can_read_conversation_message(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.arc_can_read_conversation_message(uuid, timestamptz)
  to authenticated;

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member
  on public.messages
  for select
  to authenticated
  using (
    public.arc_can_read_conversation_message(
      public.messages.conversation_id,
      public.messages.created_at
    )
  );

create or replace function public.reset_arc_character()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_character_code text;
begin
  if v_user_id is null then
    raise exception 'arc_character_reset_not_authenticated';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 21726001)
  );

  select p.id
  into v_profile_id
  from public.profiles p
  where p.user_id = v_user_id
  for update;

  if v_profile_id is null then
    raise exception 'arc_character_reset_profile_missing';
  end if;

  -- Child-first deletion for the server-authoritative progression graph.
  delete from public.arc_progress_events where user_id = v_user_id;
  delete from public.arc_progress_daily_snapshots where user_id = v_user_id;
  delete from public.arc_daily_assignments where user_id = v_user_id;
  delete from public.arc_preset_task_overrides where user_id = v_user_id;
  delete from public.arc_preset_task_exclusions where user_id = v_user_id;
  delete from public.arc_custom_tasks where user_id = v_user_id;
  delete from public.arc_progress_imports where user_id = v_user_id;
  delete from public.arc_login_days where user_id = v_user_id;
  delete from public.arc_user_stats where user_id = v_user_id;
  delete from public.arc_progress_state where user_id = v_user_id;

  -- Legacy character progress references profiles.id rather than auth.users.id.
  delete from public.habits where user_id = v_profile_id;
  delete from public.stats where user_id = v_profile_id;

  delete from public.friend_requests
  where sender_id = v_user_id or receiver_id = v_user_id;
  delete from public.friendships
  where user_a = v_user_id or user_b = v_user_id;
  delete from public.user_blocks
  where blocker_id = v_user_id or blocked_id = v_user_id;

  -- Destroy character-owned clans without transferring leadership. Preserve the
  -- shared message rows, but remove every active membership from their chats.
  delete from public.conversation_members cm
  where cm.conversation_id in (
    select c.id
    from public.conversations c
    join public.clans owned_clan on owned_clan.id = c.clan_id
    where owned_clan.leader_id = v_user_id
  );

  delete from public.clan_invitations
  where sender_id = v_user_id or receiver_id = v_user_id;
  delete from public.clan_join_requests where user_id = v_user_id;
  delete from public.clan_members where user_id = v_user_id;
  delete from public.clans where leader_id = v_user_id;

  -- The old character loses all chat access. A later membership gets the new
  -- default history boundary and cannot expose messages from this generation.
  delete from public.conversation_members where user_id = v_user_id;

  -- Match the current server-owned ARC character-code format used at signup.
  loop
    v_character_code := pg_catalog.upper(
      'ARC-'
      || pg_catalog.substr(pg_catalog.md5(v_user_id::text || pg_catalog.random()::text), 1, 4)
      || '-'
      || pg_catalog.substr(pg_catalog.md5(pg_catalog.random()::text || v_user_id::text), 1, 4)
    );
    exit when not exists (
      select 1
      from public.profiles p
      where p.character_code = v_character_code
    );
  end loop;

  update public.profiles
  set name = null,
      avatar_url = null,
      gender = null,
      character_code = v_character_code,
      level = 1,
      standard_points = 0,
      is_online = false,
      last_seen = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where id = v_profile_id
    and user_id = v_user_id;

  return pg_catalog.jsonb_build_object(
    'reset', true,
    'character_code', v_character_code
  );
end;
$function$;

alter function public.reset_arc_character() owner to postgres;

revoke all on function public.reset_arc_character()
  from public, anon, authenticated;
grant execute on function public.reset_arc_character()
  to authenticated;

commit;
