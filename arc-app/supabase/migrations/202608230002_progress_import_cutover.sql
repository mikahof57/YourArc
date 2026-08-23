-- ARC one-time local progress import and server cutover foundation.
-- This migration defines the engine only; it does not invoke the import.

begin;

alter table public.arc_user_stats
  add column task_selection_mode text not null default 'random'
    check (task_selection_mode in ('random', 'sequential')),
  add column current_task_index integer
    check (current_task_index is null or current_task_index >= 0);

-- Deleted legacy custom-task evidence has no order field. Preserve that absence
-- instead of inventing an order; active tasks must still have a positive order.
alter table public.arc_custom_tasks
  alter column sort_order drop not null,
  add constraint arc_custom_tasks_active_order_required
    check (not active or sort_order is not null);

create table public.arc_preset_task_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_version text not null,
  task_key text not null,
  canonical_stat_key text not null
    check (canonical_stat_key in ('wissen', 'muskeln', 'geist', 'beweglichkeit', 'business', 'geld')),
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, catalog_version, task_key),
  unique (user_id, catalog_version, canonical_stat_key, sort_order),
  foreign key (catalog_version, task_key, canonical_stat_key)
    references public.arc_preset_tasks(catalog_version, task_key, canonical_stat_key)
    on delete restrict
);

create or replace function public.arc_jsonb_has_only_keys(
  p_value jsonb,
  p_allowed_keys text[]
)
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
  select case
    when jsonb_typeof(p_value) <> 'object' then false
    else not exists (
      select 1
      from pg_catalog.jsonb_object_keys(p_value) as key_name
      where not (key_name = any(p_allowed_keys))
    )
  end;
$function$;

create or replace function public.arc_is_iso_date(p_value text)
returns boolean
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_date date;
  v_year integer;
  v_month integer;
  v_day integer;
begin
  if p_value is null or p_value !~ '^\d{4}-\d{2}-\d{2}$' then
    return false;
  end if;

  begin
    v_year := pg_catalog.substr(p_value, 1, 4)::integer;
    v_month := pg_catalog.substr(p_value, 6, 2)::integer;
    v_day := pg_catalog.substr(p_value, 9, 2)::integer;
    v_date := pg_catalog.make_date(v_year, v_month, v_day);
  exception when others then
    return false;
  end;

  return v_date is not null;
end;
$function$;

create or replace function public.import_arc_progress_snapshot(
  p_raw_snapshot text,
  p_snapshot_hash text,
  p_snapshot_schema_version integer,
  p_timezone text
)
returns table (
  import_id uuid,
  cutover_arc_day date,
  imported_stats integer,
  imported_custom_tasks integer,
  imported_exclusions integer,
  imported_history_points integer
)
language plpgsql
security definer
set search_path = pg_catalog, extensions, public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile_character_code text;
  v_local_character_code text;
  v_computed_hash text;
  v_snapshot jsonb;
  v_stats jsonb;
  v_history jsonb;
  v_deleted_tasks jsonb;
  v_completed_today jsonb;
  v_stat jsonb;
  v_task jsonb;
  v_deleted_task jsonb;
  v_history_record jsonb;
  v_history_stat record;
  v_preset_task record;
  v_stat_id text;
  v_task_id text;
  v_task_title text;
  v_task_description text;
  v_stat_kind text;
  v_stat_value integer;
  v_start_value integer;
  v_task_order integer;
  v_task_tier integer;
  v_current_task_index integer;
  v_task_is_custom boolean;
  v_stat_is_custom boolean;
  v_seen_task_orders integer[];
  v_deleted_at timestamptz;
  v_cutover_day date;
  v_import_id uuid := gen_random_uuid();
  v_stat_count integer := 0;
  v_custom_task_count integer := 0;
  v_exclusion_count integer := 0;
  v_history_point_count integer := 0;
  v_canonical_count integer;
begin
  if v_user_id is null then
    raise exception 'arc_import_not_authenticated';
  end if;

  -- Serialize all first-import attempts for this user for the transaction lifetime.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 4182216)
  );

  if p_raw_snapshot is null or p_raw_snapshot = '' then
    raise exception 'arc_import_raw_snapshot_missing';
  end if;
  if pg_catalog.octet_length(p_raw_snapshot) > 10485760 then
    raise exception 'arc_import_raw_snapshot_too_large';
  end if;
  if p_snapshot_hash is null or p_snapshot_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'arc_import_hash_format_invalid';
  end if;
  -- Version 1 is the Phase 2.12 import-envelope/validator contract associated
  -- with this raw AppState. It is not embedded inside p_raw_snapshot itself.
  if p_snapshot_schema_version is distinct from 1 then
    raise exception 'arc_import_schema_version_unsupported';
  end if;

  v_computed_hash := pg_catalog.encode(
    digest(pg_catalog.convert_to(p_raw_snapshot, 'UTF8'), 'sha256'),
    'hex'
  );
  if v_computed_hash <> p_snapshot_hash then
    raise exception 'arc_import_hash_mismatch';
  end if;

  begin
    v_snapshot := p_raw_snapshot::jsonb;
  exception when others then
    raise exception 'arc_import_json_invalid';
  end;

  if pg_catalog.jsonb_typeof(v_snapshot) <> 'object' then
    raise exception 'arc_import_root_invalid';
  end if;
  if pg_catalog.jsonb_typeof(v_snapshot->'profile') <> 'object' then
    raise exception 'arc_import_profile_invalid';
  end if;

  if pg_catalog.jsonb_typeof(v_snapshot->'profile'->'characterCode') <> 'string' then
    raise exception 'arc_import_local_character_code_missing';
  end if;

  v_local_character_code := nullif(v_snapshot->'profile'->>'characterCode', '');
  if v_local_character_code is null then
    raise exception 'arc_import_local_character_code_missing';
  end if;

  select p.character_code
  into v_profile_character_code
  from public.profiles p
  where p.user_id = v_user_id;

  if v_profile_character_code is null then
    raise exception 'arc_import_server_character_code_missing';
  end if;
  if v_local_character_code <> v_profile_character_code then
    raise exception 'arc_import_character_code_mismatch';
  end if;

  if p_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_timezone
  ) then
    raise exception 'arc_import_timezone_invalid';
  end if;
  v_cutover_day := (pg_catalog.clock_timestamp() at time zone p_timezone)::date;

  -- Reject every partial or previous canonical state. This phase never merges.
  if exists (select 1 from public.arc_progress_state where user_id = v_user_id)
    or exists (select 1 from public.arc_user_stats where user_id = v_user_id)
    or exists (select 1 from public.arc_custom_tasks where user_id = v_user_id)
    or exists (select 1 from public.arc_preset_task_overrides where user_id = v_user_id)
    or exists (select 1 from public.arc_preset_task_exclusions where user_id = v_user_id)
    or exists (select 1 from public.arc_daily_assignments where user_id = v_user_id)
    or exists (select 1 from public.arc_progress_events where user_id = v_user_id)
    or exists (select 1 from public.arc_progress_imports where user_id = v_user_id)
    or exists (select 1 from public.arc_progress_daily_snapshots where user_id = v_user_id)
  then
    raise exception 'arc_import_server_progress_not_empty';
  end if;

  v_stats := v_snapshot->'stats';
  if pg_catalog.jsonb_typeof(v_stats) <> 'array' or pg_catalog.jsonb_array_length(v_stats) = 0 then
    raise exception 'arc_import_stats_invalid';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_stats) as s
    where pg_catalog.jsonb_typeof(s) <> 'object'
      or not public.arc_jsonb_has_only_keys(
        s,
        array['id','name','emoji','value','startValue','tasks','taskSelectionMode',
          'currentTaskIndex','completedToday','isCustom','active']
      )
  ) then
    raise exception 'arc_import_stat_shape_unsupported';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_stats) as s
    where not (s ? 'tasks') or pg_catalog.jsonb_typeof(s->'tasks') <> 'array'
  ) then
    raise exception 'arc_import_stat_tasks_invalid';
  end if;

  if exists (
    select s->>'id'
    from pg_catalog.jsonb_array_elements(v_stats) as s
    group by s->>'id'
    having s->>'id' is null or s->>'id' = '' or count(*) > 1
  ) then
    raise exception 'arc_import_stat_id_invalid_or_duplicate';
  end if;

  select count(*) into v_canonical_count
  from pg_catalog.jsonb_array_elements(v_stats) as s
  where s->>'id' in ('wissen','muskeln','geist','beweglichkeit','business','geld');
  if v_canonical_count <> 6 then
    raise exception 'arc_import_requires_six_canonical_stats';
  end if;

  -- Active task IDs must be globally unique because task_id is user-scoped.
  if exists (
    select task->>'id'
    from pg_catalog.jsonb_array_elements(v_stats) as s
    cross join lateral pg_catalog.jsonb_array_elements(s->'tasks') as task
    group by task->>'id'
    having task->>'id' is null or task->>'id' = '' or count(*) > 1
  ) then
    raise exception 'arc_import_task_id_invalid_or_duplicate';
  end if;

  v_history := coalesce(v_snapshot->'history', '[]'::jsonb);
  v_deleted_tasks := coalesce(v_snapshot->'deletedTasks', '[]'::jsonb);
  v_completed_today := coalesce(v_snapshot->'completedTasksToday', '[]'::jsonb);

  if pg_catalog.jsonb_typeof(v_history) <> 'array' then
    raise exception 'arc_import_history_invalid';
  end if;
  if pg_catalog.jsonb_typeof(v_deleted_tasks) <> 'array' then
    raise exception 'arc_import_deleted_tasks_invalid';
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_deleted_tasks) as deleted
    where pg_catalog.jsonb_typeof(deleted) <> 'object'
      or not public.arc_jsonb_has_only_keys(
        deleted,
        array['id','statId','statName','statEmoji','title','description','tier','isCustom','deletedAt']
      )
  ) then
    raise exception 'arc_import_deleted_task_shape_unsupported';
  end if;
  if exists (
    select deleted->>'id'
    from pg_catalog.jsonb_array_elements(v_deleted_tasks) as deleted
    group by deleted->>'id'
    having deleted->>'id' is null or deleted->>'id' = '' or count(*) > 1
  ) then
    raise exception 'arc_import_deleted_task_id_invalid_or_duplicate';
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_deleted_tasks) as deleted
    where exists (
      select 1
      from pg_catalog.jsonb_array_elements(v_stats) as s
      cross join lateral pg_catalog.jsonb_array_elements(s->'tasks') as task
      where task->>'id' = deleted->>'id'
    )
  ) then
    raise exception 'arc_import_deleted_task_also_active';
  end if;
  if pg_catalog.jsonb_typeof(v_completed_today) <> 'array'
    or exists (
      select 1 from pg_catalog.jsonb_array_elements(v_completed_today) as item
      where pg_catalog.jsonb_typeof(item) <> 'string'
        or not exists (
          select 1 from pg_catalog.jsonb_array_elements(v_stats) as s
          where s->>'id' = item #>> '{}'
        )
    )
  then
    raise exception 'arc_import_completed_today_invalid';
  end if;
  if v_snapshot ? 'lastActiveDate'
    and (
      pg_catalog.jsonb_typeof(v_snapshot->'lastActiveDate') <> 'string'
      or not public.arc_is_iso_date(v_snapshot->>'lastActiveDate')
    )
  then
    raise exception 'arc_import_last_active_date_invalid';
  end if;

  if v_snapshot ? 'consecutiveLoginDays'
    and (
      pg_catalog.jsonb_typeof(v_snapshot->'consecutiveLoginDays') <> 'number'
      or (v_snapshot->>'consecutiveLoginDays')::numeric
        <> pg_catalog.trunc((v_snapshot->>'consecutiveLoginDays')::numeric)
      or (v_snapshot->>'consecutiveLoginDays')::numeric not between 1 and 9007199254740991
    )
  then
    raise exception 'arc_import_consecutive_login_days_invalid';
  end if;

  if v_snapshot ? 'lastDailyBonusDate'
    and pg_catalog.jsonb_typeof(v_snapshot->'lastDailyBonusDate') <> 'null'
    and (
      pg_catalog.jsonb_typeof(v_snapshot->'lastDailyBonusDate') <> 'string'
      or not public.arc_is_iso_date(v_snapshot->>'lastDailyBonusDate')
    )
  then
    raise exception 'arc_import_last_daily_bonus_date_invalid';
  end if;

  if v_snapshot ? 'statStreaks' then
    if pg_catalog.jsonb_typeof(v_snapshot->'statStreaks') <> 'object' then
      raise exception 'arc_import_stat_streaks_invalid';
    end if;
    if exists (
      select 1
      from pg_catalog.jsonb_each(v_snapshot->'statStreaks') as streak
      where not exists (
        select 1 from pg_catalog.jsonb_array_elements(v_stats) as s
        where s->>'id' = streak.key
      )
        or pg_catalog.jsonb_typeof(streak.value) <> 'number'
        or (streak.value #>> '{}')::numeric
          <> pg_catalog.trunc((streak.value #>> '{}')::numeric)
        or (streak.value #>> '{}')::numeric not between 0 and 9007199254740991
    ) then
      raise exception 'arc_import_stat_streaks_invalid';
    end if;
  end if;

  insert into public.arc_progress_imports (
    import_id, user_id, snapshot_hash, snapshot_schema_version,
    ownership_confidence, status, cutover_arc_day, validation_summary,
    safe_progress_evidence, created_at
  ) values (
    v_import_id, v_user_id, v_computed_hash, p_snapshot_schema_version,
    'MODERATE', 'importing', v_cutover_day,
    pg_catalog.jsonb_build_object(
      'server_validation', 'passed',
      'canonical_stats', 6,
      'raw_snapshot_stored', false
    ),
    pg_catalog.jsonb_build_object(
      'local_character_code', v_local_character_code,
      'last_active_date', v_snapshot->>'lastActiveDate',
      'completed_tasks_today', v_completed_today,
      'completed_tasks_today_verification', 'legacy_unverified',
      'consecutive_login_days_present', v_snapshot ? 'consecutiveLoginDays',
      'consecutive_login_days', v_snapshot->'consecutiveLoginDays',
      'last_daily_bonus_date_present', v_snapshot ? 'lastDailyBonusDate',
      'last_daily_bonus_date', v_snapshot->'lastDailyBonusDate',
      'stat_streaks_present', v_snapshot ? 'statStreaks',
      'stat_streaks', v_snapshot->'statStreaks',
      'progress_metadata_verification', 'legacy_unverified'
    ),
    pg_catalog.clock_timestamp()
  );

  insert into public.arc_progress_state (
    user_id, timezone, cutover_arc_day, last_processed_arc_day,
    active_catalog_version, created_at, updated_at
  ) values (
    v_user_id, p_timezone, v_cutover_day, v_cutover_day,
    'arc_tasks_v1', pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  );

  for v_stat in select value from pg_catalog.jsonb_array_elements(v_stats)
  loop
    v_stat_id := v_stat->>'id';
    if pg_catalog.char_length(v_stat_id) not between 1 and 128 then
      raise exception 'arc_import_stat_id_length_invalid';
    end if;

    if v_stat ? 'isCustom' and pg_catalog.jsonb_typeof(v_stat->'isCustom') <> 'boolean' then
      raise exception 'arc_import_stat_custom_flag_invalid';
    end if;

    v_stat_is_custom := coalesce((v_stat->>'isCustom')::boolean, false)
      or v_stat_id like 'custom-%';
    if v_stat_id in ('wissen','muskeln','geist','beweglichkeit','business','geld') then
      if v_stat_is_custom then
        raise exception 'arc_import_canonical_stat_marked_custom';
      end if;
      v_stat_kind := 'canonical';
    else
      if not v_stat_is_custom then
        raise exception 'arc_import_unknown_stat_not_explicitly_custom';
      end if;
      if v_stat_id in ('wissen','muskeln','geist','beweglichkeit','business','geld') then
        raise exception 'arc_import_custom_stat_uses_canonical_id';
      end if;
      v_stat_kind := 'custom';
    end if;

    if pg_catalog.jsonb_typeof(v_stat->'name') is distinct from 'string'
      or pg_catalog.char_length(v_stat->>'name') not between 1 and 60
      or pg_catalog.jsonb_typeof(v_stat->'emoji') is distinct from 'string'
      or pg_catalog.char_length(v_stat->>'emoji') not between 1 and 32
    then
      raise exception 'arc_import_stat_presentation_invalid';
    end if;

    if pg_catalog.jsonb_typeof(v_stat->'value') is distinct from 'number'
      or (v_stat->>'value')::numeric <> pg_catalog.trunc((v_stat->>'value')::numeric)
      or (v_stat->>'value')::numeric not between 0 and 100
    then
      raise exception 'arc_import_stat_value_invalid';
    end if;
    v_stat_value := (v_stat->>'value')::integer;

    v_start_value := null;
    if v_stat ? 'startValue' and pg_catalog.jsonb_typeof(v_stat->'startValue') <> 'null' then
      if pg_catalog.jsonb_typeof(v_stat->'startValue') <> 'number'
        or (v_stat->>'startValue')::numeric <> pg_catalog.trunc((v_stat->>'startValue')::numeric)
        or (v_stat->>'startValue')::numeric not between 0 and 99
      then
        raise exception 'arc_import_stat_start_value_invalid';
      end if;
      v_start_value := (v_stat->>'startValue')::integer;
    end if;

    if coalesce(v_stat->>'taskSelectionMode', 'random') not in ('random', 'sequential') then
      raise exception 'arc_import_task_selection_mode_invalid';
    end if;

    v_current_task_index := null;
    if v_stat ? 'currentTaskIndex' and pg_catalog.jsonb_typeof(v_stat->'currentTaskIndex') <> 'null' then
      if pg_catalog.jsonb_typeof(v_stat->'currentTaskIndex') <> 'number'
        or (v_stat->>'currentTaskIndex')::numeric <> pg_catalog.trunc((v_stat->>'currentTaskIndex')::numeric)
        or (v_stat->>'currentTaskIndex')::numeric < 0
      then
        raise exception 'arc_import_current_task_index_invalid';
      end if;
      v_current_task_index := (v_stat->>'currentTaskIndex')::integer;
    end if;

    if v_stat ? 'active' and pg_catalog.jsonb_typeof(v_stat->'active') <> 'boolean' then
      raise exception 'arc_import_stat_active_invalid';
    end if;
    if v_stat ? 'completedToday' and pg_catalog.jsonb_typeof(v_stat->'completedToday') <> 'boolean' then
      raise exception 'arc_import_stat_completed_flag_invalid';
    end if;
    if not (v_stat ? 'tasks') or pg_catalog.jsonb_typeof(v_stat->'tasks') <> 'array' then
      raise exception 'arc_import_stat_tasks_invalid';
    end if;

    insert into public.arc_user_stats (
      user_id, stat_id, stat_kind, canonical_stat_key, display_name, emoji,
      current_value, start_value, sort_order, active,
      task_selection_mode, current_task_index, created_at, updated_at
    ) values (
      v_user_id, v_stat_id, v_stat_kind,
      case when v_stat_kind = 'canonical' then v_stat_id else null end,
      v_stat->>'name', v_stat->>'emoji', v_stat_value, v_start_value,
      v_stat_count, coalesce((v_stat->>'active')::boolean, true),
      coalesce(v_stat->>'taskSelectionMode', 'random'), v_current_task_index,
      pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
    );
    v_stat_count := v_stat_count + 1;
    v_seen_task_orders := array[]::integer[];

    for v_task in select value from pg_catalog.jsonb_array_elements(v_stat->'tasks')
    loop
      if pg_catalog.jsonb_typeof(v_task) <> 'object'
        or not public.arc_jsonb_has_only_keys(
          v_task, array['id','title','description','order','tier','isCustom']
        )
      then
        raise exception 'arc_import_task_shape_unsupported';
      end if;

      v_task_id := nullif(v_task->>'id', '');
      v_task_title := v_task->>'title';
      v_task_description := v_task->>'description';
      if v_task_id is null or pg_catalog.char_length(v_task_id) > 128
        or pg_catalog.jsonb_typeof(v_task->'title') is distinct from 'string'
        or pg_catalog.char_length(v_task_title) not between 1 and 160
        or pg_catalog.jsonb_typeof(v_task->'description') is distinct from 'string'
        or pg_catalog.char_length(v_task_description) > 2000
      then
        raise exception 'arc_import_task_content_invalid';
      end if;

      if pg_catalog.jsonb_typeof(v_task->'order') is distinct from 'number'
        or (v_task->>'order')::numeric <> pg_catalog.trunc((v_task->>'order')::numeric)
        or (v_task->>'order')::numeric < 1
      then
        raise exception 'arc_import_task_order_invalid';
      end if;
      v_task_order := (v_task->>'order')::integer;
      if v_task_order = any(v_seen_task_orders) then
        raise exception 'arc_import_task_order_duplicate_within_stat';
      end if;
      v_seen_task_orders := pg_catalog.array_append(v_seen_task_orders, v_task_order);

      v_task_tier := null;
      if v_task ? 'tier' and pg_catalog.jsonb_typeof(v_task->'tier') <> 'null' then
        if pg_catalog.jsonb_typeof(v_task->'tier') <> 'number'
          or (v_task->>'tier')::numeric <> pg_catalog.trunc((v_task->>'tier')::numeric)
          or (v_task->>'tier')::numeric not between 0 and 12
        then
          raise exception 'arc_import_task_tier_invalid';
        end if;
        v_task_tier := (v_task->>'tier')::integer;
      end if;

      if v_task ? 'isCustom' and pg_catalog.jsonb_typeof(v_task->'isCustom') <> 'boolean' then
        raise exception 'arc_import_task_custom_flag_invalid';
      end if;
      v_task_is_custom := coalesce((v_task->>'isCustom')::boolean, false);

      select
        pt.tier, pt.sort_order, pt.title, pt.description
      into v_preset_task
      from public.arc_preset_tasks pt
        where pt.catalog_version = 'arc_tasks_v1'
          and pt.task_key = v_task_id
          and pt.canonical_stat_key = v_stat_id;

      if found then
        if v_task_is_custom then
          raise exception 'arc_import_preset_task_marked_custom';
        end if;
        if v_task_tier is distinct from v_preset_task.tier then
          raise exception 'arc_import_preset_task_tier_mismatch';
        end if;
        if v_task_order <> v_preset_task.sort_order then
          insert into public.arc_preset_task_overrides (
            user_id, catalog_version, task_key, canonical_stat_key,
            sort_order, created_at, updated_at
          ) values (
            v_user_id, 'arc_tasks_v1', v_task_id, v_stat_id,
            v_task_order, pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
          );
        end if;
        -- Preset identity is version/key/stat. Imported display text is ignored:
        -- the canonical server catalog owns task content, while any user order
        -- difference is preserved separately above.
      elsif v_stat_kind = 'custom' or v_task_is_custom then
        insert into public.arc_custom_tasks (
          user_id, task_id, stat_id, title, description, tier, sort_order,
          active, deleted_at, created_at, updated_at
        ) values (
          v_user_id, v_task_id, v_stat_id, v_task_title, v_task_description,
          v_task_tier, v_task_order, true, null,
          pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
        );
        v_custom_task_count := v_custom_task_count + 1;
      else
        raise exception 'arc_import_unknown_noncustom_task';
      end if;
    end loop;
  end loop;

  -- Deleted tasks either become inactive custom tasks or exact preset exclusions.
  for v_deleted_task in select value from pg_catalog.jsonb_array_elements(v_deleted_tasks)
  loop
    if pg_catalog.jsonb_typeof(v_deleted_task) <> 'object'
      or not public.arc_jsonb_has_only_keys(
        v_deleted_task,
        array['id','statId','statName','statEmoji','title','description','tier','isCustom','deletedAt']
      )
    then
      raise exception 'arc_import_deleted_task_shape_unsupported';
    end if;

    v_task_id := nullif(v_deleted_task->>'id', '');
    v_stat_id := nullif(v_deleted_task->>'statId', '');
    if v_task_id is null or pg_catalog.char_length(v_task_id) > 128
      or v_stat_id is null
      or not exists (
        select 1 from public.arc_user_stats us
        where us.user_id = v_user_id and us.stat_id = v_stat_id
      )
    then
      raise exception 'arc_import_deleted_task_identity_invalid';
    end if;

    if pg_catalog.jsonb_typeof(v_deleted_task->'title') is distinct from 'string'
      or pg_catalog.char_length(v_deleted_task->>'title') not between 1 and 160
      or pg_catalog.jsonb_typeof(v_deleted_task->'description') is distinct from 'string'
      or pg_catalog.char_length(v_deleted_task->>'description') > 2000
    then
      raise exception 'arc_import_deleted_task_content_invalid';
    end if;

    v_task_tier := null;
    if v_deleted_task ? 'tier' and pg_catalog.jsonb_typeof(v_deleted_task->'tier') <> 'null' then
      if pg_catalog.jsonb_typeof(v_deleted_task->'tier') <> 'number'
        or (v_deleted_task->>'tier')::numeric <> pg_catalog.trunc((v_deleted_task->>'tier')::numeric)
        or (v_deleted_task->>'tier')::numeric not between 0 and 12
      then
        raise exception 'arc_import_deleted_task_tier_invalid';
      end if;
      v_task_tier := (v_deleted_task->>'tier')::integer;
    end if;

    begin
      v_deleted_at := (v_deleted_task->>'deletedAt')::timestamptz;
    exception when others then
      raise exception 'arc_import_deleted_task_date_invalid';
    end;
    if v_deleted_at is null then
      raise exception 'arc_import_deleted_task_date_invalid';
    end if;

    if v_deleted_task ? 'isCustom'
      and pg_catalog.jsonb_typeof(v_deleted_task->'isCustom') <> 'boolean'
    then
      raise exception 'arc_import_deleted_task_custom_flag_invalid';
    end if;
    v_task_is_custom := coalesce((v_deleted_task->>'isCustom')::boolean, false);

    if exists (
      select 1 from public.arc_preset_tasks pt
      where pt.catalog_version = 'arc_tasks_v1'
        and pt.task_key = v_task_id
        and pt.canonical_stat_key = v_stat_id
    ) then
      if v_task_is_custom then
        raise exception 'arc_import_deleted_preset_marked_custom';
      end if;
      insert into public.arc_preset_task_exclusions (
        user_id, catalog_version, task_key, excluded_at
      ) values (v_user_id, 'arc_tasks_v1', v_task_id, v_deleted_at);
      v_exclusion_count := v_exclusion_count + 1;
    elsif exists (
      select 1 from public.arc_custom_tasks ct
      where ct.user_id = v_user_id and ct.task_id = v_task_id
    ) then
      raise exception 'arc_import_deleted_task_also_active';
    elsif v_task_is_custom or v_stat_id like 'custom-%' then
      insert into public.arc_custom_tasks (
        user_id, task_id, stat_id, title, description, tier, sort_order,
        active, deleted_at, created_at, updated_at
      ) values (
        v_user_id, v_task_id, v_stat_id,
        v_deleted_task->>'title', v_deleted_task->>'description', v_task_tier,
        null, false, v_deleted_at, v_deleted_at, v_deleted_at
      );
      v_custom_task_count := v_custom_task_count + 1;
    else
      raise exception 'arc_import_deleted_task_unmappable';
    end if;
  end loop;

  -- Validate duplicate history dates before inserting the flattened points.
  if exists (
    select h->>'date'
    from pg_catalog.jsonb_array_elements(v_history) as h
    group by h->>'date'
    having h->>'date' is null or count(*) > 1
  ) then
    raise exception 'arc_import_history_date_missing_or_duplicate';
  end if;

  for v_history_record in select value from pg_catalog.jsonb_array_elements(v_history)
  loop
    if pg_catalog.jsonb_typeof(v_history_record) <> 'object'
      or not public.arc_jsonb_has_only_keys(v_history_record, array['date','stats'])
      or not public.arc_is_iso_date(v_history_record->>'date')
      or pg_catalog.jsonb_typeof(v_history_record->'stats') <> 'object'
    then
      raise exception 'arc_import_history_record_invalid';
    end if;

    for v_history_stat in
      select key, value from pg_catalog.jsonb_each(v_history_record->'stats')
    loop
      if not exists (
        select 1 from public.arc_user_stats us
        where us.user_id = v_user_id and us.stat_id = v_history_stat.key
      ) then
        raise exception 'arc_import_history_unknown_stat';
      end if;
      if pg_catalog.jsonb_typeof(v_history_stat.value) <> 'number'
        or (v_history_stat.value #>> '{}')::numeric
          <> pg_catalog.trunc((v_history_stat.value #>> '{}')::numeric)
        or (v_history_stat.value #>> '{}')::numeric not between 0 and 100
      then
        raise exception 'arc_import_history_value_invalid';
      end if;

      insert into public.arc_progress_daily_snapshots (
        user_id, stat_id, arc_day, value, source, import_id, metadata, created_at
      ) values (
        v_user_id, v_history_stat.key, (v_history_record->>'date')::date,
        (v_history_stat.value #>> '{}')::integer, 'legacy_unverified',
        v_import_id, pg_catalog.jsonb_build_object('verification', 'legacy_unverified'),
        pg_catalog.clock_timestamp()
      );
      v_history_point_count := v_history_point_count + 1;
    end loop;
  end loop;

  -- A baseline records the imported value without claiming a prior value or reward.
  insert into public.arc_progress_events (
    user_id, stat_id, arc_day, event_type, assignment_id, import_id,
    delta, value_before, value_after, metadata, created_at
  )
  select
    us.user_id, us.stat_id, v_cutover_day, 'IMPORT_BASELINE', null, v_import_id,
    0, us.current_value, us.current_value,
    pg_catalog.jsonb_build_object(
      'semantic', 'imported_current_value_baseline',
      'prior_value_claimed', false
    ),
    pg_catalog.clock_timestamp()
  from public.arc_user_stats us
  where us.user_id = v_user_id;

  update public.arc_progress_imports
  set
    status = 'completed',
    completed_at = pg_catalog.clock_timestamp(),
    validation_summary = validation_summary || pg_catalog.jsonb_build_object(
      'imported_stats', v_stat_count,
      'imported_custom_tasks', v_custom_task_count,
      'imported_exclusions', v_exclusion_count,
      'imported_history_points', v_history_point_count
    )
  where arc_progress_imports.import_id = v_import_id
    and user_id = v_user_id;

  return query
  select
    v_import_id,
    v_cutover_day,
    v_stat_count,
    v_custom_task_count,
    v_exclusion_count,
    v_history_point_count;
end;
$function$;

alter table public.arc_preset_task_overrides enable row level security;

create policy arc_preset_task_overrides_select_self
  on public.arc_preset_task_overrides
  for select to authenticated
  using (user_id = auth.uid());

revoke all on table public.arc_preset_task_overrides
  from public, anon, authenticated;
grant select on table public.arc_preset_task_overrides
  to authenticated;

alter table public.arc_preset_task_overrides owner to postgres;

alter function public.arc_jsonb_has_only_keys(jsonb, text[]) owner to postgres;
alter function public.arc_is_iso_date(text) owner to postgres;
alter function public.import_arc_progress_snapshot(text, text, integer, text) owner to postgres;

revoke all on function public.arc_jsonb_has_only_keys(jsonb, text[]) from public, anon, authenticated;
revoke all on function public.arc_is_iso_date(text) from public, anon, authenticated;
revoke all on function public.import_arc_progress_snapshot(text, text, integer, text) from public, anon, authenticated;

grant execute on function public.import_arc_progress_snapshot(text, text, integer, text)
  to authenticated;

commit;
