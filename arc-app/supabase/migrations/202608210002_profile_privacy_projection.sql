begin;

create or replace view public.public_profiles
with (security_barrier = true)
as
select
  p.user_id,
  p.name,
  p.avatar_url,
  p.character_code,
  p.level,
  p.standard_points,
  p.is_online,
  p.last_seen
from public.profiles as p;

revoke all on table public.public_profiles from public;
revoke all on table public.public_profiles from anon;
revoke all on table public.public_profiles from authenticated;

grant select on table public.public_profiles to authenticated;

drop policy if exists profiles_select_authenticated
on public.profiles;

drop policy if exists profiles_select_self
on public.profiles;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using (
  user_id = auth.uid()
);

commit;
