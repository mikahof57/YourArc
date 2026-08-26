-- Allow the authoritative zero stat value without changing permanent-max behavior.

begin;

create or replace function public.arc_protect_permanent_stat_max()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if tg_op = 'UPDATE' and old.active and not new.active then
    new.stat_streak := 0;
    new.physical_training_cycle := 0;
  end if;

  if tg_op = 'UPDATE' and old.max_value_locked then
    new.current_value := 100;
    new.max_value_locked := true;
  elsif new.current_value >= 100 then
    new.current_value := 100;
    new.max_value_locked := true;
  end if;

  return new;
end;
$function$;

commit;
