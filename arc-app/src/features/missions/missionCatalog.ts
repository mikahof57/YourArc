import { PERSONAL_MISSION_CATALOG_DATA } from './missionCatalogData';
import { calculateMissionReward, MISSION_REWARD_FORMULA_VERSION } from './missionRewardFormula';
import { CANONICAL_MISSION_CATEGORIES } from './missionTypes';
import type { MissionDefinition, MissionDifficulty, MissionRuleDefinition } from './missionTypes';
import { stableStringify } from '../content/contentHash';

export const PERSONAL_MISSION_CATALOG_VERSION = 'arc_personal_missions_v1';

const supportedRules = new Set([
  'task_count', 'active_days', 'login_streak', 'task_streak', 'diversity',
  'daily_diversity', 'same_category_count', 'task_count_diversity',
  'category_minimums', 'category_threshold_count', 'total_and_minimums',
  'streak_diversity', 'sequential_diversity', 'comeback', 'comeback_run',
]);
const categories = new Set<string>(CANONICAL_MISSION_CATEGORIES);

function requiredEvents(rule: MissionRuleDefinition): number {
  if (rule.type === 'category_minimums') return Object.values(rule.minimums ?? {}).reduce((sum, value) => sum + value, 0);
  if (rule.type === 'category_threshold_count') return (rule.target ?? 0) * (rule.minimum ?? 0);
  if (rule.type === 'active_days' || rule.type === 'task_streak') return (rule.target ?? 0) * (rule.min_per_day ?? 1);
  if (rule.type === 'comeback_run') return rule.active_days ?? rule.target ?? 0;
  return rule.target ?? 1;
}

function restrictionLevel(rule: MissionRuleDefinition): number {
  const minimumCount = Object.keys(rule.minimums ?? {}).length;
  if (minimumCount === 6) return 4;
  if (minimumCount === 2) return 2;
  if (rule.categories?.length === 1) return 3;
  if (rule.categories?.length === 2) return 2;
  if ((rule.type === 'diversity' || rule.type === 'daily_diversity') && rule.target === 6) return 4;
  if (rule.type === 'task_count_diversity' && rule.diversity === 6) return 4;
  if (rule.type === 'task_count_diversity' && rule.diversity === 3) return 1;
  if (['diversity', 'daily_diversity', 'task_count_diversity', 'streak_diversity', 'sequential_diversity', 'category_threshold_count'].includes(rule.type)) return 2;
  if (['same_category_count', 'comeback', 'comeback_run'].includes(rule.type) || rule.categories) return 1;
  return 0;
}

function buildDefinition(raw: typeof PERSONAL_MISSION_CATALOG_DATA[number]): MissionDefinition {
  const rule = { ...raw.rule, repeatable: raw.repeat_days !== null } as MissionRuleDefinition;
  const economy = {
    requiredEvents: requiredEvents(rule),
    timeWindowDays: rule.window_days ?? null,
    streakDays: ['task_streak', 'login_streak', 'streak_diversity'].includes(rule.type) ? rule.target ?? 0 : 0,
    restrictionLevel: restrictionLevel(rule),
  };
  return {
    mission_id: raw.id,
    catalog_version: PERSONAL_MISSION_CATALOG_VERSION,
    title_de: raw.title_de,
    title_en: raw.title_en,
    objective_de: raw.objective_de,
    objective_en: raw.objective_en,
    difficulty: raw.difficulty as MissionDifficulty,
    reward_credits: calculateMissionReward({ ...economy, repeatable: raw.repeat_days !== null }),
    economy_required_events: economy.requiredEvents,
    economy_time_window_days: economy.timeWindowDays,
    economy_streak_days: economy.streakDays,
    economy_restriction_level: economy.restrictionLevel,
    reward_formula_version: MISSION_REWARD_FORMULA_VERSION,
    repeat_interval_days: raw.repeat_days,
    rule_definition: rule,
    enabled: true,
    sort_order: raw.id,
  };
}

export const PERSONAL_MISSION_CATALOG: readonly MissionDefinition[] = Object.freeze(
  PERSONAL_MISSION_CATALOG_DATA.map(buildDefinition),
);

export function serializeMissionCatalog(catalog: readonly MissionDefinition[] = PERSONAL_MISSION_CATALOG): string {
  return stableStringify([...catalog].sort((left, right) => left.mission_id - right.mission_id).map((mission) => ({
    missionId: mission.mission_id,
    catalogVersion: mission.catalog_version,
    titleDe: mission.title_de,
    titleEn: mission.title_en,
    objectiveDe: mission.objective_de,
    objectiveEn: mission.objective_en,
    difficulty: mission.difficulty,
    rule: mission.rule_definition,
    economy: {
      requiredEvents: mission.economy_required_events,
      timeWindowDays: mission.economy_time_window_days,
      streakDays: mission.economy_streak_days,
      restrictionLevel: mission.economy_restriction_level,
    },
    repeatIntervalDays: mission.repeat_interval_days,
    rewardFormulaVersion: mission.reward_formula_version,
    rewardCredits: mission.reward_credits,
    sortOrder: mission.sort_order,
  })));
}

export function validateMissionCatalog(
  catalog: readonly MissionDefinition[] = PERSONAL_MISSION_CATALOG,
  expectedVersion: string = catalog[0]?.catalog_version ?? PERSONAL_MISSION_CATALOG_VERSION,
): void {
  const ids = new Set<number>();
  for (const mission of catalog) {
    if (!expectedVersion || mission.catalog_version !== expectedVersion) throw new Error(`Invalid catalog version in Mission ${mission.mission_id}`);
    if (!Number.isInteger(mission.mission_id) || mission.mission_id <= 0 || ids.has(mission.mission_id)) throw new Error(`Invalid/duplicate Mission ID ${mission.mission_id}`);
    ids.add(mission.mission_id);
    if (!supportedRules.has(mission.rule_definition.type)) throw new Error(`Unsupported Mission rule ${mission.rule_definition.type}`);
    if (!['easy', 'medium', 'hard', 'epic'].includes(mission.difficulty)) throw new Error(`Invalid Mission difficulty ${mission.mission_id}`);
    if (mission.repeat_interval_days !== null && mission.repeat_interval_days <= 0) throw new Error(`Invalid repeat interval ${mission.mission_id}`);
    if (mission.economy_restriction_level < 0 || mission.economy_restriction_level > 4) throw new Error(`Invalid restriction level ${mission.mission_id}`);
    for (const category of [...(mission.rule_definition.categories ?? []), ...Object.keys(mission.rule_definition.minimums ?? {})]) {
      if (!categories.has(category)) throw new Error(`Invalid category ${category} in Mission ${mission.mission_id}`);
    }
    if (calculateMissionReward({
      requiredEvents: mission.economy_required_events,
      timeWindowDays: mission.economy_time_window_days,
      streakDays: mission.economy_streak_days,
      restrictionLevel: mission.economy_restriction_level,
      repeatable: mission.repeat_interval_days !== null,
    }) !== mission.reward_credits) throw new Error(`Reward mismatch in Mission ${mission.mission_id}`);
  }
}

validateMissionCatalog();
