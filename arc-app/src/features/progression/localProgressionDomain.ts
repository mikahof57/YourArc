import { DEFAULT_STATS } from '../../data/defaultStats';
import type { ArcCompletionResult, ArcDailyAssignment, StatAttribute, TaskItem, UserProfile } from '../../types';
import { createPresetTaskCatalogForLanguage } from '../../utils/presetTaskCatalog';
import {
  ARC_CANONICAL_STAT_IDS,
  createArcId,
  type ArcCanonicalStatId,
  type ArcLocalProgressionEvent,
  type ArcLocalStatMeta,
  type ArcSaveGame,
} from '../savegame/arcSaveGame';

export const ARC_MAX_CUSTOM_ATTRIBUTES = 5;
export const ARC_MAX_CUSTOM_TASKS_PER_ATTRIBUTE = 30;
export const ARC_HISTORY_RETENTION_DAYS = 90;
export const ARC_RESTDAY_OPTIONS = ['sauna', 'massage', 'hot_bath'] as const;

export interface ArcCharacterInitializationInput {
  profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'gender'>
    & Partial<Pick<UserProfile, 'age' | 'weight' | 'height' | 'avatarCategory' | 'showAvatarFrame'>>;
  stats: Array<{ statId: ArcCanonicalStatId; startValue: number }>;
  timezone: string;
  now?: Date;
}

export interface ArcCustomAttributeInput {
  displayName: string;
  emoji: string;
  taskTitle: string;
  taskDescription?: string;
  taskSelectionMode?: 'random' | 'sequential';
}

export interface ArcCustomTaskInput {
  title: string;
  description?: string;
  tier?: number;
}

const clone = <T>(value: T): T => structuredClone(value);
const isIntegerBetween = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;

function statFor(save: ArcSaveGame, statId: string): StatAttribute {
  const canonical = save.progression.canonicalStats[statId as ArcCanonicalStatId];
  const stat = canonical ?? save.progression.customAttributes.find((candidate) => candidate.id === statId);
  if (!stat) throw new Error('arc_local_stat_not_found');
  return stat;
}

function metaFor(save: ArcSaveGame, statId: string): ArcLocalStatMeta {
  const meta = save.progression.statMeta[statId];
  if (!meta) throw new Error('arc_local_stat_metadata_missing');
  return meta;
}

function dayInTimezone(now: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    throw new Error('arc_local_timezone_invalid');
  }
}

function nextDay(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error('arc_local_day_invalid');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function deterministicScore(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function arcXpThresholdForLevel(level: number): number {
  if (!Number.isInteger(level) || level <= 1) return 0;
  const threshold = Math.floor((100 / 0.08) * (Math.pow(1.08, level - 1) - 1));
  return Number.isSafeInteger(threshold) ? threshold : Number.MAX_SAFE_INTEGER;
}

export function arcLevelFromLifetimeXp(xp: number): number {
  if (!Number.isSafeInteger(xp) || xp <= 0) return 1;
  let level = Math.max(1, Math.floor(Math.log(1 + xp * 0.08 / 100) / Math.log(1.08)) + 1);
  while (level < Number.MAX_SAFE_INTEGER && arcXpThresholdForLevel(level + 1) <= xp) level += 1;
  while (level > 1 && arcXpThresholdForLevel(level) > xp) level -= 1;
  return level;
}

export function arcOfficialTaskXp(tier: number | null): number {
  return 10 + Math.floor(Math.max(0, Math.min(12, tier ?? 0)) / 3);
}

export function updateStat(save: ArcSaveGame, statId: string, requestedValue: number): number {
  if (!Number.isFinite(requestedValue)) throw new Error('arc_local_stat_value_invalid');
  const stat = statFor(save, statId);
  const meta = metaFor(save, statId);
  if (meta.maxValueLocked) return (stat.value = 100);
  stat.value = Math.max(0, Math.min(100, Math.trunc(requestedValue)));
  if (stat.value === 100) meta.maxValueLocked = true;
  return stat.value;
}

export function addXp(save: ArcSaveGame, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0 || save.progression.lifetimeXp > Number.MAX_SAFE_INTEGER - amount) {
    throw new Error('arc_local_xp_invalid');
  }
  save.progression.lifetimeXp += amount;
  save.progression.level = arcLevelFromLifetimeXp(save.progression.lifetimeXp);
  const floor = arcXpThresholdForLevel(save.progression.level);
  const next = arcXpThresholdForLevel(save.progression.level + 1);
  save.progression.currentLevelXp = save.progression.lifetimeXp - floor;
  save.progression.requiredLevelXp = next - floor;
}

function snapshotDay(save: ArcSaveGame, day: string): void {
  const stats = Object.fromEntries([
    ...Object.values(save.progression.canonicalStats),
    ...save.progression.customAttributes,
  ].filter((stat) => save.progression.statMeta[stat.id]?.active).map((stat) => [stat.id, stat.value]));
  const record = { date: day, stats };
  const upsert = (records: typeof save.progression.dailySnapshots) => {
    const index = records.findIndex((entry) => entry.date === day);
    if (index >= 0) records[index] = clone(record); else records.push(clone(record));
    records.sort((a, b) => a.date.localeCompare(b.date));
    if (records.length > ARC_HISTORY_RETENTION_DAYS) records.splice(0, records.length - ARC_HISTORY_RETENTION_DAYS);
  };
  upsert(save.progression.dailySnapshots);
  upsert(save.progression.history);
}

/** Refreshes presentation history without implying assignment completion or another progression event. */
export function snapshotProgressionDay(save: ArcSaveGame, day: string): void {
  snapshotDay(save, day);
}

function activeStats(save: ArcSaveGame): StatAttribute[] {
  return [...ARC_CANONICAL_STAT_IDS.map((id) => save.progression.canonicalStats[id]), ...save.progression.customAttributes]
    .filter((stat) => save.progression.statMeta[stat.id]?.active);
}

function createAssignment(save: ArcSaveGame, stat: StatAttribute, day: string): ArcDailyAssignment {
  const meta = metaFor(save, stat.id);
  if (stat.id === 'muskeln' && meta.physicalTrainingCycle >= 6) {
    return {
      assignment_id: `local-assignment:${day}:${stat.id}`,
      arc_day: day, stat_id: stat.id, task_source: 'special', preset_catalog_version: null,
      preset_task_key: null, custom_task_id: null, assignment_kind: 'restday',
      special_rule_key: 'training_cycle_restday', title: 'Aktiver Restday',
      description: 'Wähle eine aktive Regenerationsoption und schließe sie heute ab.',
      tier: Math.min(12, Math.floor(stat.value / 8)), sort_order: 1,
      task_metadata: { official: true, options: ARC_RESTDAY_OPTIONS.map((key) => ({ key })) },
      completion_choice_key: null, completed_at: null,
    };
  }
  if (!stat.isCustom) {
    const tier = Math.min(12, Math.floor(stat.value / 8));
    const catalog = createPresetTaskCatalogForLanguage('de');
    const exact = catalog.filter((task) => task.canonicalStatKey === stat.id && task.tier === tier);
    const eligible = catalog.filter((task) => task.canonicalStatKey === stat.id && task.tier <= tier);
    const fallbackTier = Math.max(-1, ...eligible.map((task) => task.tier));
    const candidates = exact.length ? exact : eligible.filter((task) => task.tier === fallbackTier);
    if (!candidates.length) throw new Error(`arc_local_no_official_task_available:${stat.id}`);
    const prior = new Map<string, { count: number; last: string }>();
    save.progression.assignments.filter((item) => item.stat_id === stat.id && item.preset_task_key).forEach((item) => {
      const current = prior.get(item.preset_task_key!) ?? { count: 0, last: '' };
      prior.set(item.preset_task_key!, { count: current.count + 1, last: current.last > item.arc_day ? current.last : item.arc_day });
    });
    const selected = [...candidates].sort((a, b) => {
      const pa = prior.get(a.taskKey) ?? { count: 0, last: '' };
      const pb = prior.get(b.taskKey) ?? { count: 0, last: '' };
      return pa.count - pb.count || pa.last.localeCompare(pb.last)
        || deterministicScore(`${save.saveId}:${stat.id}:${day}:${a.taskKey}`) - deterministicScore(`${save.saveId}:${stat.id}:${day}:${b.taskKey}`)
        || a.order - b.order;
    })[0];
    return {
      assignment_id: `local-assignment:${day}:${stat.id}`, arc_day: day, stat_id: stat.id,
      task_source: 'preset', preset_catalog_version: selected.catalogVersion,
      preset_task_key: selected.taskKey, custom_task_id: null, assignment_kind: 'normal',
      special_rule_key: null, title: selected.title, description: selected.description,
      tier: selected.tier, sort_order: selected.order, task_metadata: { official: true },
      completion_choice_key: null, completed_at: null,
    };
  }
  const tasks = save.progression.customTasks[stat.id]?.filter((task) => task.isCustom !== false) ?? [];
  if (!tasks.length) throw new Error(`arc_local_active_custom_stat_has_no_tasks:${stat.id}`);
  let selected: TaskItem;
  if (stat.taskSelectionMode === 'sequential') {
    const index = (stat.currentTaskIndex ?? 0) % tasks.length;
    selected = [...tasks].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))[index];
    stat.currentTaskIndex = (index + 1) % tasks.length;
  } else {
    selected = [...tasks].sort((a, b) => deterministicScore(`${save.saveId}:${stat.id}:${day}:${a.id}`) - deterministicScore(`${save.saveId}:${stat.id}:${day}:${b.id}`))[0];
  }
  return {
    assignment_id: `local-assignment:${day}:${stat.id}`, arc_day: day, stat_id: stat.id,
    task_source: 'custom', preset_catalog_version: null, preset_task_key: null,
    custom_task_id: selected.id, assignment_kind: 'normal', special_rule_key: null,
    title: selected.title, description: selected.description, tier: null, sort_order: selected.order,
    task_metadata: { official: false }, completion_choice_key: null, completed_at: null,
  };
}

export function generateDailyAssignments(save: ArcSaveGame, day: string): ArcDailyAssignment[] {
  for (const stat of activeStats(save)) {
    const meta = metaFor(save, stat.id);
    if (meta.activeSinceArcDay && meta.activeSinceArcDay > day) continue;
    if (!save.progression.assignments.some((item) => item.arc_day === day && item.stat_id === stat.id)) {
      save.progression.assignments.push(createAssignment(save, stat, day));
    }
  }
  return save.progression.assignments.filter((item) => item.arc_day === day);
}

export function applyDecay(save: ArcSaveGame, missedDay: string, processingDay: string): void {
  for (const stat of activeStats(save)) {
    const meta = metaFor(save, stat.id);
    if (meta.activeSinceArcDay && meta.activeSinceArcDay > missedDay) continue;
    const completed = save.progression.assignments.some((item) => item.arc_day === missedDay && item.stat_id === stat.id && item.completed_at);
    if (completed) continue;
    const before = stat.value;
    const after = meta.maxValueLocked || before === 100 ? 100 : Math.max(0, before - 1);
    updateStat(save, stat.id, after);
    meta.statStreak = 0;
    save.progression.statStreaks[stat.id] = 0;
    if (stat.id === 'muskeln') meta.physicalTrainingCycle = 0;
    const eventId = `local-decay:${processingDay}:${stat.id}`;
    if (after !== before && !save.progression.completedEventIds.includes(eventId)) {
      save.progression.events.push({ eventId, eventType: 'DAILY_DECAY', arcDay: processingDay,
        statId: stat.id, assignmentId: null, delta: after - before, valueBefore: before,
        valueAfter: after, xpGained: 0, createdAt: new Date().toISOString(),
        metadata: { missedAssignmentArcDay: missedDay, source: 'local_daily_engine', floorReached: after === 0 } });
      save.progression.completedEventIds.push(eventId);
    }
  }
}

export function initializeArcDay(save: ArcSaveGame, now = new Date()): string {
  if (!save.progression.initializedAt) throw new Error('arc_local_progress_not_initialized');
  const localDay = dayInTimezone(now, save.progression.timezone);
  let arcDay = save.progression.lastProcessedArcDay && save.progression.lastProcessedArcDay > localDay
    ? save.progression.lastProcessedArcDay : localDay;
  const previousArcDay = save.progression.arcDay;
  if (save.progression.lastProcessedArcDay) {
    let day = nextDay(save.progression.lastProcessedArcDay);
    while (day <= arcDay) {
      const prior = new Date(`${day}T00:00:00Z`); prior.setUTCDate(prior.getUTCDate() - 1);
      const priorDay = prior.toISOString().slice(0, 10);
      applyDecay(save, priorDay, day);
      save.progression.lastProcessedArcDay = day;
      snapshotDay(save, day);
      day = nextDay(day);
    }
  }
  save.progression.arcDay = arcDay;
  save.progression.lastProcessedArcDay = arcDay;
  if (previousArcDay !== arcDay) save.progression.completedTasksToday = [];
  if (!save.progression.loginDays.includes(arcDay)) {
    const last = save.progression.loginDays.at(-1) ?? null;
    save.progression.loginStreak = last && daysBetween(last, arcDay) === 1 ? save.progression.loginStreak + 1 : 1;
    save.progression.loginDays.push(arcDay);
  }
  generateDailyAssignments(save, arcDay);
  snapshotDay(save, arcDay);
  return arcDay;
}

export function initializeCharacter(save: ArcSaveGame, input: ArcCharacterInitializationInput): void {
  if (save.progression.initializedAt || save.progression.events.length || save.progression.assignments.length) {
    throw new Error('arc_local_character_progress_already_initialized_or_partial');
  }
  const name = input.profile.name.trim();
  if (!name || name.length > 60 || !input.profile.avatarUrl || !['m', 'f', 'd'].includes(input.profile.gender)) {
    throw new Error('arc_local_character_profile_invalid');
  }
  if (!input.stats.length || input.stats.length > 6 || new Set(input.stats.map((stat) => stat.statId)).size !== input.stats.length
    || input.stats.some((stat) => !ARC_CANONICAL_STAT_IDS.includes(stat.statId) || !isIntegerBetween(stat.startValue, 0, 99))) {
    throw new Error('arc_local_character_stats_invalid');
  }
  save.profile = { ...save.profile, ...input.profile, isCreated: true };
  // Committed atomically with every new character, including recreations.
  save.settings.introductionState = 'pending';
  save.progression.timezone = input.timezone;
  const now = input.now ?? new Date();
  const day = dayInTimezone(now, input.timezone);
  for (const id of ARC_CANONICAL_STAT_IDS) {
    const selected = input.stats.find((stat) => stat.statId === id);
    const stat = save.progression.canonicalStats[id];
    stat.value = selected?.startValue ?? stat.value;
    stat.startValue = selected?.startValue;
    save.progression.statMeta[id] = { active: Boolean(selected), activeSinceArcDay: selected ? day : null,
      statStreak: 0, physicalTrainingCycle: 0, maxValueLocked: false };
  }
  save.progression.initializedAt = now.toISOString();
  save.progression.lastProcessedArcDay = day;
  save.progression.arcDay = day;
  initializeArcDay(save, now);
}

export function completeAssignment(save: ArcSaveGame, assignmentId: string, choiceKey: string | null = null, now = new Date()): ArcCompletionResult {
  const assignment = save.progression.assignments.find((item) => item.assignment_id === assignmentId);
  if (!assignment) throw new Error('arc_local_assignment_not_found');
  if (assignment.arc_day !== save.progression.arcDay) throw new Error('arc_local_assignment_not_today');
  const eventId = `local-completion:${assignmentId}`;
  const priorEvent = save.progression.events.find((event) => event.eventId === eventId);
  if (priorEvent) return completionResult(save, assignment, priorEvent, true);
  if (assignment.assignment_kind === 'restday') {
    if (!choiceKey || !ARC_RESTDAY_OPTIONS.includes(choiceKey as typeof ARC_RESTDAY_OPTIONS[number])) throw new Error('arc_local_restday_choice_invalid');
  } else if (choiceKey) throw new Error('arc_local_choice_not_allowed');
  const stat = statFor(save, assignment.stat_id);
  const meta = metaFor(save, stat.id);
  if (!meta.active) throw new Error('arc_local_stat_not_active');
  const before = stat.value;
  const after = updateStat(save, stat.id, before + 2);
  const xp = stat.isCustom ? 0 : arcOfficialTaskXp(assignment.tier);
  const oldLevel = save.progression.level;
  addXp(save, xp);
  meta.statStreak += 1;
  save.progression.statStreaks[stat.id] = meta.statStreak;
  if (stat.id === 'muskeln') meta.physicalTrainingCycle = assignment.assignment_kind === 'restday' ? 0 : Math.min(6, meta.physicalTrainingCycle + 1);
  assignment.completed_at = now.toISOString();
  assignment.completion_choice_key = choiceKey;
  const event: ArcLocalProgressionEvent = { eventId, eventType: 'TASK_COMPLETION', arcDay: assignment.arc_day,
    statId: stat.id, assignmentId, delta: after - before, valueBefore: before, valueAfter: after,
    xpGained: xp, createdAt: now.toISOString(), metadata: {
      oldLevel, newLevel: save.progression.level,
      lifetimeXpAfter: save.progression.lifetimeXp,
      statStreakAfter: meta.statStreak,
    } };
  save.progression.events.push(event);
  save.progression.completedEventIds.push(eventId);
  save.progression.completedTasksToday = [...new Set([...save.progression.completedTasksToday, stat.id])];
  snapshotDay(save, assignment.arc_day);
  return completionResult(save, assignment, event, false);
}

function completionResult(save: ArcSaveGame, assignment: ArcDailyAssignment, event: ArcLocalProgressionEvent, retry: boolean): ArcCompletionResult {
  const oldLevel = Number(event.metadata.oldLevel ?? save.progression.level);
  const newLevel = Number(event.metadata.newLevel ?? save.progression.level);
  const lifetimeXp = Number(event.metadata.lifetimeXpAfter ?? save.progression.lifetimeXp);
  const levelFloor = arcXpThresholdForLevel(newLevel);
  const nextThreshold = arcXpThresholdForLevel(newLevel + 1);
  return { confirmed: true, idempotent_retry: retry, assignment_id: assignment.assignment_id,
    arc_day: assignment.arc_day, stat_id: assignment.stat_id, stat_before: event.valueBefore,
    stat_after: event.valueAfter, stat_delta: event.delta, xp_gained: event.xpGained,
    lifetime_xp: lifetimeXp, old_level: oldLevel, new_level: newLevel,
    level_up: newLevel > oldLevel, current_level_xp: lifetimeXp - levelFloor,
    required_level_xp: nextThreshold - levelFloor,
    stat_streak: Number(event.metadata.statStreakAfter ?? metaFor(save, assignment.stat_id).statStreak),
    assignment_kind: assignment.assignment_kind, completion_choice_key: assignment.completion_choice_key };
}

export function createCustomAttribute(save: ArcSaveGame, input: ArcCustomAttributeInput): string {
  if (!save.progression.initializedAt) throw new Error('arc_local_progress_not_initialized');
  if (save.progression.customAttributes.filter((stat) => metaFor(save, stat.id).active).length >= ARC_MAX_CUSTOM_ATTRIBUTES) throw new Error('arc_custom_stat_limit_reached');
  const name = input.displayName.trim(), emoji = input.emoji.trim(), title = input.taskTitle.trim(), description = input.taskDescription?.trim() ?? '';
  if (!name || name.length > 60 || !emoji || emoji.length > 32 || !title || title.length > 160 || description.length > 2000) throw new Error('arc_local_custom_attribute_invalid');
  const id = `custom-${createArcId('character').replace('arc-character-', '')}`;
  const taskId = `custom-task-${createArcId('character').replace('arc-character-', '')}`;
  const task: TaskItem = { id: taskId, title, description, order: 1, isCustom: true };
  save.progression.customAttributes.push({ id, name, emoji, value: 1, startValue: 1, tasks: [task], taskSelectionMode: input.taskSelectionMode ?? 'random', isCustom: true });
  save.progression.customTasks[id] = [task];
  save.progression.statMeta[id] = { active: true, activeSinceArcDay: save.progression.arcDay, statStreak: 0, physicalTrainingCycle: 0, maxValueLocked: false };
  if (save.progression.arcDay) generateDailyAssignments(save, save.progression.arcDay);
  return id;
}

export function updateCustomAttribute(save: ArcSaveGame, statId: string, changes: Partial<Pick<StatAttribute, 'name' | 'emoji' | 'taskSelectionMode'>>): void {
  const stat = statFor(save, statId);
  if (!stat.isCustom || !metaFor(save, statId).active) throw new Error('arc_custom_attribute_not_found');
  if (changes.name !== undefined) { const value = changes.name.trim(); if (!value || value.length > 60) throw new Error('arc_local_custom_attribute_name_invalid'); stat.name = value; }
  if (changes.emoji !== undefined) { const value = changes.emoji.trim(); if (!value || value.length > 32) throw new Error('arc_local_custom_attribute_emoji_invalid'); stat.emoji = value; }
  if (changes.taskSelectionMode !== undefined) stat.taskSelectionMode = changes.taskSelectionMode;
}

export function deleteCustomAttribute(save: ArcSaveGame, statId: string): void {
  const stat = statFor(save, statId), meta = metaFor(save, statId);
  if (!stat.isCustom || !meta.active) throw new Error('arc_custom_attribute_not_found');
  meta.active = false; meta.statStreak = 0; meta.physicalTrainingCycle = 0;
}

export function createCustomTask(save: ArcSaveGame, statId: string, input: ArcCustomTaskInput): string {
  const stat = statFor(save, statId), tasks = save.progression.customTasks[statId];
  if (!stat.isCustom || !metaFor(save, statId).active || !tasks) throw new Error('arc_custom_attribute_not_found');
  if (tasks.length >= ARC_MAX_CUSTOM_TASKS_PER_ATTRIBUTE) throw new Error('arc_custom_task_limit_reached');
  const title = input.title.trim(), description = input.description?.trim() ?? '';
  if (!title || title.length > 160 || description.length > 2000 || (input.tier !== undefined && !isIntegerBetween(input.tier, 0, 12))) throw new Error('arc_local_custom_task_invalid');
  const id = `custom-task-${createArcId('character').replace('arc-character-', '')}`;
  tasks.push({ id, title, description, tier: input.tier, order: Math.max(0, ...tasks.map((task) => task.order)) + 1, isCustom: true });
  stat.tasks = clone(tasks); return id;
}

export function updateCustomTask(save: ArcSaveGame, statId: string, taskId: string, changes: Partial<ArcCustomTaskInput & { order: number }>): void {
  const tasks = save.progression.customTasks[statId] ?? [], task = tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new Error('arc_custom_task_not_found');
  if (changes.title !== undefined) { const value = changes.title.trim(); if (!value || value.length > 160) throw new Error('arc_local_custom_task_title_invalid'); task.title = value; }
  if (changes.description !== undefined) { const value = changes.description.trim(); if (value.length > 2000) throw new Error('arc_local_custom_task_description_invalid'); task.description = value; }
  if (changes.tier !== undefined) { if (!isIntegerBetween(changes.tier, 0, 12)) throw new Error('arc_local_custom_task_tier_invalid'); task.tier = changes.tier; }
  if (changes.order !== undefined) { if (!Number.isInteger(changes.order) || changes.order < 1) throw new Error('arc_local_custom_task_order_invalid'); task.order = changes.order; }
  statFor(save, statId).tasks = clone(tasks);
}

export function deleteCustomTask(save: ArcSaveGame, statId: string, taskId: string): void {
  const tasks = save.progression.customTasks[statId] ?? [], index = tasks.findIndex((task) => task.id === taskId);
  if (index < 0) throw new Error('arc_custom_task_not_found');
  if (tasks.length === 1 && metaFor(save, statId).active) throw new Error('arc_local_custom_stat_requires_task');
  tasks.splice(index, 1); statFor(save, statId).tasks = clone(tasks);
}

export function resetCharacterProgression(save: ArcSaveGame): void {
  // Reset alone must not arm the introduction; successful creation will.
  if (save.settings.introductionState) save.settings.introductionState = 'completed';
  const fresh = clone(DEFAULT_STATS);
  save.progression.canonicalStats = Object.fromEntries(ARC_CANONICAL_STAT_IDS.map((id) => [id, fresh.find((stat) => stat.id === id)!])) as ArcSaveGame['progression']['canonicalStats'];
  save.progression.customAttributes = []; save.progression.customTasks = {}; save.progression.lifetimeXp = 0;
  save.progression.level = 1; save.progression.currentLevelXp = 0; save.progression.requiredLevelXp = 100;
  save.progression.arcDay = null; save.progression.loginStreak = 0; save.progression.completedTasksToday = [];
  save.progression.assignments = []; save.progression.history = []; save.progression.dailySnapshots = [];
  save.progression.statStreaks = {}; save.progression.events = []; save.progression.completedEventIds = [];
  save.progression.loginDays = []; save.progression.initializedAt = null; save.progression.lastProcessedArcDay = null;
  save.progression.statMeta = Object.fromEntries(ARC_CANONICAL_STAT_IDS.map((id) => [id, { active: true, activeSinceArcDay: null, statStreak: 0, physicalTrainingCycle: 0, maxValueLocked: false }]));
}
