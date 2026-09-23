import type { ArcActivityEvent, MissionDefinition, MissionProgress, MissionRuleDefinition, MissionRun } from './missionTypes';

const DAY_MS = 86_400_000;
const taskEvents = (events: readonly ArcActivityEvent[]) => events.filter((event) => event.type === 'DAILY_TASK_COMPLETED');
const dateMs = (day: string) => Date.parse(`${day}T00:00:00Z`);
export const addArcDays = (day: string, amount: number) => new Date(dateMs(day) + amount * DAY_MS).toISOString().slice(0, 10);

function boundedEvents(events: readonly ArcActivityEvent[], run: MissionRun): ArcActivityEvent[] {
  return events.filter((event) => event.occurredAt >= run.activated_at && event.arcDay >= run.start_arc_day && (!run.deadline_arc_day || event.arcDay <= run.deadline_arc_day));
}

function consecutiveGroups(days: readonly string[]): string[][] {
  const unique = [...new Set(days)].sort();
  const groups: string[][] = [];
  for (const day of unique) {
    const group = groups.at(-1);
    if (!group || dateMs(day) - dateMs(group.at(-1)!) !== DAY_MS) groups.push([day]);
    else group.push(day);
  }
  return groups;
}

function targetFor(rule: MissionRuleDefinition): number {
  if (rule.type === 'category_minimums') return Object.values(rule.minimums ?? {}).reduce((sum, value) => sum + value, 0);
  if (rule.type === 'comeback_run') return rule.active_days ?? rule.target ?? 1;
  return rule.target ?? 1;
}

export function isMissionEligible(definition: MissionDefinition, events: readonly ArcActivityEvent[], arcDay: string, onboardingStartDay?: string): boolean {
  const rule = definition.rule_definition;
  if (rule.scope === 'onboarding' && onboardingStartDay && rule.window_days && arcDay > addArcDays(onboardingStartDay, rule.window_days - 1)) return false;
  if (rule.type === 'comeback' || rule.type === 'comeback_run') {
    const inactiveDays = rule.inactive_days ?? 0;
    const from = addArcDays(arcDay, -inactiveDays);
    const completedTasks = taskEvents(events);
    return completedTasks.some((event) => event.arcDay < from)
      && !completedTasks.some((event) => event.arcDay >= from && event.arcDay < arcDay);
  }
  return true;
}

export function calculateDeadline(definition: MissionDefinition, activationArcDay: string, onboardingStartDay?: string): string | null {
  const rule = definition.rule_definition;
  if (!rule.window_days) return null;
  const start = rule.scope === 'onboarding' && onboardingStartDay ? onboardingStartDay : activationArcDay;
  return addArcDays(start, rule.window_days - 1);
}

export function calculateCooldown(run: MissionRun): string | null {
  if (!run.repeat_interval_days_snapshot) return null;
  const anchor = run.completed_arc_day ?? run.deadline_arc_day ?? run.start_arc_day;
  return addArcDays(anchor, run.repeat_interval_days_snapshot);
}

export function isMissionExpired(run: MissionRun, arcDay: string): boolean {
  return run.deadline_arc_day !== null && arcDay > run.deadline_arc_day && !run.progress.completed;
}

export function canRepeatMission(definition: MissionDefinition, runs: readonly MissionRun[], arcDay: string): boolean {
  const prior = runs.filter((run) => run.catalog_version === definition.catalog_version && run.mission_id === definition.mission_id);
  if (definition.repeat_interval_days === null) return !prior.some((run) => run.completed_at !== null);
  return !prior.some((run) => run.cooldown_until_arc_day !== null && run.cooldown_until_arc_day > arcDay);
}

export function calculateMissionProgress(rule: MissionRuleDefinition, run: MissionRun, allEvents: readonly ArcActivityEvent[]): MissionProgress {
  const events = boundedEvents(allEvents, run);
  const tasks = taskEvents(events);
  let target = targetFor(rule);
  let current = 0;
  let details: Record<string, unknown> = {};
  const allowed = rule.categories ? new Set(rule.categories) : null;
  const scopedTasks = allowed ? tasks.filter((event) => event.category && allowed.has(event.category)) : tasks;
  const byDay = new Map<string, ArcActivityEvent[]>();
  for (const event of tasks) byDay.set(event.arcDay, [...(byDay.get(event.arcDay) ?? []), event]);

  switch (rule.type) {
    case 'task_count':
    case 'multi_category_total': current = scopedTasks.length; break;
    case 'active_days': current = [...byDay.values()].filter((day) => day.length >= (rule.min_per_day ?? 1)).length; break;
    case 'login_streak': {
      const groups = consecutiveGroups(events.filter((event) => event.type === 'LOGIN_DAY').map((event) => event.arcDay));
      current = Math.max(0, ...groups.map((group) => group.length)); break;
    }
    case 'task_streak': {
      const days = [...byDay.entries()].filter(([, day]) => day.length >= (rule.min_per_day ?? 1)).map(([day]) => day);
      current = Math.max(0, ...consecutiveGroups(days).map((group) => group.length)); break;
    }
    case 'diversity': current = new Set(tasks.map((event) => event.category).filter(Boolean)).size; break;
    case 'daily_diversity': current = Math.max(0, ...[...byDay.values()].map((day) => new Set(day.map((event) => event.category).filter(Boolean)).size)); break;
    case 'same_category_count': {
      const counts = new Map<string, number>(); for (const event of tasks) if (event.category) counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
      current = Math.max(0, ...counts.values()); break;
    }
    case 'task_count_diversity': {
      const diversity = new Set(tasks.map((event) => event.category).filter(Boolean)).size;
      current = diversity >= (rule.diversity ?? 0) ? tasks.length : Math.min(tasks.length, target - 1); details = { categories: diversity }; break;
    }
    case 'category_minimums': {
      const counts: Record<string, { current: number; target: number }> = {};
      current = 0; for (const [category, minimum] of Object.entries(rule.minimums ?? {})) { const count = tasks.filter((event) => event.category === category).length; counts[category] = { current: count, target: minimum }; current += Math.min(count, minimum); }
      details = counts; break;
    }
    case 'category_threshold_count': {
      const counts = new Map<string, number>(); for (const event of tasks) if (event.category) counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
      current = [...counts.values()].filter((count) => count >= (rule.minimum ?? 0)).length; break;
    }
    case 'total_and_minimums': {
      const counts: Record<string, { current: number; target: number }> = {}; let minimaMet = true;
      for (const [category, minimum] of Object.entries(rule.minimums ?? {})) { const count = tasks.filter((event) => event.category === category).length; counts[category] = { current: count, target: minimum }; if (count < minimum) minimaMet = false; }
      current = minimaMet ? tasks.length : Math.min(tasks.length, target - 1); details = counts; break;
    }
    case 'streak_diversity': {
      const min = rule.min_per_day ?? 1; const streakTarget = target; let bestStreak = 0; let bestDiversity = 0; let complete = false;
      for (const group of consecutiveGroups([...byDay.entries()].filter(([, day]) => day.length >= min).map(([day]) => day))) {
        bestStreak = Math.max(bestStreak, group.length);
        for (let index = 0; index + streakTarget <= group.length; index += 1) {
          const window = new Set(group.slice(index, index + streakTarget));
          const diversity = new Set(tasks.filter((event) => window.has(event.arcDay)).map((event) => event.category).filter(Boolean)).size;
          bestDiversity = Math.max(bestDiversity, diversity); if (diversity >= (rule.diversity ?? 0)) complete = true;
        }
      }
      current = complete ? target : Math.min(bestStreak, target - 1); details = { streak: bestStreak, categories: bestDiversity }; break;
    }
    case 'sequential_diversity': {
      let best = 0; for (let index = 0; index + target <= tasks.length; index += 1) best = Math.max(best, new Set(tasks.slice(index, index + target).map((event) => event.category).filter(Boolean)).size);
      current = best >= (rule.diversity ?? 0) ? target : Math.min(tasks.length, target - 1); details = { categories: best }; break;
    }
    case 'comeback': current = tasks.length > 0 ? 1 : 0; break;
    case 'comeback_run': current = rule.active_days ? new Set(tasks.map((event) => event.arcDay)).size : tasks.length; break;
    default: throw new Error(`Unsupported Mission rule: ${rule.type}`);
  }
  return { current: Math.min(current, target), target, completed: current >= target, details };
}

export function evaluateMission(run: MissionRun, events: readonly ArcActivityEvent[], arcDay: string): MissionRun {
  if (run.state !== 'active') return run;
  const progress = calculateMissionProgress(run.rule_snapshot, run, events);
  if (progress.completed) return { ...run, progress, state: 'completed', completed_at: new Date().toISOString(), completed_arc_day: run.deadline_arc_day && arcDay > run.deadline_arc_day ? run.deadline_arc_day : arcDay };
  if (run.deadline_arc_day && arcDay > run.deadline_arc_day) return { ...run, progress, state: 'expired', cooldown_until_arc_day: calculateCooldown({ ...run, progress }) };
  return { ...run, progress };
}
