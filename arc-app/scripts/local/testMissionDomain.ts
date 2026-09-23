import assert from 'node:assert/strict';
import { PERSONAL_MISSION_CATALOG, serializeMissionCatalog, validateMissionCatalog } from '../../src/features/missions/missionCatalog';
import { calculateMissionReward } from '../../src/features/missions/missionRewardFormula';
import { calculateMissionProgress, canRepeatMission, evaluateMission } from '../../src/features/missions/missionEngine';
import type { ArcActivityEvent, MissionDefinition, MissionRun } from '../../src/features/missions/missionTypes';
import { ARC_CONTENT_MANIFEST, DAILY_TASK_CATALOG_HASH, MISSION_CATALOG_HASH } from '../../src/features/content/contentManifest';
import { sha256Hex } from '../../src/features/content/contentHash';
import { assertTrustedMissionRun, StaticTrustedContentRegistry } from '../../src/features/content/contentTrust';
import { createCanonicalPresetTaskCatalog, fingerprintCanonicalPresetTaskCatalog, validateCanonicalPresetTaskCatalog } from '../../src/utils/presetTaskCatalog';

validateMissionCatalog();
assert.equal(PERSONAL_MISSION_CATALOG.length, 80);
const missionV2 = { ...PERSONAL_MISSION_CATALOG[0], mission_id: 81, sort_order: 81, catalog_version: 'arc_personal_missions_v2' } as MissionDefinition;
validateMissionCatalog([missionV2]);
assert.equal(calculateMissionReward({ requiredEvents: 10, timeWindowDays: 7, streakDays: 0, restrictionLevel: 0, repeatable: false }), 20);
assert.equal(await sha256Hex(serializeMissionCatalog()), MISSION_CATALOG_HASH);
const dailyCatalog = createCanonicalPresetTaskCatalog();
assert.equal(dailyCatalog.length, 2190);
assert.deepEqual(validateCanonicalPresetTaskCatalog(dailyCatalog), []);
assert.equal(await fingerprintCanonicalPresetTaskCatalog(dailyCatalog), DAILY_TASK_CATALOG_HASH);

const identity = 'mission-domain-test';
const mission = PERSONAL_MISSION_CATALOG.find((item) => item.mission_id === 43)!;
const run: MissionRun = {
  run_id: 'streak', user_id: identity, mission_id: 43, catalog_version: mission.catalog_version,
  mission_catalog_hash_snapshot: 'test-catalog-hash',
  slot_index: 1, state: 'active', start_arc_day: '2026-01-01', activated_at: '2026-01-01T00:00:00.000Z',
  deadline_arc_day: '2026-01-14', reward_credits_snapshot: mission.reward_credits,
  reward_formula_version: mission.reward_formula_version, progress: { current: 0, target: 7, completed: false, details: {} },
  rule_snapshot: mission.rule_definition, repeat_interval_days_snapshot: mission.repeat_interval_days,
  completed_at: null, completed_arc_day: null, cancelled_at: null, acknowledged_at: null,
  cooldown_until_arc_day: null, reward_settlement_id: null, mission,
  trust_registration_status: 'pending', trust_registration_attempt_count: 0,
  trust_registration_last_error: null,
};
const categories = ['wissen', 'wissen', 'wissen', 'wissen', 'wissen', 'wissen', 'wissen'];
const events: ArcActivityEvent[] = categories.map((category, index) => ({
  eventId: `streak-${index}`, type: 'DAILY_TASK_COMPLETED', identity,
  occurredAt: `2026-01-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
  arcDay: `2026-01-${String(index + 1).padStart(2, '0')}`, category,
}));
events.push(...['muskeln', 'geist', 'geld'].map((category, index) => ({
  eventId: `outside-${index}`, type: 'DAILY_TASK_COMPLETED' as const, identity,
  occurredAt: `2026-01-${String(index + 10).padStart(2, '0')}T12:00:00.000Z`,
  arcDay: `2026-01-${String(index + 10).padStart(2, '0')}`, category,
})));
assert.equal(calculateMissionProgress(run.rule_snapshot, run, events).completed, false);

const deadlineMission = PERSONAL_MISSION_CATALOG.find((item) => item.mission_id === 51)!;
const deadlineRun: MissionRun = {
  ...run, run_id: 'deadline', mission_id: 51, mission: deadlineMission,
  rule_snapshot: deadlineMission.rule_definition, reward_credits_snapshot: deadlineMission.reward_credits,
  reward_formula_version: deadlineMission.reward_formula_version, repeat_interval_days_snapshot: deadlineMission.repeat_interval_days,
  deadline_arc_day: '2026-01-03', progress: { current: 0, target: 1, completed: false, details: {} },
};
const deadlineEvents: ArcActivityEvent[] = [0, 1, 2].map((index) => ({
  eventId: `deadline-${index}`, type: 'DAILY_TASK_COMPLETED', identity,
  occurredAt: `2026-01-03T12:0${index}:00.000Z`, arcDay: '2026-01-03', category: 'wissen',
}));
assert.equal(evaluateMission(deadlineRun, deadlineEvents, '2026-01-04').state, 'completed');
assert.equal(canRepeatMission(missionV2, [run], '2026-01-14'), true);

const trusted = new StaticTrustedContentRegistry([ARC_CONTENT_MANIFEST]);
await assert.doesNotReject(() => assertTrustedMissionRun({ ...run, mission_catalog_hash_snapshot: MISSION_CATALOG_HASH }, trusted));
await assert.rejects(
  () => assertTrustedMissionRun({ ...run, mission_catalog_hash_snapshot: '0'.repeat(64) }, trusted),
  /not trusted/i,
);
const customIdentity: ArcActivityEvent = {
  eventId: 'custom-identity', type: 'DAILY_TASK_COMPLETED', identity,
  occurredAt: '2026-01-14T12:00:00.000Z', arcDay: '2026-01-14', category: 'wissen',
  taskId: 'custom-task', assignmentId: 'assignment-custom', taskSource: 'custom',
  dailyTaskCatalogVersion: null, dailyTaskCatalogHash: null, presetTaskKey: null, customTaskId: 'custom-task',
};
assert.equal(customIdentity.dailyTaskCatalogVersion, null);

console.log('ARC content tests passed: missions=80, dailyTasks=2190, hashes deterministic, futureId=81, trust rejection, custom identity and engine');
