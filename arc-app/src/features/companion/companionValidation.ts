import { ARC_CANONICAL_STAT_IDS } from '../savegame/arcSaveGame';
import { ARC_COMPANION_REWARD_POLICY, ARC_COMPANION_SOURCE_STAT_MAP } from './companionPolicy';
import {
  ARC_COMPANION_EVENT_SCHEMA_VERSION,
  ARC_COMPANION_HANDSHAKE_SCHEMA_VERSION,
  type ArcCompanionEventEnvelope,
  type ArcCompanionHandshake,
  type ArcCompanionRejectionReason,
  type ArcCompanionValidationResult,
} from './companionTypes';

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmptyId = (value: unknown, maximum = 160): value is string => typeof value === 'string'
  && value === value.trim() && value.length > 0 && value.length <= maximum;
const validTimestamp = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value));

function reject(value: unknown, reason: ArcCompanionRejectionReason): ArcCompanionValidationResult {
  return { valid: false, eventId: isRecord(value) && typeof value.event_id === 'string' ? value.event_id : null, reason };
}

function validMetadata(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value) || Object.keys(value).length > ARC_COMPANION_REWARD_POLICY.maxMetadataKeys) return false;
  return Object.entries(value).every(([key, item]) => key.length > 0
    && key.length <= ARC_COMPANION_REWARD_POLICY.maxMetadataKeyLength
    && (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))
      || (typeof item === 'string' && item.length <= ARC_COMPANION_REWARD_POLICY.maxMetadataStringLength)));
}

export function validateCompanionEvent(value: unknown, now = new Date()): ArcCompanionValidationResult {
  if (!isRecord(value)) return reject(value, 'invalid_envelope');
  const allowedKeys = new Set(['source_app','event_type','activity_id','event_id','timestamp','reward_stat','reward_points','reward_xp','schema_version','metadata']);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return reject(value, 'invalid_envelope');
  if (value.schema_version !== ARC_COMPANION_EVENT_SCHEMA_VERSION) return reject(value, 'unsupported_schema_version');
  if (!ARC_COMPANION_SOURCE_STAT_MAP.has(String(value.source_app))) return reject(value, 'unknown_source_app');
  if (!ARC_COMPANION_REWARD_POLICY.supportedEventTypes.includes(value.event_type as never)) return reject(value, 'unsupported_event_type');
  if (!nonEmptyId(value.event_id)) return reject(value, 'invalid_event_id');
  if (!nonEmptyId(value.activity_id)) return reject(value, 'invalid_activity_id');
  if (!validTimestamp(value.timestamp)) return reject(value, 'invalid_timestamp');
  if (Date.parse(value.timestamp) > now.getTime() + ARC_COMPANION_REWARD_POLICY.maxFutureClockSkewMs) return reject(value, 'event_timestamp_in_future');
  if (!ARC_CANONICAL_STAT_IDS.includes(value.reward_stat as never)) return reject(value, 'invalid_reward_stat');
  if (ARC_COMPANION_SOURCE_STAT_MAP.get(String(value.source_app)) !== value.reward_stat) return reject(value, 'source_stat_mismatch');
  if (!Number.isSafeInteger(value.reward_points) || Number(value.reward_points) < 0) return reject(value, 'invalid_reward_points');
  if (Number(value.reward_points) > ARC_COMPANION_REWARD_POLICY.maxStatPointsPerEvent) return reject(value, 'reward_points_exceeds_event_limit');
  if (value.reward_xp !== undefined && (!Number.isSafeInteger(value.reward_xp) || Number(value.reward_xp) < 0)) return reject(value, 'invalid_reward_xp');
  if (Number(value.reward_xp ?? 0) > ARC_COMPANION_REWARD_POLICY.maxXpPerEvent) return reject(value, 'reward_xp_exceeds_event_limit');
  if (!validMetadata(value.metadata)) return reject(value, 'invalid_metadata');
  return { valid: true, event: structuredClone(value) as unknown as ArcCompanionEventEnvelope };
}

export type ArcCompanionHandshakeValidationResult =
  | { valid: true; handshake: ArcCompanionHandshake }
  | { valid: false; reason: 'invalid_handshake' | 'unknown_source_app' | 'unsupported_schema_version' };

export function validateCompanionHandshake(value: unknown): ArcCompanionHandshakeValidationResult {
  if (!isRecord(value) || !nonEmptyId(value.appId) || !nonEmptyId(value.appVersion, 80)
    || !nonEmptyId(value.handshakeId) || !validTimestamp(value.timestamp)) return { valid: false, reason: 'invalid_handshake' };
  if (!ARC_COMPANION_SOURCE_STAT_MAP.has(value.appId)) return { valid: false, reason: 'unknown_source_app' };
  if (value.protocolVersion !== ARC_COMPANION_HANDSHAKE_SCHEMA_VERSION) return { valid: false, reason: 'unsupported_schema_version' };
  return { valid: true, handshake: structuredClone(value) as unknown as ArcCompanionHandshake };
}
