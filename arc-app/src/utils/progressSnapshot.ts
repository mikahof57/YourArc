import { supabase } from '../lib/supabaseClient';

export const ARC_PROGRESS_STORAGE_KEY = 'arc_app_system_state_v1' as const;
export const ARC_PROGRESS_SNAPSHOT_SCHEMA_VERSION = 1 as const;

const CANONICAL_STAT_IDS = new Set([
  'wissen',
  'muskeln',
  'geist',
  'beweglichkeit',
  'business',
  'geld',
]);

export type SnapshotSource = 'arc_app_system_state_v1';
export type OwnershipConfidence = 'MODERATE' | 'WEAK' | 'NONE';
export type SnapshotIssueSeverity = 'warning' | 'error';

export interface SnapshotIssue {
  code: string;
  severity: SnapshotIssueSeverity;
  path: string;
  message: string;
  originalValue?: unknown;
}

export interface ArcSnapshotTask {
  id: string | null;
  title: string | null;
  description: string | null;
  order: number | null;
  tier: number | null;
  isCustom: boolean | null;
  arrayIndex: number;
  unknownFields: Record<string, unknown>;
  raw: unknown;
}

export interface ArcSnapshotStat {
  id: string | null;
  kind: 'canonical' | 'custom' | 'unknown';
  name: string | null;
  emoji: string | null;
  value: number | null;
  startValue: number | null;
  taskSelectionMode: 'random' | 'sequential' | 'unknown';
  currentTaskIndex: number | null;
  completedTodayLegacyFlag: boolean | null;
  isCustom: boolean;
  arrayIndex: number;
  tasks: ArcSnapshotTask[];
  unknownFields: Record<string, unknown>;
  raw: unknown;
}

export interface ArcSnapshotDeletedTask {
  id: string | null;
  statId: string | null;
  statName: string | null;
  statEmoji: string | null;
  title: string | null;
  description: string | null;
  tier: number | null;
  isCustom: boolean | null;
  deletedAt: string | null;
  arrayIndex: number;
  unknownFields: Record<string, unknown>;
  raw: unknown;
}

export interface ArcSnapshotHistoryRecord {
  date: string | null;
  stats: Record<string, number | null>;
  arrayIndex: number;
  raw: unknown;
}

export interface ArcProgressSnapshot {
  schemaVersion: typeof ARC_PROGRESS_SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  capturedAt: string;
  source: {
    type: SnapshotSource;
    storageKey: typeof ARC_PROGRESS_STORAGE_KEY;
    appStateFormat: 'v1';
    rawPayloadPresent: boolean;
    rawPayloadHash: string;
  };
  ownership: {
    authenticatedUserId: string | null;
    authenticatedEmail: string | null;
    localAuthEmail: string | null;
    localCharacterCode: string | null;
    serverCharacterCodeAtCapture: string | null;
    confidence: OwnershipConfidence;
    evidence: string[];
  };
  progress: {
    stats: ArcSnapshotStat[];
    completedTasksToday: {
      localDate: string | null;
      statIds: string[];
      rawEntries: unknown[];
      verification: 'legacy_unverified';
    };
    history: ArcSnapshotHistoryRecord[];
    deletedTasks: ArcSnapshotDeletedTask[];
  };
  activityMetadata: {
    lastActiveDate: string | null;
    consecutiveLoginDays: number | null;
    lastDailyBonusDate: string | null;
    moduleReloadsCountToday: number | null;
  };
  relatedUserContent: {
    weeklyRoutine: unknown | null;
    calendarState: unknown | null;
  };
  migration: {
    status: 'validated' | 'quarantined';
    validationWarnings: SnapshotIssue[];
    validationErrors: SnapshotIssue[];
    claimedByUserId: null;
    userConfirmedOwnershipAt: null;
    importedAt: null;
    importVersion: null;
    serverImportId: null;
  };
  raw: {
    originalJson: string | null;
  };
}

export interface ArcProgressReadinessReport {
  canConsiderAutomaticImport: boolean;
  ownershipConfidence: OwnershipConfidence;
  blockingErrors: SnapshotIssue[];
  warnings: SnapshotIssue[];
  counts: {
    stats: number;
    customStats: number;
    tasks: number;
    customTasks: number;
    deletedTasks: number;
    historyRecords: number;
  };
}

export interface SnapshotOwnershipInput {
  authenticatedUserId: string | null;
  authenticatedEmail: string | null;
  serverCharacterCode: string | null;
  evidence?: string[];
}

const EMPTY_OWNERSHIP: SnapshotOwnershipInput = {
  authenticatedUserId: null,
  authenticatedEmail: null,
  serverCharacterCode: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function finiteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function unknownFields(record: Record<string, unknown>, known: string[]): Record<string, unknown> {
  const knownKeys = new Set(known);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !knownKeys.has(key)));
}

function isRealDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function addIssue(
  issues: SnapshotIssue[],
  code: string,
  severity: SnapshotIssueSeverity,
  path: string,
  message: string,
  originalValue?: unknown,
): void {
  issues.push({ code, severity, path, message, ...(originalValue !== undefined ? { originalValue } : {}) });
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeTask(value: unknown, arrayIndex: number, path: string, issues: SnapshotIssue[]): ArcSnapshotTask {
  if (!isRecord(value)) {
    addIssue(issues, 'task_not_object', 'error', path, 'Task must be an object.', value);
    return {
      id: null, title: null, description: null, order: null, tier: null,
      isCustom: null, arrayIndex, unknownFields: {}, raw: value,
    };
  }

  const id = stringOrNull(value.id);
  const title = stringOrNull(value.title);
  const description = stringOrNull(value.description);
  const order = finiteNumberOrNull(value.order);
  const tier = value.tier === undefined || value.tier === null ? null : finiteNumberOrNull(value.tier);
  const isCustom = value.isCustom === undefined ? null : booleanOrNull(value.isCustom);

  if (!id) addIssue(issues, 'task_id_missing', 'error', `${path}.id`, 'Task ID must be a non-empty string.', value.id);
  if (title === null) addIssue(issues, 'task_title_invalid', 'error', `${path}.title`, 'Task title must be a string.', value.title);
  if (description === null) addIssue(issues, 'task_description_invalid', 'error', `${path}.description`, 'Task description must be a string.', value.description);
  if (order === null) addIssue(issues, 'task_order_invalid', 'error', `${path}.order`, 'Task order must be finite.', value.order);
  if (value.tier !== undefined && value.tier !== null && tier === null) {
    addIssue(issues, 'task_tier_invalid', 'error', `${path}.tier`, 'Task tier must be finite when present.', value.tier);
  }
  if (value.isCustom !== undefined && isCustom === null) {
    addIssue(issues, 'task_custom_flag_invalid', 'warning', `${path}.isCustom`, 'Task custom flag must be boolean when present.', value.isCustom);
  }

  return {
    id,
    title,
    description,
    order,
    tier,
    isCustom,
    arrayIndex,
    unknownFields: unknownFields(value, ['id', 'title', 'description', 'order', 'tier', 'isCustom']),
    raw: value,
  };
}

function normalizeStat(value: unknown, arrayIndex: number, issues: SnapshotIssue[]): ArcSnapshotStat {
  const path = `$.stats[${arrayIndex}]`;
  if (!isRecord(value)) {
    addIssue(issues, 'stat_not_object', 'error', path, 'Stat must be an object.', value);
    return {
      id: null, kind: 'unknown', name: null, emoji: null, value: null, startValue: null,
      taskSelectionMode: 'unknown', currentTaskIndex: null, completedTodayLegacyFlag: null,
      isCustom: false, arrayIndex, tasks: [], unknownFields: {}, raw: value,
    };
  }

  const id = stringOrNull(value.id);
  const statValue = finiteNumberOrNull(value.value);
  const startValue = value.startValue === undefined || value.startValue === null
    ? null
    : finiteNumberOrNull(value.startValue);
  const explicitlyCustom = value.isCustom === true || Boolean(id?.startsWith('custom-'));
  const kind = id && CANONICAL_STAT_IDS.has(id) ? 'canonical' : explicitlyCustom ? 'custom' : 'unknown';
  const tasksRaw = value.tasks;
  const tasks = Array.isArray(tasksRaw)
    ? tasksRaw.map((task, taskIndex) => normalizeTask(task, taskIndex, `${path}.tasks[${taskIndex}]`, issues))
    : [];

  if (!id) addIssue(issues, 'stat_id_missing', 'error', `${path}.id`, 'Stat ID must be a non-empty string.', value.id);
  if (kind === 'unknown' && id) addIssue(issues, 'stat_id_unknown', 'warning', `${path}.id`, 'Unknown stat ID was preserved.', id);
  if (typeof value.name !== 'string') addIssue(issues, 'stat_name_invalid', 'error', `${path}.name`, 'Stat name must be a string.', value.name);
  if (typeof value.emoji !== 'string') addIssue(issues, 'stat_emoji_invalid', 'error', `${path}.emoji`, 'Stat emoji must be a string.', value.emoji);
  if (statValue === null || statValue < 0 || statValue > 100) {
    addIssue(issues, 'stat_value_invalid', 'error', `${path}.value`, 'Stat value must be finite and between 0 and 100.', value.value);
  }
  if (value.startValue !== undefined && value.startValue !== null
      && (startValue === null || startValue < 0 || startValue > 99)) {
    addIssue(issues, 'stat_start_value_invalid', 'error', `${path}.startValue`, 'Start value must be between 0 and 99 when present.', value.startValue);
  }
  if (!Array.isArray(tasksRaw)) addIssue(issues, 'stat_tasks_invalid', 'error', `${path}.tasks`, 'Stat tasks must be an array.', tasksRaw);

  const taskIds = new Set<string>();
  tasks.forEach((task) => {
    if (!task.id) return;
    if (taskIds.has(task.id)) {
      addIssue(issues, 'duplicate_task_id', 'error', `${path}.tasks`, `Duplicate task ID "${task.id}".`, task.id);
    }
    taskIds.add(task.id);
  });

  const mode = value.taskSelectionMode === 'random' || value.taskSelectionMode === 'sequential'
    ? value.taskSelectionMode
    : 'unknown';
  if (mode === 'unknown') {
    addIssue(issues, 'task_selection_mode_unknown', 'warning', `${path}.taskSelectionMode`, 'Unknown task selection mode was preserved.', value.taskSelectionMode);
  }

  return {
    id,
    kind,
    name: stringOrNull(value.name),
    emoji: stringOrNull(value.emoji),
    value: statValue,
    startValue,
    taskSelectionMode: mode,
    currentTaskIndex: value.currentTaskIndex === undefined ? null : finiteNumberOrNull(value.currentTaskIndex),
    completedTodayLegacyFlag: value.completedToday === undefined ? null : booleanOrNull(value.completedToday),
    isCustom: explicitlyCustom,
    arrayIndex,
    tasks,
    unknownFields: unknownFields(value, [
      'id', 'name', 'emoji', 'value', 'startValue', 'tasks', 'taskSelectionMode',
      'currentTaskIndex', 'completedToday', 'isCustom',
    ]),
    raw: value,
  };
}

function normalizeDeletedTask(value: unknown, arrayIndex: number, issues: SnapshotIssue[]): ArcSnapshotDeletedTask {
  const path = `$.deletedTasks[${arrayIndex}]`;
  if (!isRecord(value)) {
    addIssue(issues, 'deleted_task_not_object', 'error', path, 'Deleted task must be an object.', value);
    return {
      id: null, statId: null, statName: null, statEmoji: null, title: null,
      description: null, tier: null, isCustom: null, deletedAt: null,
      arrayIndex, unknownFields: {}, raw: value,
    };
  }

  const deletedAt = stringOrNull(value.deletedAt);
  if (!stringOrNull(value.id)) addIssue(issues, 'deleted_task_id_missing', 'error', `${path}.id`, 'Deleted task ID is required.', value.id);
  if (!stringOrNull(value.statId)) addIssue(issues, 'deleted_task_stat_id_missing', 'error', `${path}.statId`, 'Deleted task stat ID is required.', value.statId);
  if (!deletedAt || Number.isNaN(Date.parse(deletedAt))) {
    addIssue(issues, 'deleted_task_date_invalid', 'error', `${path}.deletedAt`, 'Deleted-at timestamp is invalid.', value.deletedAt);
  }

  return {
    id: stringOrNull(value.id),
    statId: stringOrNull(value.statId),
    statName: stringOrNull(value.statName),
    statEmoji: stringOrNull(value.statEmoji),
    title: stringOrNull(value.title),
    description: stringOrNull(value.description),
    tier: value.tier === undefined || value.tier === null ? null : finiteNumberOrNull(value.tier),
    isCustom: value.isCustom === undefined ? null : booleanOrNull(value.isCustom),
    deletedAt,
    arrayIndex,
    unknownFields: unknownFields(value, [
      'id', 'statId', 'statName', 'statEmoji', 'title', 'description', 'tier', 'isCustom', 'deletedAt',
    ]),
    raw: value,
  };
}

function normalizeHistory(value: unknown, arrayIndex: number, issues: SnapshotIssue[]): ArcSnapshotHistoryRecord {
  const path = `$.history[${arrayIndex}]`;
  if (!isRecord(value)) {
    addIssue(issues, 'history_record_not_object', 'error', path, 'History record must be an object.', value);
    return { date: null, stats: {}, arrayIndex, raw: value };
  }

  const date = stringOrNull(value.date);
  if (!isRealDate(date)) addIssue(issues, 'history_date_invalid', 'error', `${path}.date`, 'History date must be a real YYYY-MM-DD date.', value.date);

  const stats: Record<string, number | null> = {};
  if (!isRecord(value.stats)) {
    addIssue(issues, 'history_stats_invalid', 'error', `${path}.stats`, 'History stats must be an object.', value.stats);
  } else {
    Object.entries(value.stats).forEach(([statId, statValue]) => {
      const normalized = finiteNumberOrNull(statValue);
      stats[statId] = normalized;
      if (normalized === null) {
        addIssue(issues, 'history_value_invalid', 'error', `${path}.stats.${statId}`, 'History value must be finite.', statValue);
      }
    });
  }

  return { date, stats, arrayIndex, raw: value };
}

function classifyOwnership(
  input: SnapshotOwnershipInput,
  localCharacterCode: string | null,
): ArcProgressSnapshot['ownership'] {
  const evidence = [...(input.evidence || [])];
  let confidence: OwnershipConfidence = 'NONE';

  if (input.authenticatedUserId) {
    confidence = 'WEAK';
    evidence.push('authenticated_user_present_at_capture');
    if (localCharacterCode && input.serverCharacterCode && localCharacterCode === input.serverCharacterCode) {
      confidence = 'MODERATE';
      evidence.push('local_character_code_matches_protected_owner_profile');
    } else {
      evidence.push('no_reliable_character_code_match');
    }
  } else {
    evidence.push('no_authenticated_user_at_capture');
  }

  return {
    authenticatedUserId: input.authenticatedUserId,
    authenticatedEmail: input.authenticatedEmail,
    localAuthEmail: null,
    localCharacterCode,
    serverCharacterCodeAtCapture: input.serverCharacterCode,
    confidence,
    evidence,
  };
}

export function buildArcProgressSnapshot(
  rawJson: string | null,
  rawPayloadHash: string,
  ownershipInput: SnapshotOwnershipInput = EMPTY_OWNERSHIP,
  capturedAt = new Date().toISOString(),
  snapshotId = globalThis.crypto.randomUUID(),
): ArcProgressSnapshot {
  const issues: SnapshotIssue[] = [];
  let root: Record<string, unknown> | null = null;

  if (rawJson === null) {
    addIssue(issues, 'raw_payload_missing', 'error', '$', `No value exists at ${ARC_PROGRESS_STORAGE_KEY}.`);
  } else {
    try {
      const parsed: unknown = JSON.parse(rawJson);
      if (isRecord(parsed)) root = parsed;
      else addIssue(issues, 'root_not_object', 'error', '$', 'Snapshot root must be an object.', parsed);
    } catch (error) {
      addIssue(
        issues,
        'malformed_json',
        'error',
        '$',
        error instanceof Error ? error.message : 'Local progress JSON is malformed.',
      );
    }
  }

  const stats = root && Array.isArray(root.stats)
    ? root.stats.map((stat, index) => normalizeStat(stat, index, issues))
    : [];
  if (root && !Array.isArray(root.stats)) {
    addIssue(issues, 'stats_not_array', 'error', '$.stats', 'Stats must be an array.', root.stats);
  }

  const statIds = new Set<string>();
  stats.forEach((stat) => {
    if (!stat.id) return;
    if (statIds.has(stat.id)) addIssue(issues, 'duplicate_stat_id', 'error', '$.stats', `Duplicate stat ID "${stat.id}".`, stat.id);
    statIds.add(stat.id);
  });

  const taskIdOwners = new Map<string, string | null>();
  stats.forEach((stat) => {
    stat.tasks.forEach((task) => {
      if (!task.id) return;
      if (taskIdOwners.has(task.id) && taskIdOwners.get(task.id) !== stat.id) {
        addIssue(issues, 'duplicate_task_id_across_stats', 'error', '$.stats', `Task ID "${task.id}" occurs in multiple stats.`, task.id);
      } else {
        taskIdOwners.set(task.id, stat.id);
      }
    });
  });

  const deletedTasks = root && Array.isArray(root.deletedTasks)
    ? root.deletedTasks.map((task, index) => normalizeDeletedTask(task, index, issues))
    : [];
  if (root?.deletedTasks !== undefined && !Array.isArray(root.deletedTasks)) {
    addIssue(issues, 'deleted_tasks_not_array', 'error', '$.deletedTasks', 'Deleted tasks must be an array.', root.deletedTasks);
  }

  const activeTaskIds = new Set(stats.flatMap((stat) => stat.tasks.map((task) => task.id).filter((id): id is string => Boolean(id))));
  deletedTasks.forEach((task, index) => {
    if (task.statId && !statIds.has(task.statId)) {
      addIssue(issues, 'orphan_deleted_task', 'warning', `$.deletedTasks[${index}].statId`, 'Deleted task references an unknown stat and was preserved.', task.statId);
    }
    if (task.id && activeTaskIds.has(task.id)) {
      addIssue(issues, 'active_deleted_task_conflict', 'warning', `$.deletedTasks[${index}].id`, 'Task appears in both active and deleted collections.', task.id);
    }
  });

  const rawCompletions = root && Array.isArray(root.completedTasksToday) ? root.completedTasksToday : [];
  if (root && !Array.isArray(root.completedTasksToday)) {
    addIssue(issues, 'daily_completion_not_array', 'error', '$.completedTasksToday', 'Daily completion must be an array of stat IDs.', root.completedTasksToday);
  }
  const completedStatIds = rawCompletions.filter((value): value is string => typeof value === 'string');
  rawCompletions.forEach((value, index) => {
    if (typeof value !== 'string') addIssue(issues, 'daily_completion_id_invalid', 'error', `$.completedTasksToday[${index}]`, 'Completion entry must be a stat ID string.', value);
    else if (!statIds.has(value)) addIssue(issues, 'daily_completion_stat_unknown', 'warning', `$.completedTasksToday[${index}]`, 'Completion references an unknown stat.', value);
  });

  const history = root && Array.isArray(root.history)
    ? root.history.map((record, index) => normalizeHistory(record, index, issues))
    : [];
  if (root && !Array.isArray(root.history)) {
    addIssue(issues, 'history_not_array', 'error', '$.history', 'History must be an array.', root.history);
  }
  const historyDates = new Set<string>();
  let previousDate: string | null = null;
  history.forEach((record, index) => {
    if (!record.date || !isRealDate(record.date)) return;
    if (historyDates.has(record.date)) addIssue(issues, 'history_date_duplicate', 'warning', `$.history[${index}].date`, 'Duplicate history date was preserved.', record.date);
    if (previousDate && record.date < previousDate) addIssue(issues, 'history_out_of_order', 'warning', `$.history[${index}].date`, 'History dates are out of order.', record.date);
    historyDates.add(record.date);
    previousDate = record.date;
  });

  const localCharacterCode = root && isRecord(root.profile) ? stringOrNull(root.profile.characterCode) : null;
  const localAuthEmail = root && isRecord(root.authAccount) ? stringOrNull(root.authAccount.email) : null;
  const ownership = classifyOwnership(ownershipInput, localCharacterCode);
  ownership.localAuthEmail = localAuthEmail;

  const lastActiveDate = root ? stringOrNull(root.lastActiveDate) : null;
  if (root && !isRealDate(lastActiveDate)) addIssue(issues, 'last_active_date_invalid', 'error', '$.lastActiveDate', 'Last active date must be a real YYYY-MM-DD date.', root.lastActiveDate);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return {
    schemaVersion: ARC_PROGRESS_SNAPSHOT_SCHEMA_VERSION,
    snapshotId,
    capturedAt,
    source: {
      type: ARC_PROGRESS_STORAGE_KEY,
      storageKey: ARC_PROGRESS_STORAGE_KEY,
      appStateFormat: 'v1',
      rawPayloadPresent: rawJson !== null,
      rawPayloadHash,
    },
    ownership,
    progress: {
      stats,
      completedTasksToday: {
        localDate: lastActiveDate,
        statIds: completedStatIds,
        rawEntries: rawCompletions,
        verification: 'legacy_unverified',
      },
      history,
      deletedTasks,
    },
    activityMetadata: {
      lastActiveDate,
      consecutiveLoginDays: root ? finiteNumberOrNull(root.consecutiveLoginDays) : null,
      lastDailyBonusDate: root ? stringOrNull(root.lastDailyBonusDate) : null,
      moduleReloadsCountToday: root ? finiteNumberOrNull(root.moduleReloadsCountToday) : null,
    },
    relatedUserContent: {
      weeklyRoutine: root?.weeklyRoutine ?? null,
      calendarState: root?.calendarState ?? null,
    },
    migration: {
      status: errors.length > 0 ? 'quarantined' : 'validated',
      validationWarnings: warnings,
      validationErrors: errors,
      claimedByUserId: null,
      userConfirmedOwnershipAt: null,
      importedAt: null,
      importVersion: null,
      serverImportId: null,
    },
    raw: { originalJson: rawJson },
  };
}

async function readOwnershipEvidence(): Promise<SnapshotOwnershipInput> {
  const evidence: string[] = [];
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) evidence.push(`auth_read_error:${userError.message}`);
  if (!user) return { ...EMPTY_OWNERSHIP, evidence };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('character_code')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileError) evidence.push(`owner_profile_read_error:${profileError.message}`);

  return {
    authenticatedUserId: user.id,
    authenticatedEmail: user.email ?? null,
    serverCharacterCode: profile?.character_code ?? null,
    evidence,
  };
}

export async function captureArcProgressSnapshot(): Promise<ArcProgressSnapshot> {
  const rawJson = globalThis.localStorage.getItem(ARC_PROGRESS_STORAGE_KEY);
  const rawPayloadHash = await sha256Hex(rawJson ?? '');
  const ownership = await readOwnershipEvidence();
  return buildArcProgressSnapshot(rawJson, rawPayloadHash, ownership);
}

export function getArcProgressReadinessReport(snapshot: ArcProgressSnapshot): ArcProgressReadinessReport {
  const stats = snapshot.progress.stats;
  const tasks = stats.flatMap((stat) => stat.tasks);
  return {
    canConsiderAutomaticImport:
      snapshot.migration.status === 'validated'
      && snapshot.migration.validationErrors.length === 0
      && snapshot.ownership.confidence === 'MODERATE',
    ownershipConfidence: snapshot.ownership.confidence,
    blockingErrors: snapshot.migration.validationErrors,
    warnings: snapshot.migration.validationWarnings,
    counts: {
      stats: stats.length,
      customStats: stats.filter((stat) => stat.kind === 'custom').length,
      tasks: tasks.length,
      customTasks: tasks.filter((task) => task.isCustom === true).length,
      deletedTasks: snapshot.progress.deletedTasks.length,
      historyRecords: snapshot.progress.history.length,
    },
  };
}

export function serializeArcProgressBackup(snapshot: ArcProgressSnapshot): string {
  return JSON.stringify({
    exportFormat: 'arc-progress-backup',
    exportVersion: 1,
    snapshot,
  }, null, 2);
}

export function createArcProgressBackupBlob(snapshot: ArcProgressSnapshot): Blob {
  return new Blob([serializeArcProgressBackup(snapshot)], { type: 'application/json' });
}
