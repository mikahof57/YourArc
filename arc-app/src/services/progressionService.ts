import { supabase } from '../lib/supabaseClient';
import type {
  ArcCompletionResult,
  ArcCustomAssignmentSwapResult,
  ArcDailyAssignment,
  ArcDailyPayload,
  DayHistoryRecord,
  StatAttribute,
  TaskItem,
} from '../types';

export type {
  ArcCompletionResult,
  ArcCustomAssignmentSwapResult,
  ArcDailyAssignment,
  ArcDailyPayload,
} from '../types';

export interface ArcCharacterInitializationStat {
  stat_id: string;
  start_value: number;
}

export interface ArcCharacterInitializationProfile {
  name: string;
  avatar_url: string;
  gender: 'm' | 'f' | 'd';
}

function requireRpcPayload<T>(data: unknown, rpcName: string): T {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${rpcName} returned an invalid payload`);
  }
  return data as T;
}

export async function loadArcDailyProgression(): Promise<ArcDailyPayload> {
  const { data, error } = await supabase.rpc('arc_get_or_initialize_today');
  if (error) throw error;
  return requireRpcPayload<ArcDailyPayload>(data, 'arc_get_or_initialize_today');
}

export async function initializeArcCharacter(
  profile: ArcCharacterInitializationProfile,
  stats: ArcCharacterInitializationStat[],
  timezone: string,
): Promise<ArcDailyPayload> {
  const { data, error } = await supabase.rpc('initialize_arc_character', {
    p_profile: profile,
    p_stats: stats,
    p_timezone: timezone,
  });
  if (error) throw error;
  return requireRpcPayload<ArcDailyPayload>(data, 'initialize_arc_character');
}

export async function completeArcDailyAssignment(
  assignmentId: string,
  choiceKey: string | null = null,
): Promise<ArcCompletionResult> {
  const { data, error } = await supabase.rpc('arc_complete_daily_assignment', {
    p_assignment_id: assignmentId,
    p_choice_key: choiceKey,
  });
  if (error) throw error;
  return requireRpcPayload<ArcCompletionResult>(data, 'arc_complete_daily_assignment');
}

export async function changeArcCustomDailyAssignment(
  assignmentId: string,
): Promise<ArcCustomAssignmentSwapResult> {
  const { data, error } = await supabase.rpc('arc_change_custom_daily_assignment', {
    p_assignment_id: assignmentId,
  });
  if (error) throw error;
  return requireRpcPayload<ArcCustomAssignmentSwapResult>(data, 'arc_change_custom_daily_assignment');
}

export function mapArcPayloadToUiStats(
  payload: ArcDailyPayload,
  existingStats: StatAttribute[],
): StatAttribute[] {
  const existingById = new Map(existingStats.map((stat) => [stat.id, stat]));
  const completedStatIds = new Set(
    payload.assignments.filter((assignment) => assignment.completed_at !== null).map((assignment) => assignment.stat_id),
  );

  return [...payload.stats]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((serverStat) => {
      const existing = existingById.get(serverStat.stat_id);
      return {
        id: serverStat.stat_id,
        name: serverStat.display_name,
        emoji: serverStat.emoji,
        value: serverStat.current_value,
        startValue: serverStat.start_value ?? undefined,
        tasks: existing?.tasks ?? [],
        taskSelectionMode: serverStat.task_selection_mode,
        currentTaskIndex: serverStat.current_task_index ?? undefined,
        completedToday: completedStatIds.has(serverStat.stat_id),
        isCustom: serverStat.stat_kind === 'custom',
      };
    });
}

export function mapArcAssignmentToTaskItem(assignment: ArcDailyAssignment): TaskItem {
  return {
    id: assignment.assignment_id,
    title: assignment.title,
    description: assignment.description,
    order: assignment.sort_order,
    tier: assignment.tier ?? undefined,
    isCustom: assignment.task_source === 'custom',
  };
}

export function mapArcHistoryToUiHistory(payload: ArcDailyPayload): DayHistoryRecord[] {
  const historyByDay = new Map<string, Record<string, number>>();
  for (const point of payload.recent_server_history) {
    const stats = historyByDay.get(point.arc_day) ?? {};
    stats[point.stat_id] = point.value;
    historyByDay.set(point.arc_day, stats);
  }

  return [...historyByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, stats]) => ({ date, stats }));
}

export function getCompletedArcStatIds(assignments: ArcDailyAssignment[]): string[] {
  return assignments
    .filter((assignment) => assignment.completed_at !== null)
    .map((assignment) => assignment.stat_id);
}

export interface ArcRestdayOption {
  key: string;
  title: string;
}

export function getArcRestdayOptions(assignment: ArcDailyAssignment): ArcRestdayOption[] {
  const options = assignment.task_metadata.options;
  if (!Array.isArray(options)) return [];

  return options.flatMap((option) => {
    if (option === null || typeof option !== 'object') return [];
    const key = Reflect.get(option, 'key');
    const title = Reflect.get(option, 'title');
    return typeof key === 'string' && typeof title === 'string' ? [{ key, title }] : [];
  });
}
