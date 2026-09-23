import type { MissionDefinition, MissionEconomy } from './missionTypes';

export const MISSION_REWARD_FORMULA_VERSION = 'ARC_MISSION_REWARD_V1' as const;

export function calculateMissionReward(
  input: MissionEconomy & { repeatable: boolean },
): number {
  const { requiredEvents: a, timeWindowDays: t, streakDays: s, restrictionLevel: k, repeatable } = input;
  if (!Number.isInteger(a) || a <= 0 || a > 1_000_000) throw new Error('Invalid Mission event requirement');
  if (t !== null && (!Number.isInteger(t) || t <= 0 || t > 100_000)) throw new Error('Invalid Mission time window');
  if (!Number.isInteger(s) || s < 0 || s > 100_000) throw new Error('Invalid Mission streak');
  if (!Number.isInteger(k) || k < 0 || k > 4) throw new Error('Invalid Mission restriction level');

  const fz = t === null ? 1 : 1 + 0.18 * Math.log(1 + a / t);
  const fs = s === 0 ? 1 : Math.min(2.4, 1 + 0.5 * Math.log(1 + s / 3));
  const fk = 1 + 0.08 * k;
  const fm = repeatable ? 0.8 : 1.25;
  const fp = repeatable ? 0.85 : 1;
  const raw = 2.4 * Math.pow(a, 0.78) * fz * fs * fk * fm * fp;
  if (!Number.isFinite(raw)) throw new Error('Mission reward is not finite');
  return Math.max(5, Math.floor(raw / 5 + 0.5) * 5);
}

export function calculateDefinitionReward(definition: Pick<MissionDefinition,
  'economy_required_events' | 'economy_time_window_days' | 'economy_streak_days' |
  'economy_restriction_level' | 'repeat_interval_days'>): number {
  return calculateMissionReward({
    requiredEvents: definition.economy_required_events,
    timeWindowDays: definition.economy_time_window_days,
    streakDays: definition.economy_streak_days,
    restrictionLevel: definition.economy_restriction_level,
    repeatable: definition.repeat_interval_days !== null,
  });
}
