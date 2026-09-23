import assert from 'node:assert/strict';
import { ACHIEVEMENT_CATALOG, ARC_TITLE_CATALOG } from '../../src/features/achievements/achievementCatalog';
import { emptyAchievementSnapshot } from '../../src/features/achievements/achievementEngine';
import { PERSONAL_MISSION_CATALOG } from '../../src/features/missions/missionCatalog';
import { LocalObjectivesService } from '../../src/features/objectives/localObjectivesService';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { validateArcSaveGame } from '../../src/features/savegame/arcSaveValidation';

const day = '2026-09-08';
const occurredAt = `${day}T12:00:00.000Z`;
const event = (id: string) => ({
  eventId: id, type: 'DAILY_TASK_COMPLETED' as const, occurredAt, arcDay: day,
  category: 'wissen', taskId: `task-${id}`, assignmentId: `assignment-${id}`,
  taskSource: 'preset' as const, dailyTaskCatalogVersion: 'arc_tasks_v1',
  dailyTaskCatalogHash: 'test', presetTaskKey: `task-${id}`, customTaskId: null,
});

assert.equal(PERSONAL_MISSION_CATALOG.length, 80);
assert.equal(ACHIEVEMENT_CATALOG.length, 78);
assert.equal(ARC_TITLE_CATALOG.length, 13);

const storage = new MemoryArcSaveStorage();
const repository = new ArcSaveRepository(storage);
const initial = createNewArcSaveGame();
const saveId = initial.saveId;
const characterId = initial.character.characterId;
await repository.save(initial);
const service = new LocalObjectivesService(repository);

await service.activateMission(2, { arcDay: day, occurredAt });
await assert.rejects(() => service.activateMission(2, { arcDay: day, occurredAt }), /already_active/);
let save = (await repository.load())!;
assert.equal(save.missions.runs.length, 1);
assert.equal(save.missions.runs[0].user_id, saveId);
assert.ok(save.achievements.locallyUnlocked.includes(47), 'Mission activation achievement unlocks locally');
assert.equal(save.achievements.claims.find((claim) => claim.achievementId === 47)?.status, 'settled');
const balanceAfterActivationAchievement = save.economy.credits;

const first = await service.recordActivity(event('completion-1'));
assert.deepEqual(first.result.completedMissionRunIds, [save.missions.runs[0].run_id]);
save = first.save;
assert.equal(save.missions.runs[0].state, 'completed');
assert.equal(save.missions.rewardClaims.length, 1);
assert.equal(save.missions.rewardClaims[0].status, 'settled');
assert.equal(save.economy.credits, balanceAfterActivationAchievement + first.result.rewardCredits);
assert.ok(first.result.rewardCredits >= save.missions.runs[0].reward_credits_snapshot);
const ledgerLength = save.economy.transactions.length;
const balance = save.economy.credits;

const retry = await service.recordActivity(event('completion-1'));
assert.equal(retry.save.economy.credits, balance);
assert.equal(retry.save.economy.transactions.length, ledgerLength);
assert.equal(retry.save.missions.events.length, 1);
assert.deepEqual(retry.result.completedMissionRunIds, []);

await service.acknowledgeMission(save.missions.runs[0].run_id, occurredAt);
const reloaded = (await new ArcSaveRepository(storage).load())!;
assert.equal(reloaded.missions.runs[0].state, 'acknowledged');
assert.equal(reloaded.saveId, saveId); assert.equal(reloaded.character.characterId, characterId);
assert.equal(reloaded.objectives.saveId, saveId); assert.equal(reloaded.objectives.characterId, characterId);
assert.equal(validateArcSaveGame(reloaded).valid, true);

await repository.transaction((draft) => {
  const snapshot = structuredClone(draft.achievements.snapshot ?? emptyAchievementSnapshot());
  snapshot.dailyTotal = 5_000;
  draft.achievements.snapshot = snapshot;
});
await service.evaluateAchievements(occurredAt);
save = (await repository.load())!;
assert.ok(save.achievements.locallyUnlocked.includes(6));
assert.ok(save.titles.owned.some((title) => title.title_id === 'arc_veteran'));
const achievementBalance = save.economy.credits;
await service.evaluateAchievements(occurredAt);
assert.equal((await repository.load())!.economy.credits, achievementBalance, 'achievement rewards are idempotent');
await service.equipTitle('arc_veteran');
assert.equal((await repository.load())!.titles.equippedTitleId, 'arc_veteran');
await assert.rejects(() => service.equipTitle('not-owned'), /not_owned/);
assert.equal((await repository.load())!.titles.equippedTitleId, 'arc_veteran', 'invalid equip rolls back');
await service.equipTitle(null);
assert.equal((await repository.load())!.titles.equippedTitleId, null);

const rollbackBefore = await repository.load();
await assert.rejects(() => service.recordActivity({ ...event('invalid-reward'), eventId: '' }), /objectives_invalid|processedActivity/);
assert.deepEqual(await repository.load(), rollbackBefore, 'invalid objective mutation rolls back completely');

const cancelStorage = new MemoryArcSaveStorage();
const cancelRepository = new ArcSaveRepository(cancelStorage);
await cancelRepository.save(createNewArcSaveGame());
const cancelService = new LocalObjectivesService(cancelRepository);
await cancelService.activateMission(6, { arcDay: day, occurredAt });
const cancellable = (await cancelRepository.load())!.missions.runs[0];
await cancelService.cancelMission(cancellable.run_id, { arcDay: day, occurredAt });
assert.equal((await cancelRepository.load())!.missions.runs[0].state, 'cancelled');

const migrationStorage = new MemoryArcSaveStorage();
const versionFour = structuredClone(save) as unknown as Record<string, any>;
versionFour.schemaVersion = 4;
delete versionFour.objectives;
versionFour.missions.identity = 'legacy-account';
versionFour.missions.runs = versionFour.missions.runs.map((run: Record<string, unknown>) => ({ ...run, user_id: 'legacy-account' }));
versionFour.missions.events = versionFour.missions.events.map((activity: Record<string, unknown>) => ({ ...activity, identity: 'legacy-account' }));
versionFour.missions.rewardClaims = versionFour.missions.rewardClaims.map((claim: Record<string, unknown>) => ({ ...claim, userId: 'legacy-account' }));
versionFour.achievements.userId = 'legacy-account';
versionFour.achievements.claims = versionFour.achievements.claims.map((claim: Record<string, unknown>) => ({ ...claim, userId: 'legacy-account' }));
await migrationStorage.set('save:primary', versionFour);
const migrated = await new ArcSaveRepository(migrationStorage).initialize();
assert.equal(migrated.save.schemaVersion, 6);
assert.equal(migrated.save.objectives.saveId, saveId);
assert.equal(migrated.save.objectives.characterId, characterId);
assert.equal(migrated.save.missions.runs[0].user_id, saveId);
assert.equal(migrated.save.achievements.claims[0].userId, saveId);
assert.equal(migrated.save.economy.credits, save.economy.credits);
assert.deepEqual(migrated.save.progression, save.progression);
assert.equal((await migrationStorage.keys('backup:')).length, 1, 'v4 migration is backed up');

const repeated = new ArcSaveRepository(new MemoryArcSaveStorage());
const [firstInitialization, secondInitialization] = await Promise.all([repeated.initialize(), repeated.initialize()]);
assert.equal(firstInitialization.save.saveId, secondInitialization.save.saveId);
assert.equal(firstInitialization.save.character.characterId, secondInitialization.save.character.characterId);

console.log('ARC local objectives tests passed: missions, achievements, rewards, titles, identity, persistence, v4 migration.');
