import assert from 'node:assert/strict';
import { ARC_COMPANION_APP_CATALOG } from '../../src/features/appHub/appHubCatalog';
import { ARC_COMPANION_REWARD_POLICY } from '../../src/features/companion/companionPolicy';
import { LocalCompanionBridgeService } from '../../src/features/companion/localCompanionBridgeService';
import type { ArcCompanionEventEnvelope } from '../../src/features/companion/companionTypes';
import { ARC_COMPANION_EVENT_SCHEMA_VERSION } from '../../src/features/companion/companionTypes';
import { arcXpThresholdForLevel } from '../../src/features/progression/localProgressionDomain';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';

const receivedAt = new Date('2026-09-09T12:00:00.000Z');
const eventFor = (index: number, overrides: Partial<ArcCompanionEventEnvelope> = {}): ArcCompanionEventEnvelope => {
  const app = ARC_COMPANION_APP_CATALOG[index];
  return {
    source_app: app.appId,
    event_type: 'activity_completed',
    activity_id: `activity-${index}`,
    event_id: `event-${index}`,
    timestamp: receivedAt.toISOString(),
    reward_stat: app.associatedStat,
    reward_points: 2,
    reward_xp: 10,
    schema_version: ARC_COMPANION_EVENT_SCHEMA_VERSION,
    metadata: { exercise: 'synthetic', sequence: index },
    ...overrides,
  };
};

async function setup() {
  const storage = new MemoryArcSaveStorage();
  const repository = new ArcSaveRepository(storage);
  const save = createNewArcSaveGame('en');
  save.progression.initializedAt = receivedAt.toISOString();
  save.progression.arcDay = '2026-09-09';
  save.progression.lastProcessedArcDay = '2026-09-09';
  await repository.save(save);
  return { storage, repository, service: new LocalCompanionBridgeService(repository) };
}

const all = await setup();
for (let index = 0; index < ARC_COMPANION_APP_CATALOG.length; index += 1) {
  const result = await all.service.processEvent(eventFor(index), receivedAt);
  assert.equal(result.accepted, true, `${ARC_COMPANION_APP_CATALOG[index].appId} event must be accepted`);
}
let persisted = (await all.repository.load())!;
assert.deepEqual(ARC_COMPANION_APP_CATALOG.map((app) => persisted.progression.canonicalStats[app.associatedStat].value), [3, 3, 3, 3, 3, 3]);
assert.equal(persisted.progression.events.filter((event) => event.eventType === 'COMPANION_REWARD').length, 6);
assert.equal(persisted.progression.assignments.length, 0);
assert.equal(persisted.progression.completedTasksToday.length, 0);
assert.equal(persisted.progression.dailySnapshots.find((snapshot) => snapshot.date === '2026-09-09')?.stats.geld, 3);
assert.equal(persisted.companions.auditLog.length, 6);
assert.deepEqual(persisted.companions.auditLog[0], {
  eventId: 'event-0', sourceApp: 'arc-companion-wissen', eventType: 'activity_completed', activityId: 'activity-0',
  receivedAt: receivedAt.toISOString(), eventTimestamp: receivedAt.toISOString(), rewardStat: 'wissen',
  requestedRewardPoints: 2, appliedRewardPoints: 2, requestedRewardXp: 10, appliedRewardXp: 10,
  status: 'accepted', schemaVersion: 1,
});

for (const [index, eventType] of (['activity_completed','milestone_completed','daily_goal_completed'] as const).entries()) {
  const supported = await setup();
  assert.equal((await supported.service.processEvent(eventFor(0, { event_id: `type-${index}`, event_type: eventType }), receivedAt)).accepted, true);
}

const invalidCases: Array<[Partial<ArcCompanionEventEnvelope>, string]> = [
  [{ source_app: 'unknown-app' }, 'unknown_source_app'],
  [{ reward_stat: undefined as never }, 'invalid_reward_stat'],
  [{ reward_stat: 'unknown-stat' as never }, 'invalid_reward_stat'],
  [{ reward_stat: 'muskeln' }, 'source_stat_mismatch'],
  [{ event_type: 'unknown' as ArcCompanionEventEnvelope['event_type'] }, 'unsupported_event_type'],
  [{ schema_version: 2 as 1 }, 'unsupported_schema_version'],
  [{ event_id: '' }, 'invalid_event_id'],
  [{ activity_id: '' }, 'invalid_activity_id'],
  [{ timestamp: 'not-a-timestamp' }, 'invalid_timestamp'],
  [{ reward_points: -1 }, 'invalid_reward_points'],
  [{ reward_points: ARC_COMPANION_REWARD_POLICY.maxStatPointsPerEvent + 1 }, 'reward_points_exceeds_event_limit'],
  [{ reward_xp: ARC_COMPANION_REWARD_POLICY.maxXpPerEvent + 1 }, 'reward_xp_exceeds_event_limit'],
  [{ metadata: { nested: { unsafe: true } } as never }, 'invalid_metadata'],
];
for (const [overrides, reason] of invalidCases) {
  const isolated = await setup();
  const before = await isolated.repository.load();
  const result = await isolated.service.processEvent(eventFor(0, overrides), receivedAt);
  assert.deepEqual(result, { accepted: false, eventId: typeof eventFor(0, overrides).event_id === 'string' ? eventFor(0, overrides).event_id : null, reason });
  assert.deepEqual(await isolated.repository.load(), before, `${reason} must not mutate the save`);
}

const replay = await setup();
const replayEvent = eventFor(0, { event_id: 'durable-replay-test', reward_points: 3, reward_xp: 100 });
const first = await replay.service.processEvent(replayEvent, receivedAt);
assert.equal(first.accepted, true);
assert.equal(first.accepted && first.level, 2);
assert.equal(arcXpThresholdForLevel(2), 100);
const firstSave = (await replay.repository.load())!;
const duplicate = await replay.service.processEvent(replayEvent, receivedAt);
assert.deepEqual(duplicate, { accepted: false, eventId: replayEvent.event_id, reason: 'duplicate_event' });
assert.deepEqual(await replay.repository.load(), firstSave, 'same-session replay changes nothing');
const reloadedService = new LocalCompanionBridgeService(new ArcSaveRepository(replay.storage));
assert.deepEqual(await reloadedService.processEvent(replayEvent, receivedAt), duplicate, 'replay remains blocked after repository reload');
assert.deepEqual(await replay.repository.load(), firstSave);
assert.deepEqual(await reloadedService.getProcessedEvent(replayEvent.event_id), {
  processed: true,
  audit: firstSave.companions.auditLog.find((entry) => entry.eventId === replayEvent.event_id)!,
});

const reconnect = await setup();
const reconnectEvent = eventFor(1, { event_id: 'reconnect-replay' });
assert.equal((await reconnect.service.processEvent(reconnectEvent, receivedAt)).accepted, true);
const reconnectHandshake = {
  appId: reconnectEvent.source_app, protocolVersion: 1, appVersion: '0.1.0',
  handshakeId: 'reconnect-handshake', timestamp: receivedAt.toISOString(),
};
await reconnect.service.markHandshake(reconnectHandshake);
await reconnect.service.disconnectCompanion(reconnectEvent.source_app);
await reconnect.service.markHandshake({ ...reconnectHandshake, handshakeId: 'reconnect-handshake-2' });
const afterReconnect = await reconnect.repository.load();
assert.deepEqual(await reconnect.service.processEvent(reconnectEvent, receivedAt), {
  accepted: false, eventId: reconnectEvent.event_id, reason: 'duplicate_event',
});
assert.deepEqual(await reconnect.repository.load(), afterReconnect, 'App Hub reconnect cannot reopen an event ID');

const permanent = await setup();
await permanent.repository.transaction((save) => { save.progression.canonicalStats.wissen.value = 98; });
const reachesMax = await permanent.service.processEvent(eventFor(0, { event_id: 'reaches-max', reward_points: 5, reward_xp: 0 }), receivedAt);
assert.equal(reachesMax.accepted && reachesMax.appliedStatPoints, 2);
assert.equal((await permanent.repository.load())!.progression.statMeta.wissen.maxValueLocked, true);
const locked = await permanent.service.processEvent(eventFor(0, { event_id: 'locked-max', reward_points: 5, reward_xp: 0 }), receivedAt);
assert.equal(locked.accepted && locked.appliedStatPoints, 0);
assert.equal((await permanent.repository.load())!.progression.canonicalStats.wissen.value, 100);

const inactive = await setup();
await inactive.repository.transaction((save) => { save.progression.statMeta.wissen.active = false; });
assert.deepEqual(await inactive.service.processEvent(eventFor(0), receivedAt), { accepted: false, eventId: 'event-0', reason: 'reward_stat_inactive' });

const ceiling = await setup();
for (let index = 0; index < 4; index += 1) {
  assert.equal((await ceiling.service.processEvent(eventFor(0, { event_id: `ceiling-${index}`, reward_points: 5, reward_xp: 100 }), receivedAt)).accepted, true);
}
assert.deepEqual(await ceiling.service.processEvent(eventFor(0, { event_id: 'ceiling-rejected', reward_points: 1, reward_xp: 0 }), receivedAt),
  { accepted: false, eventId: 'ceiling-rejected', reason: 'daily_stat_limit_exceeded' });

const xpCeiling = await setup();
for (let index = 0; index < 5; index += 1) {
  assert.equal((await xpCeiling.service.processEvent(eventFor(0, { event_id: `xp-ceiling-${index}`, reward_points: 0, reward_xp: 100 }), receivedAt)).accepted, true);
}
assert.deepEqual(await xpCeiling.service.processEvent(eventFor(0, { event_id: 'xp-ceiling-rejected', reward_points: 0, reward_xp: 1 }), receivedAt),
  { accepted: false, eventId: 'xp-ceiling-rejected', reason: 'daily_xp_limit_exceeded' });

const capacity = await setup();
await capacity.repository.transaction((save) => {
  save.companions.processedEventIds = Array.from({ length: ARC_COMPANION_REWARD_POLICY.maxProcessedEventIds }, (_, index) => `retained-${index}`);
});
assert.deepEqual(await capacity.service.processEvent(eventFor(0, { event_id: 'beyond-capacity' }), receivedAt), {
  accepted: false, eventId: 'beyond-capacity', reason: 'processed_event_capacity_reached',
});

const rollback = await setup();
await rollback.repository.transaction((save) => { save.progression.lifetimeXp = Number.MAX_SAFE_INTEGER; });
const rollbackBefore = await rollback.repository.load();
await assert.rejects(() => rollback.service.processEvent(eventFor(0, { event_id: 'overflow', reward_points: 2, reward_xp: 1 }), receivedAt), /arc_local_xp_invalid/);
assert.deepEqual(await rollback.repository.load(), rollbackBefore, 'unexpected domain failure rolls back stat, XP, replay marker and audit');

const handshake = await setup();
const handshakeEnvelope = {
  appId: ARC_COMPANION_APP_CATALOG[0].appId,
  protocolVersion: 1,
  appVersion: '0.1.0',
  handshakeId: 'handshake-1',
  timestamp: receivedAt.toISOString(),
};
const handshakeResult = await handshake.service.markHandshake(handshakeEnvelope);
assert.equal(handshakeResult.installed, true);
assert.equal(handshakeResult.connected, true);
assert.equal((await handshake.service.disconnectCompanion(handshakeResult.appId)).connected, false);
await assert.rejects(() => handshake.service.markHandshake({ ...handshakeEnvelope, protocolVersion: 2 }), /unsupported_schema_version/);

const migrationStorage = new MemoryArcSaveStorage();
const versionFive = createNewArcSaveGame();
const preserved = {
  profile: structuredClone(versionFive.profile), localStateMeta: structuredClone(versionFive.localStateMeta), character: structuredClone(versionFive.character),
  progression: structuredClone(versionFive.progression), economy: structuredClone(versionFive.economy),
  missions: structuredClone(versionFive.missions), achievements: structuredClone(versionFive.achievements), titles: structuredClone(versionFive.titles),
  objectives: structuredClone(versionFive.objectives), settings: structuredClone(versionFive.settings), calendar: structuredClone(versionFive.calendar),
  weeklyRoutine: structuredClone(versionFive.weeklyRoutine), ui: structuredClone(versionFive.ui), legacyImport: structuredClone(versionFive.legacyImport),
};
delete (versionFive as Partial<typeof versionFive>).companions;
(versionFive as unknown as { schemaVersion: number }).schemaVersion = 5;
await migrationStorage.set('save:primary', versionFive);
const migrated = await new ArcSaveRepository(migrationStorage).initialize();
assert.equal(migrated.save.schemaVersion, 6);
assert.equal(migrated.save.companions.apps.length, 6);
assert.ok(migrated.save.companions.apps.every((app) => !app.installed && !app.connected));
for (const [key, value] of Object.entries(preserved)) assert.deepEqual((migrated.save as unknown as Record<string, unknown>)[key], value, `${key} preserved by v5 migration`);
assert.equal((await migrationStorage.keys('backup:')).length, 1, 'v5 migration receives a raw backup');

console.log('ARC Companion bridge tests passed: six mappings, validation, reward limits, progression/XP, permanent max, replay, rollback, audit, handshake, v5→v6 preservation.');
