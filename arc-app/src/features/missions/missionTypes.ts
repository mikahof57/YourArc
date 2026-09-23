export const CANONICAL_MISSION_CATEGORIES = ['wissen', 'muskeln', 'geist', 'beweglichkeit', 'business', 'geld'] as const;
export type MissionCategory = typeof CANONICAL_MISSION_CATEGORIES[number];
export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'epic';
export type MissionRunState = 'active' | 'completed' | 'expired' | 'cancelled' | 'acknowledged';
export type MissionRewardSettlementStatus = 'not_applicable' | 'pending' | 'settling' | 'settled' | 'failed_retryable' | 'failed_terminal';
export type MissionTrustRegistrationStatus = 'pending' | 'registered' | 'failed_retryable' | 'failed_terminal';
export type ArcActivityEventType = 'DAILY_TASK_COMPLETED' | 'LOGIN_DAY' | 'CHARACTER_CREATED';

export interface MissionRuleDefinition {
  type: string;
  target?: number;
  active_days?: number;
  min_per_day?: number;
  window_days?: number;
  inactive_days?: number;
  diversity?: number;
  minimum?: number;
  categories?: readonly string[];
  minimums?: Readonly<Record<string, number>>;
  scope?: string;
  repeatable?: boolean;
}

export interface MissionEconomy {
  requiredEvents: number;
  timeWindowDays: number | null;
  streakDays: number;
  restrictionLevel: number;
}

export interface MissionDefinition {
  mission_id: number;
  catalog_version: string;
  title_de: string;
  title_en: string;
  objective_de: string;
  objective_en: string;
  difficulty: MissionDifficulty;
  reward_credits: number;
  economy_required_events: number;
  economy_time_window_days: number | null;
  economy_streak_days: number;
  economy_restriction_level: number;
  reward_formula_version: 'ARC_MISSION_REWARD_V1';
  repeat_interval_days: number | null;
  rule_definition: MissionRuleDefinition;
  enabled: boolean;
  sort_order: number;
}

export interface MissionProgress {
  current: number;
  target: number;
  completed: boolean;
  details: Record<string, unknown>;
}

export interface ArcActivityEvent {
  eventId: string;
  type: ArcActivityEventType;
  identity: string;
  occurredAt: string;
  arcDay: string;
  category?: string;
  taskId?: string;
  assignmentId?: string;
  taskSource?: 'preset' | 'custom' | 'special';
  dailyTaskCatalogVersion?: string | null;
  dailyTaskCatalogHash?: string | null;
  presetTaskKey?: string | null;
  customTaskId?: string | null;
}

export interface MissionRun {
  run_id: string;
  user_id: string;
  mission_id: number;
  catalog_version: string;
  mission_catalog_hash_snapshot: string;
  slot_index: number;
  state: MissionRunState;
  start_arc_day: string;
  activated_at: string;
  deadline_arc_day: string | null;
  reward_credits_snapshot: number;
  reward_formula_version: string;
  progress: MissionProgress;
  rule_snapshot: MissionRuleDefinition;
  repeat_interval_days_snapshot: number | null;
  completed_at: string | null;
  completed_arc_day: string | null;
  cancelled_at: string | null;
  acknowledged_at: string | null;
  cooldown_until_arc_day: string | null;
  reward_settlement_id: string | null;
  trust_registration_status: MissionTrustRegistrationStatus;
  trust_registration_attempt_count: number;
  trust_registration_last_error: string | null;
  mission: MissionDefinition;
}

export interface MissionRewardClaim {
  settlementId: string;
  missionRunId: string;
  userId: string;
  missionId: number;
  missionCatalogVersion: string;
  missionCatalogHash: string;
  rewardCreditsSnapshot: number;
  rewardFormulaVersion: string;
  completedAt: string;
  ruleSnapshotHash: string | null;
  status: MissionRewardSettlementStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  settledAt: string | null;
  serverTransactionId: string | null;
  authoritativeBalance: number | null;
}

export interface MissionRepositoryState {
  version: 1;
  identity: string;
  runs: MissionRun[];
  events: ArcActivityEvent[];
  rewardClaims: MissionRewardClaim[];
  lastAuthoritativeCreditBalance: number | null;
}

export interface PersonalMissionsPayload {
  arc_day: string;
  credit_balance: number | null;
  active_runs: MissionRun[];
  reward_claims: MissionRewardClaim[];
  available: MissionDefinition[];
  cooldowns: Array<{ mission_id: number; cooldown_until_arc_day: string }>;
  source: 'local';
  cloud_sync: 'not-configured' | 'unavailable' | 'synced';
}
