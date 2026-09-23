import { addXp, snapshotProgressionDay, updateStat } from '../progression/localProgressionDomain';
import type { ArcSaveGame } from '../savegame/arcSaveGame';
import { ARC_COMPANION_REWARD_POLICY } from './companionPolicy';
import type {
  ArcCompanionEventEnvelope,
  ArcCompanionProcessResult,
  ArcCompanionRejectionReason,
} from './companionTypes';

export class ArcCompanionEventRejected extends Error {
  constructor(public readonly reason: ArcCompanionRejectionReason, public readonly eventId: string) {
    super(`arc_companion_event_rejected:${reason}`);
  }
}

function reject(event: ArcCompanionEventEnvelope, reason: ArcCompanionRejectionReason): never {
  throw new ArcCompanionEventRejected(reason, event.event_id);
}

function arcDayAt(timestamp: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(timestamp);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  } catch {
    throw new Error('arc_companion_timezone_invalid');
  }
}

function pruneDailyUsage(save: ArcSaveGame, receivedDay: string): void {
  const threshold = new Date(`${receivedDay}T00:00:00.000Z`);
  threshold.setUTCDate(threshold.getUTCDate() - ARC_COMPANION_REWARD_POLICY.dailyUsageRetentionDays);
  const oldest = threshold.toISOString().slice(0, 10);
  save.companions.dailyUsage = save.companions.dailyUsage.filter((usage) => usage.arcDay >= oldest);
}

export function applyCompanionEvent(
  save: ArcSaveGame,
  event: ArcCompanionEventEnvelope,
  receivedAt: Date,
): Extract<ArcCompanionProcessResult, { accepted: true }> {
  if (!save.progression.initializedAt) reject(event, 'progress_not_initialized');
  if (save.companions.processedEventIds.includes(event.event_id)) reject(event, 'duplicate_event');
  if (save.companions.processedEventIds.length >= ARC_COMPANION_REWARD_POLICY.maxProcessedEventIds) {
    reject(event, 'processed_event_capacity_reached');
  }
  const meta = save.progression.statMeta[event.reward_stat];
  if (!meta?.active) reject(event, 'reward_stat_inactive');

  const receivedDay = arcDayAt(receivedAt, save.progression.timezone);
  const usage = save.companions.dailyUsage.find((item) => item.appId === event.source_app && item.arcDay === receivedDay);
  const usedStatPoints = usage?.statPoints ?? 0;
  const usedXp = usage?.xp ?? 0;
  if (usedStatPoints + event.reward_points > ARC_COMPANION_REWARD_POLICY.maxStatPointsPerAppPerDay) {
    reject(event, 'daily_stat_limit_exceeded');
  }
  const requestedXp = event.reward_xp ?? 0;
  if (usedXp + requestedXp > ARC_COMPANION_REWARD_POLICY.maxXpPerAppPerDay) reject(event, 'daily_xp_limit_exceeded');

  const stat = save.progression.canonicalStats[event.reward_stat];
  const valueBefore = stat.value;
  const oldLevel = save.progression.level;
  const statValue = updateStat(save, event.reward_stat, valueBefore + event.reward_points);
  const appliedStatPoints = statValue - valueBefore;
  addXp(save, requestedXp);

  const progressionEventId = `companion:${event.event_id}`;
  save.progression.events.push({
    eventId: progressionEventId,
    eventType: 'COMPANION_REWARD',
    arcDay: receivedDay,
    statId: event.reward_stat,
    assignmentId: null,
    delta: appliedStatPoints,
    valueBefore,
    valueAfter: statValue,
    xpGained: requestedXp,
    createdAt: receivedAt.toISOString(),
    metadata: {
      source: 'local_companion_bridge', sourceApp: event.source_app, eventId: event.event_id,
      activityId: event.activity_id, companionEventType: event.event_type,
      eventTimestamp: event.timestamp, oldLevel, newLevel: save.progression.level,
      ...(event.metadata ? { companionMetadata: structuredClone(event.metadata) } : {}),
    },
  });
  save.progression.completedEventIds.push(progressionEventId);
  save.companions.processedEventIds.push(event.event_id);

  if (usage) {
    usage.statPoints += event.reward_points;
    usage.xp += requestedXp;
  } else {
    save.companions.dailyUsage.push({ appId: event.source_app, arcDay: receivedDay, statPoints: event.reward_points, xp: requestedXp });
  }
  pruneDailyUsage(save, receivedDay);

  const appState = save.companions.apps.find((item) => item.appId === event.source_app);
  if (!appState) throw new Error('arc_companion_state_missing');
  appState.lastEventAt = receivedAt.toISOString();
  appState.lastProcessedEventId = event.event_id;

  save.companions.auditLog.push({
    eventId: event.event_id,
    sourceApp: event.source_app,
    eventType: event.event_type,
    activityId: event.activity_id,
    receivedAt: receivedAt.toISOString(),
    eventTimestamp: event.timestamp,
    rewardStat: event.reward_stat,
    requestedRewardPoints: event.reward_points,
    appliedRewardPoints: appliedStatPoints,
    requestedRewardXp: requestedXp,
    appliedRewardXp: requestedXp,
    status: 'accepted',
    schemaVersion: event.schema_version,
  });
  if (save.companions.auditLog.length > ARC_COMPANION_REWARD_POLICY.maxAuditEntries) {
    save.companions.auditLog.splice(0, save.companions.auditLog.length - ARC_COMPANION_REWARD_POLICY.maxAuditEntries);
  }
  if (save.progression.arcDay === receivedDay) snapshotProgressionDay(save, receivedDay);

  return {
    accepted: true,
    eventId: event.event_id,
    appliedStatPoints,
    appliedXp: requestedXp,
    statValue,
    lifetimeXp: save.progression.lifetimeXp,
    level: save.progression.level,
  };
}
