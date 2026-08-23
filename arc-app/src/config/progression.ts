export const CANONICAL_STAT_KEYS = [
  'wissen',
  'muskeln',
  'geist',
  'beweglichkeit',
  'business',
  'geld',
] as const;

export type CanonicalStatKey = (typeof CANONICAL_STAT_KEYS)[number];

// Current gameplay parity. These values intentionally do not redesign progression.
export const STAT_MIN_VALUE = 0 as const;
export const STAT_MAX_VALUE = 100 as const;
export const STAT_NORMAL_DECAY_FLOOR = 1 as const;
export const TASK_COMPLETION_INCREMENT = 2 as const;
export const DAILY_DECAY_AMOUNT = 1 as const;

// The current UI enforces no maximum. Future server limits require a product decision.
export const MAX_ACTIVE_CUSTOM_STATS: number | null = null;
export const MAX_ACTIVE_CUSTOM_TASKS_PER_STAT: number | null = null;

export const ARC_PRESET_TASK_CATALOG_VERSION = 'arc_tasks_v1' as const;
