-- ARC server-authoritative daily progression engine foundation.
-- This migration does not cut the frontend over or invoke any progression RPC.

begin;

alter table public.arc_progress_state
  add column daily_engine_started_arc_day date,
  add column lifetime_xp bigint not null default 0 check (lifetime_xp >= 0),
  add column login_streak integer not null default 0 check (login_streak >= 0),
  add column last_login_arc_day date;

alter table public.arc_user_stats
  add column stat_streak integer not null default 0 check (stat_streak >= 0),
  add column physical_training_cycle smallint not null default 0
    check (physical_training_cycle between 0 and 6),
  add column active_since_arc_day date,
  add column max_value_locked boolean not null default false;

-- Existing imports historically allowed zero. NOT VALID avoids rewriting them
-- at deployment; first engine hydration clamps every owned stat to the new
-- product minimum before normal daily mutations begin. New imports/writes are
-- checked immediately by PostgreSQL.
alter table public.arc_user_stats
  add constraint arc_user_stats_engine_value_check
  check (current_value between 1 and 100) not valid;

update public.arc_user_stats
set max_value_locked = true
where current_value = 100;

alter table public.arc_daily_assignments
  drop constraint arc_daily_assignments_task_source_check,
  drop constraint arc_daily_assignments_check,
  add column assignment_kind text not null default 'normal'
    check (assignment_kind in ('normal', 'restday')),
  add column special_rule_key text,
  add column task_metadata jsonb not null default '{}'::jsonb,
  add column completion_choice_key text,
  add constraint arc_daily_assignments_task_source_check
    check (task_source in ('preset', 'custom', 'special')),
  add constraint arc_daily_assignments_task_identity_check check (
    (task_source = 'preset'
      and preset_catalog_version is not null
      and preset_task_key is not null
      and custom_task_id is null
      and special_rule_key is null)
    or
    (task_source = 'custom'
      and preset_catalog_version is null
      and preset_task_key is null
      and custom_task_id is not null
      and special_rule_key is null)
    or
    (task_source = 'special'
      and preset_catalog_version is null
      and preset_task_key is null
      and custom_task_id is null
      and special_rule_key is not null)
  ),
  add constraint arc_daily_assignments_kind_source_check check (
    (assignment_kind = 'normal' and task_source in ('preset', 'custom'))
    or (assignment_kind = 'restday' and task_source = 'special')
  );

create table public.arc_stat_special_rules (
  stat_id text primary key check (char_length(stat_id) between 1 and 128),
  rule_type text not null check (rule_type in ('training_cycle_restday')),
  config jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(config) = 'object')
);

create table public.arc_login_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  arc_day date not null,
  timezone text not null check (char_length(timezone) between 1 and 255),
  created_at timestamptz not null default now(),
  primary key (user_id, arc_day)
);

insert into public.arc_stat_special_rules (stat_id, rule_type, config)
values (
  'muskeln',
  'training_cycle_restday',
  jsonb_build_object(
    'training_days_required', 6,
    'title', 'Aktiver Restday',
    'description', 'Wähle eine aktive Regenerationsoption und schließe sie heute ab.',
    'options', jsonb_build_array(
      jsonb_build_object('key', 'sauna', 'title', 'Sauna'),
      jsonb_build_object('key', 'massage', 'title', 'Massage'),
      jsonb_build_object('key', 'hot_bath', 'title', 'Heißes Bad')
    )
  )
)
on conflict (stat_id) do update
set rule_type = excluded.rule_type,
    config = excluded.config,
    active = true,
    updated_at = now();

create unique index arc_progress_events_daily_decay_unique
  on public.arc_progress_events(user_id, stat_id, arc_day)
  where event_type = 'DAILY_DECAY';

create index arc_daily_assignments_task_history_idx
  on public.arc_daily_assignments(
    user_id, stat_id, task_source, preset_task_key, custom_task_id, arc_day desc
  );

create or replace function public.arc_xp_balance_config()
returns table (
  level_base_xp numeric,
  level_growth numeric,
  official_base_xp integer,
  official_tier_divisor numeric
)
language sql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
  -- PROVISIONAL_BALANCE_NOT_FINAL
  -- This is the single adjustment point for all Phase 2.17A XP numbers.
  -- Product balance must be reviewed before the production progression cutover.
  select 100::numeric, 1.08::numeric, 10, 3::numeric;
$function$;

create or replace function public.arc_xp_threshold_for_level(p_level integer)
returns bigint
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_threshold numeric;
  v_base_xp numeric;
  v_growth numeric;
begin
  if p_level is null or p_level <= 1 then
    return 0;
  end if;

  select level_base_xp, level_growth
  into v_base_xp, v_growth
  from public.arc_xp_balance_config();

  -- Cumulative curve for per-level XP ~= base_xp * growth^(level - 1).
  -- The bigint ceiling keeps the function safe beyond the representable range.
  begin
    v_threshold := pg_catalog.floor(
      (v_base_xp / (v_growth - 1))
      * (pg_catalog.power(v_growth, (p_level - 1)::numeric) - 1)
    );
  exception when numeric_value_out_of_range then
    return 9223372036854775807;
  end;

  if v_threshold >= 9223372036854775807::numeric then
    return 9223372036854775807;
  end if;
  return v_threshold::bigint;
end;
$function$;

create or replace function public.arc_level_from_lifetime_xp(p_lifetime_xp bigint)
returns integer
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_level integer;
  v_base_xp numeric;
  v_growth numeric;
begin
  if p_lifetime_xp is null or p_lifetime_xp <= 0 then
    return 1;
  end if;

  select level_base_xp, level_growth
  into v_base_xp, v_growth
  from public.arc_xp_balance_config();

  v_level := greatest(1, pg_catalog.floor(
    pg_catalog.ln(1::numeric + p_lifetime_xp::numeric * (v_growth - 1) / v_base_xp)
    / pg_catalog.ln(v_growth)
  )::integer + 1);

  -- Reconcile the logarithmic estimate with the floored canonical thresholds.
  while v_level < 2147483647
    and public.arc_xp_threshold_for_level(v_level + 1) <= p_lifetime_xp
  loop
    v_level := v_level + 1;
  end loop;
  while v_level > 1
    and public.arc_xp_threshold_for_level(v_level) > p_lifetime_xp
  loop
    v_level := v_level - 1;
  end loop;

  return v_level;
end;
$function$;

create or replace function public.arc_official_task_xp(
  p_tier integer,
  p_assignment_kind text
)
returns integer
language sql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
  -- PROVISIONAL_BALANCE_NOT_FINAL. Restdays use the same official reward.
  select config.official_base_xp
    + pg_catalog.floor(
      greatest(0, least(12, coalesce(p_tier, 0))) / config.official_tier_divisor
    )::integer
  from public.arc_xp_balance_config() config;
$function$;

create or replace function public.arc_protect_permanent_stat_max()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if new.current_value < 1 then
    new.current_value := 1;
  end if;

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

drop trigger if exists arc_user_stats_permanent_max on public.arc_user_stats;
create trigger arc_user_stats_permanent_max
before insert or update
on public.arc_user_stats
for each row execute function public.arc_protect_permanent_stat_max();

create or replace function public.arc_enforce_custom_progress_limits()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_stat_kind text;
  v_count integer;
begin
  if tg_table_name = 'arc_user_stats' then
    if new.stat_kind = 'custom' and new.active
      and (tg_op = 'INSERT' or old.stat_kind <> 'custom' or not old.active)
    then
      select count(*) into v_count
      from public.arc_user_stats us
      where us.user_id = new.user_id and us.stat_kind = 'custom' and us.active;
      if v_count >= 5 then raise exception 'arc_custom_stat_limit_reached'; end if;
    end if;
  elsif tg_table_name = 'arc_custom_tasks' and new.active
    and (tg_op = 'INSERT' or not old.active or old.stat_id <> new.stat_id)
  then
    select us.stat_kind into v_stat_kind
    from public.arc_user_stats us
    where us.user_id = new.user_id and us.stat_id = new.stat_id;
    if v_stat_kind = 'custom' then
      select count(*) into v_count
      from public.arc_custom_tasks ct
      where ct.user_id = new.user_id and ct.stat_id = new.stat_id and ct.active;
      if v_count >= 30 then raise exception 'arc_custom_task_limit_reached'; end if;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists arc_user_stats_custom_limit on public.arc_user_stats;
create trigger arc_user_stats_custom_limit
before insert or update
on public.arc_user_stats
for each row execute function public.arc_enforce_custom_progress_limits();

drop trigger if exists arc_custom_tasks_limit on public.arc_custom_tasks;
create trigger arc_custom_tasks_limit
before insert or update
on public.arc_custom_tasks
for each row execute function public.arc_enforce_custom_progress_limits();

-- Preserve an existing public level when authoritative XP starts. This does
-- not infer historical XP rewards; it establishes the minimum XP threshold
-- for the already-visible level and never changes credits or standard points.
update public.arc_progress_state ps
set lifetime_xp = public.arc_xp_threshold_for_level(greatest(1, p.level))
from public.profiles p
where p.user_id = ps.user_id
  and ps.lifetime_xp = 0
  and p.level > 1;

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
  -- Callers must already hold this row lock. Re-selecting FOR UPDATE makes the
  -- invariant explicit and keeps direct postgres maintenance calls safe.
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
          v_after := greatest(1, v_before - 1);
        end if;
        v_delta := v_after - v_before;

        update public.arc_user_stats
        set current_value = v_after,
            stat_streak = 0,
            physical_training_cycle = case
              when exists (
                select 1 from public.arc_stat_special_rules sr
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
              'floor_reached', v_after = 1
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

create or replace function public.arc_register_login_day(
  p_user_id uuid,
  p_arc_day date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_last date;
  v_timezone text;
  v_inserted integer;
begin
  select last_login_arc_day, timezone into v_last, v_timezone
  from public.arc_progress_state
  where user_id = p_user_id
  for update;

  if not found then raise exception 'arc_progress_state_missing'; end if;
  if v_last is not null and p_arc_day <= v_last then return; end if;

  insert into public.arc_login_days (user_id, arc_day, timezone, created_at)
  values (p_user_id, p_arc_day, v_timezone, pg_catalog.clock_timestamp())
  on conflict (user_id, arc_day) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return; end if;

  update public.arc_progress_state
  set login_streak = case
        when v_last is null then 1
        when p_arc_day = v_last + 1 then login_streak + 1
        else 1
      end,
      last_login_arc_day = p_arc_day,
      updated_at = pg_catalog.clock_timestamp()
  where user_id = p_user_id;
end;
$function$;

create or replace function public.arc_materialize_daily_assignments(
  p_user_id uuid,
  p_arc_day date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_state public.arc_progress_state%rowtype;
  v_stat record;
  v_rule record;
  v_preset record;
  v_custom record;
  v_tier integer;
  v_count integer;
  v_index integer;
begin
  select * into v_state
  from public.arc_progress_state
  where user_id = p_user_id
  for update;
  if not found then raise exception 'arc_progress_state_missing'; end if;

  for v_stat in
    select us.*
    from public.arc_user_stats us
    where us.user_id = p_user_id
      and us.active
      and coalesce(us.active_since_arc_day, p_arc_day) <= p_arc_day
    order by us.sort_order, us.stat_id
    for update
  loop
    if exists (
      select 1 from public.arc_daily_assignments da
      where da.user_id = p_user_id
        and da.stat_id = v_stat.stat_id
        and da.arc_day = p_arc_day
    ) then
      continue;
    end if;

    select sr.* into v_rule
    from public.arc_stat_special_rules sr
    where sr.stat_id = v_stat.stat_id and sr.active;

    if found
      and v_rule.rule_type = 'training_cycle_restday'
      and v_stat.physical_training_cycle >= coalesce((v_rule.config->>'training_days_required')::integer, 6)
    then
      insert into public.arc_daily_assignments (
        user_id, arc_day, stat_id, task_source,
        snapshot_title, snapshot_description, snapshot_tier, snapshot_order,
        assignment_kind, special_rule_key, task_metadata, created_at
      ) values (
        p_user_id, p_arc_day, v_stat.stat_id, 'special',
        v_rule.config->>'title', v_rule.config->>'description',
        least(12, pg_catalog.floor(v_stat.current_value / 8.0)::integer), 1,
        'restday', v_rule.rule_type,
        pg_catalog.jsonb_build_object(
          'rule_type', v_rule.rule_type,
          'options', v_rule.config->'options',
          'official', true
        ),
        pg_catalog.clock_timestamp()
      );
      continue;
    end if;

    if v_stat.stat_kind = 'canonical' then
      v_tier := least(12, pg_catalog.floor(v_stat.current_value / 8.0)::integer);

      select candidate.* into v_preset
      from (
        select
          pt.catalog_version, pt.task_key, pt.canonical_stat_key, pt.tier,
          coalesce(po.sort_order, pt.sort_order) as effective_order,
          pt.title, pt.description,
          count(hist.assignment_id) as prior_count,
          max(hist.arc_day) as last_arc_day
        from public.arc_preset_tasks pt
        left join public.arc_preset_task_exclusions pe
          on pe.user_id = p_user_id
         and pe.catalog_version = pt.catalog_version
         and pe.task_key = pt.task_key
        left join public.arc_preset_task_overrides po
          on po.user_id = p_user_id
         and po.catalog_version = pt.catalog_version
         and po.task_key = pt.task_key
        left join public.arc_daily_assignments hist
          on hist.user_id = p_user_id
         and hist.stat_id = v_stat.stat_id
         and hist.task_source = 'preset'
         and hist.preset_catalog_version = pt.catalog_version
         and hist.preset_task_key = pt.task_key
        where pt.catalog_version = v_state.active_catalog_version
          and pt.canonical_stat_key = v_stat.canonical_stat_key
          and pt.active
          and pt.tier = v_tier
          and pe.task_key is null
        group by pt.catalog_version, pt.task_key, pt.canonical_stat_key,
          pt.tier, po.sort_order, pt.sort_order, pt.title, pt.description
      ) candidate
      order by candidate.prior_count,
        coalesce(candidate.last_arc_day, '-infinity'::date),
        pg_catalog.hashtextextended(
          p_user_id::text || ':' || v_stat.stat_id || ':' || p_arc_day::text || ':' || candidate.task_key,
          21701
        ),
        candidate.effective_order
      limit 1;

      if v_preset.task_key is null then
        select candidate.* into v_preset
        from (
          select
            pt.catalog_version, pt.task_key, pt.canonical_stat_key, pt.tier,
            coalesce(po.sort_order, pt.sort_order) as effective_order,
            pt.title, pt.description,
            count(hist.assignment_id) as prior_count,
            max(hist.arc_day) as last_arc_day
          from public.arc_preset_tasks pt
          left join public.arc_preset_task_exclusions pe
            on pe.user_id = p_user_id
           and pe.catalog_version = pt.catalog_version
           and pe.task_key = pt.task_key
          left join public.arc_preset_task_overrides po
            on po.user_id = p_user_id
           and po.catalog_version = pt.catalog_version
           and po.task_key = pt.task_key
          left join public.arc_daily_assignments hist
            on hist.user_id = p_user_id
           and hist.stat_id = v_stat.stat_id
           and hist.task_source = 'preset'
           and hist.preset_catalog_version = pt.catalog_version
           and hist.preset_task_key = pt.task_key
          where pt.catalog_version = v_state.active_catalog_version
            and pt.canonical_stat_key = v_stat.canonical_stat_key
            and pt.active
            and pt.tier <= v_tier
            and pe.task_key is null
          group by pt.catalog_version, pt.task_key, pt.canonical_stat_key,
            pt.tier, po.sort_order, pt.sort_order, pt.title, pt.description
        ) candidate
        order by candidate.tier desc, candidate.prior_count,
          coalesce(candidate.last_arc_day, '-infinity'::date),
          pg_catalog.hashtextextended(
            p_user_id::text || ':' || v_stat.stat_id || ':' || p_arc_day::text || ':' || candidate.task_key,
            21702
          ),
          candidate.effective_order
        limit 1;
      end if;

      if v_preset.task_key is null then
        raise exception 'arc_daily_no_official_task_available:%', v_stat.stat_id;
      end if;

      insert into public.arc_daily_assignments (
        user_id, arc_day, stat_id, task_source,
        preset_catalog_version, preset_task_key,
        snapshot_title, snapshot_description, snapshot_tier, snapshot_order,
        assignment_kind, task_metadata, created_at
      ) values (
        p_user_id, p_arc_day, v_stat.stat_id, 'preset',
        v_preset.catalog_version, v_preset.task_key,
        v_preset.title, v_preset.description, v_preset.tier, v_preset.effective_order,
        'normal', pg_catalog.jsonb_build_object('official', true),
        pg_catalog.clock_timestamp()
      );
    else
      select count(*) into v_count
      from public.arc_custom_tasks ct
      where ct.user_id = p_user_id
        and ct.stat_id = v_stat.stat_id
        and ct.active;
      if v_count = 0 then
        raise exception 'arc_daily_active_custom_stat_has_no_tasks:%', v_stat.stat_id;
      end if;

      if v_stat.task_selection_mode = 'sequential' then
        v_index := coalesce(v_stat.current_task_index, 0) % v_count;
        select ct.* into v_custom
        from public.arc_custom_tasks ct
        where ct.user_id = p_user_id
          and ct.stat_id = v_stat.stat_id
          and ct.active
        order by ct.sort_order, ct.task_id
        offset v_index limit 1;

        update public.arc_user_stats
        set current_task_index = (v_index + 1) % v_count,
            updated_at = pg_catalog.clock_timestamp()
        where user_id = p_user_id and stat_id = v_stat.stat_id;
      else
        select candidate.* into v_custom
        from (
          select ct.*, count(hist.assignment_id) as prior_count,
            max(hist.arc_day) as last_arc_day
          from public.arc_custom_tasks ct
          left join public.arc_daily_assignments hist
            on hist.user_id = p_user_id
           and hist.stat_id = v_stat.stat_id
           and hist.task_source = 'custom'
           and hist.custom_task_id = ct.task_id
          where ct.user_id = p_user_id
            and ct.stat_id = v_stat.stat_id
            and ct.active
          group by ct.user_id, ct.task_id, ct.stat_id, ct.title, ct.description,
            ct.tier, ct.sort_order, ct.active, ct.deleted_at, ct.created_at, ct.updated_at
        ) candidate
        order by candidate.prior_count,
          coalesce(candidate.last_arc_day, '-infinity'::date),
          pg_catalog.hashtextextended(
            p_user_id::text || ':' || v_stat.stat_id || ':' || p_arc_day::text || ':' || candidate.task_id,
            21703
          ),
          candidate.sort_order, candidate.task_id
        limit 1;
      end if;

      insert into public.arc_daily_assignments (
        user_id, arc_day, stat_id, task_source, custom_task_id,
        snapshot_title, snapshot_description, snapshot_tier, snapshot_order,
        assignment_kind, task_metadata, created_at
      ) values (
        p_user_id, p_arc_day, v_stat.stat_id, 'custom', v_custom.task_id,
        v_custom.title, v_custom.description, null, v_custom.sort_order,
        'normal', pg_catalog.jsonb_build_object('official', false),
        pg_catalog.clock_timestamp()
      );
    end if;
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
        current_value = greatest(1, current_value),
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

create or replace function public.arc_complete_daily_assignment(
  p_assignment_id uuid,
  p_choice_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_state public.arc_progress_state%rowtype;
  v_assignment public.arc_daily_assignments%rowtype;
  v_stat public.arc_user_stats%rowtype;
  v_local_day date;
  v_arc_day date;
  v_before integer;
  v_after integer;
  v_delta integer;
  v_xp integer;
  v_old_xp bigint;
  v_new_xp bigint;
  v_old_level integer;
  v_new_level integer;
  v_level_floor bigint;
  v_next_threshold bigint;
  v_event record;
begin
  if v_user_id is null then raise exception 'arc_daily_not_authenticated'; end if;

  select * into v_state
  from public.arc_progress_state
  where user_id = v_user_id
  for update;
  if not found or v_state.daily_engine_started_arc_day is null then
    raise exception 'arc_daily_engine_not_initialized';
  end if;

  v_local_day := (pg_catalog.clock_timestamp() at time zone v_state.timezone)::date;
  v_arc_day := greatest(v_local_day, v_state.last_processed_arc_day);
  perform public.arc_process_elapsed_days(v_user_id, v_arc_day);

  select * into v_assignment
  from public.arc_daily_assignments
  where assignment_id = p_assignment_id and user_id = v_user_id
  for update;
  if not found then raise exception 'arc_daily_assignment_not_found'; end if;
  if v_assignment.arc_day <> v_arc_day then raise exception 'arc_daily_assignment_not_today'; end if;

  select * into v_stat
  from public.arc_user_stats
  where user_id = v_user_id and stat_id = v_assignment.stat_id
  for update;
  if not found or not v_stat.active then raise exception 'arc_daily_stat_not_active'; end if;

  if v_assignment.completed_at is not null then
    select e.* into v_event
    from public.arc_progress_events e
    where e.assignment_id = v_assignment.assignment_id
      and e.event_type = 'TASK_COMPLETION';
    if not found then raise exception 'arc_daily_completed_event_missing'; end if;
    v_new_xp := (v_event.metadata->>'lifetime_xp_after')::bigint;
    v_new_level := (v_event.metadata->>'new_level')::integer;
    v_level_floor := public.arc_xp_threshold_for_level(v_new_level);
    v_next_threshold := public.arc_xp_threshold_for_level(v_new_level + 1);
    return pg_catalog.jsonb_build_object(
      'confirmed', true,
      'idempotent_retry', true,
      'assignment_id', v_assignment.assignment_id,
      'arc_day', v_assignment.arc_day,
      'stat_id', v_assignment.stat_id,
      'stat_before', v_event.value_before,
      'stat_after', v_event.value_after,
      'stat_delta', v_event.delta,
      'xp_gained', coalesce((v_event.metadata->>'xp_gained')::integer, 0),
      'lifetime_xp', v_new_xp,
      'old_level', (v_event.metadata->>'old_level')::integer,
      'new_level', (v_event.metadata->>'new_level')::integer,
      'level_up', (v_event.metadata->>'new_level')::integer > (v_event.metadata->>'old_level')::integer,
      'current_level_xp', v_new_xp - v_level_floor,
      'required_level_xp', v_next_threshold - v_level_floor,
      'stat_streak', (v_event.metadata->>'stat_streak_after')::integer,
      'assignment_kind', v_assignment.assignment_kind,
      'completion_choice_key', v_assignment.completion_choice_key
    );
  end if;

  if v_assignment.assignment_kind = 'restday' then
    if p_choice_key is null or not exists (
      select 1
      from pg_catalog.jsonb_array_elements(v_assignment.task_metadata->'options') option_value
      where option_value->>'key' = p_choice_key
    ) then
      raise exception 'arc_daily_restday_choice_invalid';
    end if;
  elsif p_choice_key is not null then
    raise exception 'arc_daily_choice_not_allowed';
  end if;

  v_before := v_stat.current_value;
  v_after := case when v_before >= 100 then 100 else least(100, v_before + 2) end;
  v_delta := v_after - v_before;
  v_xp := case
    when v_stat.stat_kind = 'canonical'
      then public.arc_official_task_xp(v_assignment.snapshot_tier, v_assignment.assignment_kind)
    else 0
  end;
  v_old_xp := v_state.lifetime_xp;
  if v_old_xp > 9223372036854775807 - v_xp then
    raise exception 'arc_daily_lifetime_xp_overflow';
  end if;
  v_new_xp := v_old_xp + v_xp;
  v_old_level := public.arc_level_from_lifetime_xp(v_old_xp);
  v_new_level := public.arc_level_from_lifetime_xp(v_new_xp);

  update public.arc_user_stats
  set current_value = v_after,
      stat_streak = stat_streak + 1,
      physical_training_cycle = case
        when v_assignment.assignment_kind = 'restday' then 0
        when exists (
          select 1 from public.arc_stat_special_rules sr
          where sr.stat_id = v_stat.stat_id
            and sr.rule_type = 'training_cycle_restday'
            and sr.active
        ) then least(6, physical_training_cycle + 1)
        else physical_training_cycle
      end,
      updated_at = pg_catalog.clock_timestamp()
  where user_id = v_user_id and stat_id = v_stat.stat_id
  returning stat_streak into v_stat.stat_streak;

  update public.arc_progress_state
  set lifetime_xp = v_new_xp,
      updated_at = pg_catalog.clock_timestamp()
  where user_id = v_user_id;

  update public.arc_daily_assignments
  set completed_at = pg_catalog.clock_timestamp(),
      completion_choice_key = p_choice_key
  where assignment_id = v_assignment.assignment_id;

  insert into public.arc_progress_events (
    user_id, stat_id, arc_day, event_type, assignment_id, import_id,
    delta, value_before, value_after, metadata, created_at
  ) values (
    v_user_id, v_stat.stat_id, v_arc_day, 'TASK_COMPLETION',
    v_assignment.assignment_id, null, v_delta, v_before, v_after,
    pg_catalog.jsonb_build_object(
      'source', 'server_daily_engine',
      'task_source', v_assignment.task_source,
      'assignment_kind', v_assignment.assignment_kind,
      'preset_catalog_version', v_assignment.preset_catalog_version,
      'preset_task_key', v_assignment.preset_task_key,
      'custom_task_id', v_assignment.custom_task_id,
      'special_rule_key', v_assignment.special_rule_key,
      'completion_choice_key', p_choice_key,
      'official', v_stat.stat_kind = 'canonical',
      'xp_gained', v_xp,
      'lifetime_xp_before', v_old_xp,
      'lifetime_xp_after', v_new_xp,
      'old_level', v_old_level,
      'new_level', v_new_level,
      'stat_streak_after', v_stat.stat_streak
    ),
    pg_catalog.clock_timestamp()
  );

  insert into public.arc_progress_daily_snapshots (
    user_id, stat_id, arc_day, value, source, import_id, metadata, created_at
  ) values (
    v_user_id, v_stat.stat_id, v_arc_day, v_after, 'server', null,
    pg_catalog.jsonb_build_object('source', 'server_daily_engine'),
    pg_catalog.clock_timestamp()
  )
  on conflict (user_id, stat_id, arc_day, source)
  do update set value = excluded.value,
                metadata = excluded.metadata;

  update public.profiles
  set level = v_new_level,
      updated_at = pg_catalog.clock_timestamp()
  where user_id = v_user_id;

  v_level_floor := public.arc_xp_threshold_for_level(v_new_level);
  v_next_threshold := public.arc_xp_threshold_for_level(v_new_level + 1);

  return pg_catalog.jsonb_build_object(
    'confirmed', true,
    'idempotent_retry', false,
    'assignment_id', v_assignment.assignment_id,
    'arc_day', v_arc_day,
    'stat_id', v_stat.stat_id,
    'stat_before', v_before,
    'stat_after', v_after,
    'stat_delta', v_delta,
    'xp_gained', v_xp,
    'lifetime_xp', v_new_xp,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'level_up', v_new_level > v_old_level,
    'current_level_xp', v_new_xp - v_level_floor,
    'required_level_xp', v_next_threshold - v_level_floor,
    'stat_streak', v_stat.stat_streak,
    'assignment_kind', v_assignment.assignment_kind,
    'completion_choice_key', p_choice_key
  );
end;
$function$;

create or replace function public.arc_change_custom_daily_assignment(
  p_assignment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_state public.arc_progress_state%rowtype;
  v_assignment public.arc_daily_assignments%rowtype;
  v_stat public.arc_user_stats%rowtype;
  v_task record;
  v_local_day date;
  v_arc_day date;
  v_count integer;
  v_current_position integer;
begin
  if v_user_id is null then raise exception 'arc_daily_not_authenticated'; end if;

  select * into v_state from public.arc_progress_state
  where user_id = v_user_id for update;
  if not found or v_state.daily_engine_started_arc_day is null then
    raise exception 'arc_daily_engine_not_initialized';
  end if;
  v_local_day := (pg_catalog.clock_timestamp() at time zone v_state.timezone)::date;
  v_arc_day := greatest(v_local_day, v_state.last_processed_arc_day);
  perform public.arc_process_elapsed_days(v_user_id, v_arc_day);

  select * into v_assignment from public.arc_daily_assignments
  where assignment_id = p_assignment_id and user_id = v_user_id
  for update;
  if not found then raise exception 'arc_daily_assignment_not_found'; end if;
  if v_assignment.arc_day <> v_arc_day then raise exception 'arc_daily_assignment_not_today'; end if;
  if v_assignment.completed_at is not null then raise exception 'arc_daily_assignment_already_completed'; end if;
  if v_assignment.task_source <> 'custom' or v_assignment.assignment_kind <> 'normal' then
    raise exception 'arc_daily_assignment_not_custom';
  end if;

  select * into v_stat from public.arc_user_stats
  where user_id = v_user_id and stat_id = v_assignment.stat_id
  for update;
  if not found or v_stat.stat_kind <> 'custom' or not v_stat.active then
    raise exception 'arc_daily_stat_not_active_custom';
  end if;

  select count(*) into v_count from public.arc_custom_tasks ct
  where ct.user_id = v_user_id and ct.stat_id = v_stat.stat_id and ct.active;
  if v_count = 0 then raise exception 'arc_daily_custom_task_pool_empty'; end if;

  if v_stat.task_selection_mode = 'sequential' then
    select count(*) into v_current_position
    from public.arc_custom_tasks ct
    where ct.user_id = v_user_id and ct.stat_id = v_stat.stat_id and ct.active
      and (ct.sort_order, ct.task_id) <= (v_assignment.snapshot_order, v_assignment.custom_task_id);
    v_current_position := v_current_position % v_count;
    select ct.* into v_task from public.arc_custom_tasks ct
    where ct.user_id = v_user_id and ct.stat_id = v_stat.stat_id and ct.active
    order by ct.sort_order, ct.task_id offset v_current_position limit 1;
    update public.arc_user_stats
    set current_task_index = (v_current_position + 1) % v_count,
        updated_at = pg_catalog.clock_timestamp()
    where user_id = v_user_id and stat_id = v_stat.stat_id;
  else
    select candidate.* into v_task
    from (
      select ct.*, count(hist.assignment_id) as prior_count,
        max(hist.arc_day) as last_arc_day
      from public.arc_custom_tasks ct
      left join public.arc_daily_assignments hist
        on hist.user_id = v_user_id
       and hist.stat_id = v_stat.stat_id
       and hist.task_source = 'custom'
       and hist.custom_task_id = ct.task_id
      where ct.user_id = v_user_id and ct.stat_id = v_stat.stat_id and ct.active
        and (ct.task_id <> v_assignment.custom_task_id or v_count = 1)
      group by ct.user_id, ct.task_id, ct.stat_id, ct.title, ct.description,
        ct.tier, ct.sort_order, ct.active, ct.deleted_at, ct.created_at, ct.updated_at
    ) candidate
    order by candidate.prior_count, coalesce(candidate.last_arc_day, '-infinity'::date),
      pg_catalog.hashtextextended(
        v_user_id::text || ':' || v_stat.stat_id || ':' || v_arc_day::text || ':' ||
        candidate.task_id || ':swap:' || v_assignment.custom_task_id,
        21704
      ), candidate.sort_order, candidate.task_id
    limit 1;
  end if;

  update public.arc_daily_assignments
  set custom_task_id = v_task.task_id,
      snapshot_title = v_task.title,
      snapshot_description = v_task.description,
      snapshot_tier = null,
      snapshot_order = v_task.sort_order,
      task_metadata = pg_catalog.jsonb_build_object('official', false, 'changed_today', true)
  where assignment_id = v_assignment.assignment_id;

  return pg_catalog.jsonb_build_object(
    'confirmed', true,
    'assignment_id', v_assignment.assignment_id,
    'arc_day', v_arc_day,
    'stat_id', v_stat.stat_id,
    'custom_task_id', v_task.task_id,
    'title', v_task.title,
    'description', v_task.description,
    'sort_order', v_task.sort_order,
    'completed', false
  );
end;
$function$;

alter table public.arc_stat_special_rules enable row level security;
alter table public.arc_login_days enable row level security;
create policy arc_stat_special_rules_select_authenticated
  on public.arc_stat_special_rules
  for select to authenticated
  using (true);
create policy arc_login_days_select_self
  on public.arc_login_days
  for select to authenticated
  using (user_id = auth.uid());

revoke all on table public.arc_stat_special_rules from public, anon, authenticated;
revoke all on table public.arc_login_days from public, anon, authenticated;
grant select on table public.arc_stat_special_rules to authenticated;
grant select on table public.arc_login_days to authenticated;

alter table public.arc_stat_special_rules owner to postgres;
alter table public.arc_login_days owner to postgres;

alter function public.arc_xp_balance_config() owner to postgres;
alter function public.arc_xp_threshold_for_level(integer) owner to postgres;
alter function public.arc_level_from_lifetime_xp(bigint) owner to postgres;
alter function public.arc_official_task_xp(integer, text) owner to postgres;
alter function public.arc_protect_permanent_stat_max() owner to postgres;
alter function public.arc_enforce_custom_progress_limits() owner to postgres;
alter function public.arc_process_elapsed_days(uuid, date) owner to postgres;
alter function public.arc_register_login_day(uuid, date) owner to postgres;
alter function public.arc_materialize_daily_assignments(uuid, date) owner to postgres;
alter function public.arc_get_or_initialize_today() owner to postgres;
alter function public.arc_complete_daily_assignment(uuid, text) owner to postgres;
alter function public.arc_change_custom_daily_assignment(uuid) owner to postgres;

revoke all on function public.arc_xp_balance_config() from public, anon, authenticated;
revoke all on function public.arc_xp_threshold_for_level(integer) from public, anon, authenticated;
revoke all on function public.arc_level_from_lifetime_xp(bigint) from public, anon, authenticated;
revoke all on function public.arc_official_task_xp(integer, text) from public, anon, authenticated;
revoke all on function public.arc_protect_permanent_stat_max() from public, anon, authenticated;
revoke all on function public.arc_enforce_custom_progress_limits() from public, anon, authenticated;
revoke all on function public.arc_process_elapsed_days(uuid, date) from public, anon, authenticated;
revoke all on function public.arc_register_login_day(uuid, date) from public, anon, authenticated;
revoke all on function public.arc_materialize_daily_assignments(uuid, date) from public, anon, authenticated;
revoke all on function public.arc_get_or_initialize_today() from public, anon, authenticated;
revoke all on function public.arc_complete_daily_assignment(uuid, text) from public, anon, authenticated;
revoke all on function public.arc_change_custom_daily_assignment(uuid) from public, anon, authenticated;

grant execute on function public.arc_get_or_initialize_today() to authenticated;
grant execute on function public.arc_complete_daily_assignment(uuid, text) to authenticated;
grant execute on function public.arc_change_custom_daily_assignment(uuid) to authenticated;

commit;
