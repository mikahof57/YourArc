export const CANONICAL_STAT_KEYS = [
  'wissen',
  'muskeln',
  'geist',
  'beweglichkeit',
  'business',
  'geld',
] as const;

export type CanonicalStatKey = (typeof CANONICAL_STAT_KEYS)[number];

// Shared catalog/import bounds; active progression calculations are server-owned.
export const STAT_MIN_VALUE = 0 as const;
export const STAT_MAX_VALUE = 100 as const;

// The current UI enforces no maximum. Future server limits require a product decision.
export const MAX_ACTIVE_CUSTOM_STATS: number | null = null;
export const MAX_ACTIVE_CUSTOM_TASKS_PER_STAT: number | null = null;

export const ARC_PRESET_TASK_CATALOG_VERSION = 'arc_tasks_v1' as const;
