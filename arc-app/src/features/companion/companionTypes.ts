import type { ArcCanonicalStatId } from '../savegame/arcSaveGame';

export const ARC_COMPANION_EVENT_SCHEMA_VERSION = 1 as const;
export const ARC_COMPANION_HANDSHAKE_SCHEMA_VERSION = 1 as const;

export type ArcCompanionEventType = 'activity_completed' | 'milestone_completed' | 'daily_goal_completed';
export type ArcCompanionAuditStatus = 'accepted';

export interface ArcCompanionEventEnvelope {
  source_app: string;
  event_type: ArcCompanionEventType;
  activity_id: string;
  event_id: string;
  timestamp: string;
  reward_stat: ArcCanonicalStatId;
  reward_points: number;
  reward_xp?: number;
  schema_version: typeof ARC_COMPANION_EVENT_SCHEMA_VERSION;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ArcCompanionHandshake {
  appId: string;
  protocolVersion: typeof ARC_COMPANION_HANDSHAKE_SCHEMA_VERSION;
  appVersion: string;
  handshakeId: string;
  timestamp: string;
}

export interface ArcCompanionAppState {
  appId: string;
  installed: boolean;
  connected: boolean;
  lastHandshakeAt: string | null;
  lastEventAt: string | null;
  lastProcessedEventId: string | null;
  bridgeSchemaVersion: typeof ARC_COMPANION_EVENT_SCHEMA_VERSION;
}

export interface ArcCompanionDailyUsage {
  appId: string;
  arcDay: string;
  statPoints: number;
  xp: number;
}

export interface ArcCompanionAuditEntry {
  eventId: string;
  sourceApp: string;
  eventType: ArcCompanionEventType;
  activityId: string;
  receivedAt: string;
  eventTimestamp: string;
  rewardStat: ArcCanonicalStatId;
  requestedRewardPoints: number;
  appliedRewardPoints: number;
  requestedRewardXp: number;
  appliedRewardXp: number;
  status: ArcCompanionAuditStatus;
  schemaVersion: typeof ARC_COMPANION_EVENT_SCHEMA_VERSION;
}

export interface ArcCompanionBridgeState {
  schemaVersion: typeof ARC_COMPANION_EVENT_SCHEMA_VERSION;
  apps: ArcCompanionAppState[];
  processedEventIds: string[];
  dailyUsage: ArcCompanionDailyUsage[];
  auditLog: ArcCompanionAuditEntry[];
}

export type ArcCompanionRejectionReason =
  | 'invalid_envelope'
  | 'unsupported_schema_version'
  | 'unknown_source_app'
  | 'unsupported_event_type'
  | 'invalid_event_id'
  | 'invalid_activity_id'
  | 'invalid_timestamp'
  | 'invalid_reward_stat'
  | 'source_stat_mismatch'
  | 'invalid_reward_points'
  | 'invalid_reward_xp'
  | 'reward_points_exceeds_event_limit'
  | 'reward_xp_exceeds_event_limit'
  | 'invalid_metadata'
  | 'event_timestamp_in_future'
  | 'progress_not_initialized'
  | 'reward_stat_inactive'
  | 'duplicate_event'
  | 'daily_stat_limit_exceeded'
  | 'daily_xp_limit_exceeded'
  | 'processed_event_capacity_reached';

export type ArcCompanionProcessResult =
  | {
    accepted: true;
    eventId: string;
    appliedStatPoints: number;
    appliedXp: number;
    statValue: number;
    lifetimeXp: number;
    level: number;
  }
  | { accepted: false; eventId: string | null; reason: ArcCompanionRejectionReason };

export type ArcCompanionValidationResult =
  | { valid: true; event: ArcCompanionEventEnvelope }
  | { valid: false; eventId: string | null; reason: ArcCompanionRejectionReason };
