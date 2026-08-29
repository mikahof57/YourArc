-- Remove a departing clan leader after atomically transferring leadership.

begin;

create or replace function public.leave_clan(
  p_clan_id uuid,
  p_successor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_leader_id uuid;
  v_actor_role text;
  v_member_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select clan.leader_id
  into v_leader_id
  from public.clans clan
  where clan.id = p_clan_id
  for update;

  if not found then
    raise exception 'clan_not_found';
  end if;

  select membership.role
  into v_actor_role
  from public.clan_members membership
  where membership.clan_id = p_clan_id
    and membership.user_id = v_user_id
  for update;

  if not found then
    raise exception 'not_clan_member';
  end if;

  select pg_catalog.count(*)
  into v_member_count
  from public.clan_members membership
  where membership.clan_id = p_clan_id;

  if v_leader_id = v_user_id then
    if v_actor_role <> 'leader' then
      raise exception 'not_authorized';
    end if;

    if v_member_count > 1 then
      if p_successor_id is null or p_successor_id = v_user_id then
        raise exception 'successor_required';
      end if;

      perform 1
      from public.clan_members successor_membership
      where successor_membership.clan_id = p_clan_id
        and successor_membership.user_id = p_successor_id
      for update;

      if not found then
        raise exception 'successor_not_member';
      end if;

      delete from public.conversation_members conversation_membership
      where conversation_membership.user_id = v_user_id
        and conversation_membership.conversation_id in (
          select conversation.id
          from public.conversations conversation
          where conversation.type = 'clan'
            and conversation.clan_id = p_clan_id
        );

      update public.clan_members successor_membership
      set role = 'leader'
      where successor_membership.clan_id = p_clan_id
        and successor_membership.user_id = p_successor_id;

      update public.clans clan
      set leader_id = p_successor_id
      where clan.id = p_clan_id;

      delete from public.clan_members former_leader_membership
      where former_leader_membership.clan_id = p_clan_id
        and former_leader_membership.user_id = v_user_id;

      return;
    end if;

    -- Clan conversations have no foreign key to clans. Remove every remaining
    -- access row explicitly before deleting a last-member clan.
    delete from public.conversation_members conversation_membership
    where conversation_membership.conversation_id in (
      select conversation.id
      from public.conversations conversation
      where conversation.type = 'clan'
        and conversation.clan_id = p_clan_id
    );

    delete from public.clans clan
    where clan.id = p_clan_id;

    return;
  end if;

  if v_actor_role = 'leader' then
    raise exception 'not_authorized';
  end if;

  delete from public.conversation_members conversation_membership
  where conversation_membership.user_id = v_user_id
    and conversation_membership.conversation_id in (
      select conversation.id
      from public.conversations conversation
      where conversation.type = 'clan'
        and conversation.clan_id = p_clan_id
    );

  delete from public.clan_members membership
  where membership.clan_id = p_clan_id
    and membership.user_id = v_user_id;
end;
$function$;

alter function public.leave_clan(uuid, uuid) owner to postgres;

revoke all on function public.leave_clan(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.leave_clan(uuid, uuid)
  to authenticated;

commit;
