-- ARC authenticated first-character initialization and zero-value consistency.
-- This migration does not initialize or reset any existing account.

begin;

alter table public.arc_user_stats
  drop constraint arc_user_stats_engine_value_check;

alter table public.arc_user_stats
  add constraint arc_user_stats_engine_value_check
  check (current_value between 0 and 100) not valid;

create or replace function public.arc_process_elapsed_days(
  p_user_id uuid,
  p_current_arc_day date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_state public.arc_progress_state%rowtype;
  v_day date;
  v_prior_day date;
  v_stat record;
  v_completed boolean;
  v_before integer;
  v_after integer;
  v_delta integer;
begin
  select * into v_state
  from public.arc_progress_state
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'arc_progress_state_missing';
  end if;
  if v_state.daily_engine_started_arc_day is null then
    raise exception 'arc_daily_engine_not_started';
  end if;
  if p_current_arc_day < v_state.last_processed_arc_day then
    return;
  end if;

  v_day := v_state.last_processed_arc_day + 1;
  while v_day <= p_current_arc_day loop
    v_prior_day := v_day - 1;

    for v_stat in
      select us.*
      from public.arc_user_stats us
      where us.user_id = p_user_id
        and us.active
        and coalesce(us.active_since_arc_day, v_state.daily_engine_started_arc_day) <= v_prior_day
      order by us.sort_order, us.stat_id
      for update
    loop
      select exists (
        select 1
        from public.arc_daily_assignments da
        where da.user_id = p_user_id
          and da.stat_id = v_stat.stat_id
          and da.arc_day = v_prior_day
          and da.completed_at is not null
      ) into v_completed;

      if not v_completed then
        v_before := v_stat.current_value;
        if v_stat.max_value_locked or v_before = 100 then
          v_after := 100;
        else
          v_after := greatest(0, v_before - 1);
        end if;
        v_delta := v_after - v_before;

        update public.arc_user_stats
        set current_value = v_after,
            stat_streak = 0,
            physical_training_cycle = case
              when exists (
                select 1
                from public.arc_stat_special_rules sr
                where sr.stat_id = v_stat.stat_id
                  and sr.rule_type = 'training_cycle_restday'
                  and sr.active
              ) then 0
              else physical_training_cycle
            end,
            updated_at = pg_catalog.clock_timestamp()
        where user_id = p_user_id and stat_id = v_stat.stat_id;

        if not v_stat.max_value_locked and v_before < 100 and v_delta <> 0 then
          insert into public.arc_progress_events (
            user_id, stat_id, arc_day, event_type, assignment_id, import_id,
            delta, value_before, value_after, metadata, created_at
          ) values (
            p_user_id, v_stat.stat_id, v_day, 'DAILY_DECAY', null, null,
            v_delta, v_before, v_after,
            pg_catalog.jsonb_build_object(
              'missed_assignment_arc_day', v_prior_day,
              'source', 'server_daily_engine',
              'floor_reached', v_after = 0
            ),
            pg_catalog.clock_timestamp()
          )
          on conflict do nothing;
        end if;
      end if;
    end loop;

    insert into public.arc_progress_daily_snapshots (
      user_id, stat_id, arc_day, value, source, import_id, metadata, created_at
    )
    select
      us.user_id, us.stat_id, v_day, us.current_value, 'server', null,
      pg_catalog.jsonb_build_object('source', 'server_daily_engine'),
      pg_catalog.clock_timestamp()
    from public.arc_user_stats us
    where us.user_id = p_user_id and us.active
    on conflict (user_id, stat_id, arc_day, source)
    do update set value = excluded.value,
                  metadata = excluded.metadata;

    update public.arc_progress_state
    set last_processed_arc_day = v_day,
        updated_at = pg_catalog.clock_timestamp()
    where user_id = p_user_id;

    v_day := v_day + 1;
  end loop;
end;
$function$;

create or replace function public.arc_get_or_initialize_today()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_state public.arc_progress_state%rowtype;
  v_local_day date;
  v_arc_day date;
  v_level integer;
  v_level_floor bigint;
  v_next_threshold bigint;
  v_payload jsonb;
begin
  if v_user_id is null then raise exception 'arc_daily_not_authenticated'; end if;

  select * into v_state
  from public.arc_progress_state
  where user_id = v_user_id
  for update;
  if not found then raise exception 'arc_daily_progress_not_initialized'; end if;

  if not exists (
    select 1 from pg_catalog.pg_timezone_names where name = v_state.timezone
  ) then
    raise exception 'arc_daily_timezone_invalid';
  end if;

  v_local_day := (pg_catalog.clock_timestamp() at time zone v_state.timezone)::date;
  v_arc_day := greatest(v_local_day, coalesce(v_state.last_processed_arc_day, v_local_day));

  if v_state.daily_engine_started_arc_day is null then
    update public.arc_progress_state
    set daily_engine_started_arc_day = v_arc_day,
        last_processed_arc_day = v_arc_day,
        lifetime_xp = greatest(
          lifetime_xp,
          coalesce((
            select public.arc_xp_threshold_for_level(greatest(1, p.level))
            from public.profiles p
            where p.user_id = v_user_id
          ), 0)
        ),
        updated_at = pg_catalog.clock_timestamp()
    where user_id = v_user_id;

    update public.arc_user_stats
    set active_since_arc_day = case when active then v_arc_day else active_since_arc_day end,
        stat_streak = 0,
        physical_training_cycle = 0,
        updated_at = pg_catalog.clock_timestamp()
    where user_id = v_user_id;
  else
    perform public.arc_process_elapsed_days(v_user_id, v_arc_day);
  end if;

  perform public.arc_register_login_day(v_user_id, v_arc_day);
  perform public.arc_materialize_daily_assignments(v_user_id, v_arc_day);

  insert into public.arc_progress_daily_snapshots (
    user_id, stat_id, arc_day, value, source, import_id, metadata, created_at
  )
  select us.user_id, us.stat_id, v_arc_day, us.current_value, 'server', null,
    pg_catalog.jsonb_build_object('source', 'server_daily_engine'),
    pg_catalog.clock_timestamp()
  from public.arc_user_stats us
  where us.user_id = v_user_id and us.active
  on conflict (user_id, stat_id, arc_day, source)
  do update set value = excluded.value,
                metadata = excluded.metadata;

  select * into v_state
  from public.arc_progress_state where user_id = v_user_id;
  v_level := public.arc_level_from_lifetime_xp(v_state.lifetime_xp);
  v_level_floor := public.arc_xp_threshold_for_level(v_level);
  v_next_threshold := public.arc_xp_threshold_for_level(v_level + 1);

  select pg_catalog.jsonb_build_object(
    'arc_day', v_arc_day,
    'timezone', v_state.timezone,
    'login_streak', v_state.login_streak,
    'lifetime_xp', v_state.lifetime_xp,
    'level', v_level,
    'current_level_xp', v_state.lifetime_xp - v_level_floor,
    'required_level_xp', v_next_threshold - v_level_floor,
    'stats', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'stat_id', us.stat_id,
        'stat_kind', us.stat_kind,
        'canonical_stat_key', us.canonical_stat_key,
        'display_name', us.display_name,
        'emoji', us.emoji,
        'current_value', us.current_value,
        'start_value', us.start_value,
        'sort_order', us.sort_order,
        'active', us.active,
        'task_selection_mode', us.task_selection_mode,
        'current_task_index', us.current_task_index,
        'stat_streak', us.stat_streak,
        'physical_training_cycle', us.physical_training_cycle,
        'max_value_locked', us.max_value_locked
      ) order by us.sort_order, us.stat_id)
      from public.arc_user_stats us where us.user_id = v_user_id
    ), '[]'::jsonb),
    'assignments', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'assignment_id', da.assignment_id,
        'arc_day', da.arc_day,
        'stat_id', da.stat_id,
        'task_source', da.task_source,
        'preset_catalog_version', da.preset_catalog_version,
        'preset_task_key', da.preset_task_key,
        'custom_task_id', da.custom_task_id,
        'assignment_kind', da.assignment_kind,
        'special_rule_key', da.special_rule_key,
        'title', da.snapshot_title,
        'description', da.snapshot_description,
        'tier', da.snapshot_tier,
        'sort_order', da.snapshot_order,
        'task_metadata', da.task_metadata,
        'completion_choice_key', da.completion_choice_key,
        'completed_at', da.completed_at
      ) order by us.sort_order, da.assignment_id)
      from public.arc_daily_assignments da
      join public.arc_user_stats us
        on us.user_id = da.user_id and us.stat_id = da.stat_id
      where da.user_id = v_user_id and da.arc_day = v_arc_day
    ), '[]'::jsonb),
    'recent_server_history', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'stat_id', h.stat_id, 'arc_day', h.arc_day, 'value', h.value, 'source', h.source
      ) order by h.arc_day, h.stat_id)
      from public.arc_progress_daily_snapshots h
      where h.user_id = v_user_id
        and h.source = 'server'
        and h.arc_day >= v_arc_day - 89
    ), '[]'::jsonb)
  ) into v_payload;

  return v_payload;
end;
$function$;

create or replace function public.initialize_arc_character(
  p_profile jsonb,
  p_stats jsonb,
  p_timezone text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile_rows integer;
begin
  if v_user_id is null then
    raise exception 'arc_character_not_authenticated';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 21726001)
  );

  if p_profile is null
    or pg_catalog.jsonb_typeof(p_profile) <> 'object'
    or not public.arc_jsonb_has_only_keys(p_profile, array['name','avatar_url','gender'])
    or not (p_profile ?& array['name','avatar_url','gender'])
    or pg_catalog.jsonb_typeof(p_profile->'name') <> 'string'
    or pg_catalog.char_length(p_profile->>'name') not between 1 and 60
    or pg_catalog.jsonb_typeof(p_profile->'avatar_url') <> 'string'
    or pg_catalog.char_length(p_profile->>'avatar_url') not between 1 and 2048
    or pg_catalog.jsonb_typeof(p_profile->'gender') <> 'string'
    or p_profile->>'gender' not in ('m','f','d')
  then
    raise exception 'arc_character_profile_invalid';
  end if;

  if p_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_timezone
  ) then
    raise exception 'arc_character_timezone_invalid';
  end if;

  if p_stats is null
    or pg_catalog.jsonb_typeof(p_stats) <> 'array'
    or pg_catalog.jsonb_array_length(p_stats) not between 1 and 6
  then
    raise exception 'arc_character_stats_invalid';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_stats) stat
    where pg_catalog.jsonb_typeof(stat) <> 'object'
      or not public.arc_jsonb_has_only_keys(stat, array['stat_id','start_value'])
      or not (stat ?& array['stat_id','start_value'])
      or pg_catalog.jsonb_typeof(stat->'stat_id') <> 'string'
      or stat->>'stat_id' not in ('wissen','muskeln','geist','beweglichkeit','business','geld')
      or pg_catalog.jsonb_typeof(stat->'start_value') <> 'number'
      or (stat->>'start_value')::numeric <> pg_catalog.trunc((stat->>'start_value')::numeric)
      or (stat->>'start_value')::numeric not between 0 and 99
  ) then
    raise exception 'arc_character_stat_entry_invalid';
  end if;

  if exists (
    select stat->>'stat_id'
    from pg_catalog.jsonb_array_elements(p_stats) stat
    group by stat->>'stat_id'
    having count(*) > 1
  ) then
    raise exception 'arc_character_stat_duplicate';
  end if;

  if exists (select 1 from public.arc_progress_state where user_id = v_user_id)
    or exists (select 1 from public.arc_user_stats where user_id = v_user_id)
    or exists (select 1 from public.arc_custom_tasks where user_id = v_user_id)
    or exists (select 1 from public.arc_preset_task_exclusions where user_id = v_user_id)
    or exists (select 1 from public.arc_preset_task_overrides where user_id = v_user_id)
    or exists (select 1 from public.arc_daily_assignments where user_id = v_user_id)
    or exists (select 1 from public.arc_progress_events where user_id = v_user_id)
    or exists (select 1 from public.arc_progress_imports where user_id = v_user_id)
    or exists (select 1 from public.arc_progress_daily_snapshots where user_id = v_user_id)
    or exists (select 1 from public.arc_login_days where user_id = v_user_id)
  then
    raise exception 'arc_character_progress_already_initialized_or_partial';
  end if;

  update public.profiles
  set name = p_profile->>'name',
      avatar_url = p_profile->>'avatar_url',
      gender = p_profile->>'gender',
      updated_at = pg_catalog.clock_timestamp()
  where user_id = v_user_id;
  get diagnostics v_profile_rows = row_count;
  if v_profile_rows <> 1 then
    raise exception 'arc_character_profile_missing';
  end if;

  insert into public.arc_progress_state (
    user_id, timezone, active_catalog_version, created_at, updated_at
  ) values (
    v_user_id, p_timezone, 'arc_tasks_v1',
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );

  insert into public.arc_user_stats (
    user_id, stat_id, stat_kind, canonical_stat_key, display_name, emoji,
    current_value, start_value, sort_order, active,
    task_selection_mode, current_task_index, stat_streak,
    physical_training_cycle, active_since_arc_day, max_value_locked,
    created_at, updated_at
  )
  select
    v_user_id,
    stat->>'stat_id',
    'canonical',
    stat->>'stat_id',
    case stat->>'stat_id'
      when 'wissen' then 'Wissen'
      when 'muskeln' then 'Muskeln'
      when 'geist' then 'Geist'
      when 'beweglichkeit' then 'Beweglichkeit'
      when 'business' then 'Business'
      when 'geld' then 'Geld'
    end,
    case stat->>'stat_id'
      when 'wissen' then '📚'
      when 'muskeln' then '💪'
      when 'geist' then '🧘‍♂️'
      when 'beweglichkeit' then '⚡'
      when 'business' then '💼'
      when 'geld' then '💎'
    end,
    (stat->>'start_value')::smallint,
    (stat->>'start_value')::smallint,
    case stat->>'stat_id'
      when 'wissen' then 0
      when 'muskeln' then 1
      when 'geist' then 2
      when 'beweglichkeit' then 3
      when 'business' then 4
      when 'geld' then 5
    end,
    true,
    'random',
    null,
    0,
    0,
    null,
    false,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
  from pg_catalog.jsonb_array_elements(p_stats) stat;

  return public.arc_get_or_initialize_today();
end;
$function$;

alter function public.initialize_arc_character(jsonb, jsonb, text) owner to postgres;

revoke all on function public.initialize_arc_character(jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.initialize_arc_character(jsonb, jsonb, text)
  to authenticated;

commit;
