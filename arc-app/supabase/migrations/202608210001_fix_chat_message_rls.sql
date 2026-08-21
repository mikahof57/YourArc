-- Reproduce the deployed chat message RLS fix.
-- Authorization is evaluated with trusted privileges so RLS on
-- conversation_members and user_blocks cannot hide security-relevant rows.
create or replace function public.arc_can_access_conversation(
  p_conversation_id uuid
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
          or
          (
            block_relation.blocker_id = other_member.user_id
            and block_relation.blocked_id = auth.uid()
          )
        )
      where other_member.conversation_id = p_conversation_id
    );
$function$;

revoke all
on function public.arc_can_access_conversation(uuid)
from public;

revoke all
on function public.arc_can_access_conversation(uuid)
from anon;

grant execute
on function public.arc_can_access_conversation(uuid)
to authenticated;

drop policy if exists messages_select_member
on public.messages;

create policy messages_select_member
on public.messages
for select
to authenticated
using (
  public.arc_can_access_conversation(public.messages.conversation_id)
);

drop policy if exists messages_insert_member
on public.messages;

create policy messages_insert_member
on public.messages
for insert
to authenticated
with check (
  public.messages.sender_id = auth.uid()
  and public.arc_can_access_conversation(public.messages.conversation_id)
);
