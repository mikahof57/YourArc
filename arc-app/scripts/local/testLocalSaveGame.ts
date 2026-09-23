import assert from 'node:assert/strict';
import { getInitialState } from '../../src/utils/storage';
import {
  ArcSaveRepository,
  createNewArcSaveGame,
  importLegacyArcState,
  type LegacyBrowserStorage,
} from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { ARC_CANONICAL_STAT_IDS, ARC_SAVEGAME_SCHEMA_VERSION } from '../../src/features/savegame/arcSaveGame';
import { validateArcSaveGame } from '../../src/features/savegame/arcSaveValidation';

class FakeLegacyStorage implements LegacyBrowserStorage {
  constructor(private readonly values: Record<string, string>) {}
  get length() { return Object.keys(this.values).length; }
  key(index: number) { return Object.keys(this.values)[index] ?? null; }
  getItem(key: string) { return this.values[key] ?? null; }
}

const newSave = createNewArcSaveGame('en');
assert.equal(newSave.schemaVersion, ARC_SAVEGAME_SCHEMA_VERSION);
assert.ok(newSave.saveId.startsWith('arc-save-'));
assert.ok(newSave.character.characterId.startsWith('arc-character-'));
assert.deepEqual(Object.keys(newSave.progression.canonicalStats), [...ARC_CANONICAL_STAT_IDS]);
assert.equal(validateArcSaveGame(newSave).valid, true);

const storage = new MemoryArcSaveStorage();
const repository = new ArcSaveRepository(storage);
const initialized = await repository.initialize({ language: 'en' });
const reloadedRepository = new ArcSaveRepository(storage);
const reloaded = await reloadedRepository.initialize({ language: 'de' });
assert.equal(initialized.source, 'new');
assert.equal(reloaded.source, 'existing');
assert.equal(reloaded.save.saveId, initialized.save.saveId, 'saveId must persist across repository instances');

const saved = await repository.save({ ...initialized.save, economy: {
  ...initialized.save.economy,
  credits: 17,
  transactions: [...initialized.save.economy.transactions, {
    id: 'tx-test-opening-adjustment', type: 'test', source: 'test', amount: -83,
    balanceBefore: 100, balanceAfter: 17, referenceId: 'test:opening-adjustment',
    createdAt: new Date().toISOString(), metadata: {},
  }],
  processedReferenceIds: [...initialized.save.economy.processedReferenceIds, 'test:opening-adjustment'],
} });
assert.equal((await repository.load())?.economy.credits, 17);
assert.equal(saved.saveId, initialized.save.saveId);

const transacted = await repository.transaction((draft) => {
  draft.economy.credits += 5;
  draft.economy.transactions.push({
    id: 'tx-test-1', type: 'test', source: 'test', amount: 5, balanceBefore: 17, balanceAfter: 22,
    referenceId: 'test:1', createdAt: new Date().toISOString(), metadata: {},
  });
  draft.economy.processedReferenceIds.push('test:1');
});
assert.equal(transacted.economy.credits, 22);
assert.equal(transacted.economy.transactions.length, 3);

await assert.rejects(repository.transaction((draft) => {
  draft.economy.credits = -1;
}), /economy_invalid/);
assert.equal((await repository.load())?.economy.credits, 22, 'invalid transaction must not partially commit');

const duplicateStorage = new MemoryArcSaveStorage();
const duplicateRepository = new ArcSaveRepository(duplicateStorage);
const [firstInitialization, secondInitialization] = await Promise.all([
  duplicateRepository.initialize(), duplicateRepository.initialize(),
]);
assert.equal(firstInitialization.save.saveId, secondInitialization.save.saveId);
assert.equal((await duplicateStorage.keys('save:')).length, 1, 'duplicate initialization must create one primary save');

const legacyState = getInitialState();
legacyState.profile.name = 'Legacy Operative';
legacyState.profile.age = 31;
legacyState.credits = 42;
legacyState.level = 4;
legacyState.lifetimeXp = 900;
const legacyIdentity = 'legacy-user-1';
const legacyStorage = new FakeLegacyStorage({
  arc_app_system_state_v1: JSON.stringify(legacyState),
  [`arc_secondary_state_v1:${legacyIdentity}`]: JSON.stringify({ profile: { weight: 82, height: 184 } }),
  [`arc_personal_missions_v1:${legacyIdentity}`]: JSON.stringify({
    version: 1, identity: legacyIdentity, runs: [], events: [], rewardClaims: [], lastAuthoritativeCreditBalance: null,
  }),
  [`arc_achievements_v1:${legacyIdentity}`]: JSON.stringify({
    version: 1, userId: legacyIdentity, locallyUnlocked: [1], claims: [], snapshot: null,
  }),
});
const imported = importLegacyArcState(legacyStorage, 'de');
assert.ok(imported);
assert.equal(imported.profile.name, 'Legacy Operative');
assert.equal(imported.profile.age, 31);
assert.equal(imported.profile.weight, 82);
assert.equal(imported.economy.credits, 42);
assert.equal(imported.progression.level, 4);
assert.equal(imported.missions.identity, imported.saveId);
assert.equal(imported.achievements.userId, imported.saveId);
assert.deepEqual(imported.achievements.locallyUnlocked, [1]);
assert.equal(legacyStorage.getItem('arc_app_system_state_v1') !== null, true, 'legacy keys must not be deleted');

const migrationStorage = new MemoryArcSaveStorage();
const migrationRepository = new ArcSaveRepository(migrationStorage);
await migrationRepository.migrate({ schemaVersion: 0, saveId: 'arc-save-legacy', state: legacyState });
assert.equal((await migrationRepository.load())?.saveId, 'arc-save-legacy');
assert.equal((await migrationStorage.keys('backup:')).length, 1, 'migration must create a backup first');

const versionOneStorage = new MemoryArcSaveStorage();
const versionOne = structuredClone(newSave) as unknown as Record<string, any>;
versionOne.schemaVersion = 1;
delete versionOne.progression.statMeta;
delete versionOne.progression.events;
delete versionOne.progression.completedEventIds;
delete versionOne.progression.loginDays;
delete versionOne.progression.initializedAt;
delete versionOne.progression.lastProcessedArcDay;
await versionOneStorage.set('save:primary', versionOne);
const versionTwo = await new ArcSaveRepository(versionOneStorage).initialize();
assert.equal(versionTwo.save.schemaVersion, 6);
assert.ok(versionTwo.save.progression.statMeta.wissen);
assert.ok(versionTwo.save.localStateMeta.profileUpdatedAt);
assert.equal((await versionOneStorage.keys('backup:')).length, 1, 'v1 to current migration must back up first');

const recoveryStorage = new MemoryArcSaveStorage();
const recoveryRepository = new ArcSaveRepository(recoveryStorage);
const validBeforeCorruption = (await recoveryRepository.initialize()).save;
await recoveryRepository.backup('manual');
await recoveryStorage.set('save:primary', { corrupted: true });
const recovered = await new ArcSaveRepository(recoveryStorage).initialize();
assert.equal(recovered.source, 'recovered');
assert.equal(recovered.save.saveId, validBeforeCorruption.saveId);

const invalid = structuredClone(newSave);
invalid.progression.canonicalStats.wissen.value = 101;
assert.equal(validateArcSaveGame(invalid).valid, false);
await assert.rejects(repository.save(invalid), /canonical_stat_wissen_value_invalid/);

const newerStorage = new MemoryArcSaveStorage();
await newerStorage.set('save:primary', { schemaVersion: ARC_SAVEGAME_SCHEMA_VERSION + 1, saveId: 'future' });
await assert.rejects(new ArcSaveRepository(newerStorage).initialize(), /newer app version/);

console.log('ARC local savegame foundation tests passed.');
