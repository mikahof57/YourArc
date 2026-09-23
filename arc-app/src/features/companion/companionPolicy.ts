import { ARC_COMPANION_APP_CATALOG } from '../appHub/appHubCatalog';
import type { ArcCanonicalStatId } from '../savegame/arcSaveGame';
import {
  ARC_COMPANION_EVENT_SCHEMA_VERSION,
  type ArcCompanionBridgeState,
  type ArcCompanionEventType,
} from './companionTypes';

export const ARC_COMPANION_REWARD_POLICY = Object.freeze({
  schemaVersion: ARC_COMPANION_EVENT_SCHEMA_VERSION,
  supportedEventTypes: Object.freeze([
    'activity_completed',
    'milestone_completed',
    'daily_goal_completed',
  ] as const satisfies readonly ArcCompanionEventType[]),
  maxStatPointsPerEvent: 5,
  maxXpPerEvent: 100,
  maxStatPointsPerAppPerDay: 20,
  maxXpPerAppPerDay: 500,
  maxFutureClockSkewMs: 5 * 60 * 1000,
  maxProcessedEventIds: 10_000,
  maxAuditEntries: 1_000,
  dailyUsageRetentionDays: 90,
  maxMetadataKeys: 20,
  maxMetadataKeyLength: 64,
  maxMetadataStringLength: 500,
});

export const ARC_COMPANION_SOURCE_STAT_MAP: ReadonlyMap<string, ArcCanonicalStatId> = new Map(
  ARC_COMPANION_APP_CATALOG.map((app) => [app.appId, app.associatedStat]),
);

export function createEmptyCompanionBridgeState(): ArcCompanionBridgeState {
  return {
    schemaVersion: ARC_COMPANION_EVENT_SCHEMA_VERSION,
    apps: ARC_COMPANION_APP_CATALOG.map((app) => ({
      appId: app.appId,
      installed: false,
      connected: false,
      lastHandshakeAt: null,
      lastEventAt: null,
      lastProcessedEventId: null,
      bridgeSchemaVersion: ARC_COMPANION_EVENT_SCHEMA_VERSION,
    })),
    processedEventIds: [],
    dailyUsage: [],
    auditLog: [],
  };
}
