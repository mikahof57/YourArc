import assert from 'node:assert/strict';
import { LocalProfileService } from '../../src/features/profile/localProfileService';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { initializeCharacter } from '../../src/features/progression/localProgressionDomain';

const storage = new MemoryArcSaveStorage();
const repository = new ArcSaveRepository(storage);
const original = createNewArcSaveGame('de');
initializeCharacter(original, {
  profile: { name: 'Before', avatarUrl: 'before.png', gender: 'm' },
  stats: [{ statId: 'wissen', startValue: 37 }], timezone: 'UTC', now: new Date('2026-09-08T12:00:00Z'),
});
original.economy.credits = 77;
original.economy.transactions.push({ id: 'profile-test-adjustment', type: 'test', source: 'test', amount: -23,
  balanceBefore: 100, balanceAfter: 77, referenceId: 'profile-test-adjustment', createdAt: new Date().toISOString(), metadata: {} });
original.economy.processedReferenceIds.push('profile-test-adjustment');
original.economy.inventoryItemIds = ['skin-local'];
original.economy.inventory = [{ itemId: 'skin-local', itemType: 'skin', acquiredAt: new Date().toISOString(), source: 'test', referenceId: 'inventory:test', metadata: {} }];
await repository.save(original);
const service = new LocalProfileService(repository);
const saveId = original.saveId, characterId = original.character.characterId;
const progressionBefore = structuredClone(original.progression);

await service.updateLocalProfile({ name: 'Local Player', age: 30, weight: 80, height: 185, showAvatarFrame: false });
await service.updateAvatar('avatar-local.png', 'comic');
await service.updateGender('d');
await service.mirrorConfirmedProfile({ name: 'Local Player', avatarUrl: 'avatar-local.png', gender: 'd', characterCode: 'ARC-TEST-CODE' });
await service.updateProfileField('weight', 81);
await service.updateSettings({ language: 'en', activeBottomModules: ['motivation'], selectedDesignColors: ['#00ffff'] });
await service.updateCalendar({ privateEvents: [{ id: 'local-event', title: 'Local', date: '2026-09-09', type: 'appointment' }], activeCalendarId: 'private' });
await service.updateWeeklyRoutine({ 0: [{ id: 'routine-1', text: 'Train' }], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
await service.updateUiPreferences({ collapsedWindows: { calendar: true }, moduleReloadsCountToday: 2 });

const reloaded = await new ArcSaveRepository(storage).load();
assert.ok(reloaded);
assert.equal(reloaded.saveId, saveId); assert.equal(reloaded.character.characterId, characterId);
assert.equal(reloaded.profile.name, 'Local Player'); assert.equal(reloaded.profile.avatarUrl, 'avatar-local.png');
assert.equal(reloaded.profile.avatarCategory, 'comic'); assert.equal(reloaded.profile.gender, 'd');
assert.equal(reloaded.profile.characterCode, 'ARC-TEST-CODE'); assert.equal(reloaded.character.characterCode, 'ARC-TEST-CODE');
assert.equal(reloaded.profile.age, 30); assert.equal(reloaded.profile.weight, 81); assert.equal(reloaded.profile.height, 185);
assert.equal(reloaded.settings.language, 'en'); assert.deepEqual(reloaded.settings.activeBottomModules, ['motivation']);
assert.equal(reloaded.calendar.privateEvents[0].id, 'local-event'); assert.equal(reloaded.weeklyRoutine[0][0].id, 'routine-1');
assert.equal(reloaded.ui.collapsedWindows.calendar, true); assert.equal(reloaded.economy.credits, 77);
assert.deepEqual(reloaded.economy.inventoryItemIds, ['skin-local']);
assert.deepEqual(reloaded.progression, progressionBefore, 'profile/settings edits preserve Phase 2 progression');

const beforeInvalid = structuredClone(reloaded);
await assert.rejects(() => service.updateLocalProfile({ age: -1 }), /profile_age_invalid/);
await assert.rejects(() => service.updateSettings({ language: 'fr' as 'en' }), /settings_language_invalid/);
assert.deepEqual(await repository.load(), beforeInvalid, 'invalid edits roll back atomically');

const v2Storage = new MemoryArcSaveStorage();
const v2 = structuredClone(reloaded) as unknown as Record<string, any>;
v2.schemaVersion = 2; delete v2.localStateMeta;
await v2Storage.set('save:primary', v2);
const migrated = await new ArcSaveRepository(v2Storage).initialize();
assert.equal(migrated.save.schemaVersion, 6);
assert.equal(migrated.save.saveId, saveId); assert.equal(migrated.save.character.characterId, characterId);
assert.deepEqual(migrated.save.progression, progressionBefore);
assert.equal(migrated.save.economy.credits, 77);
assert.equal((await v2Storage.keys('backup:')).length, 1, 'v2 migration backed up before mutation');

const duplicateStorage = new MemoryArcSaveStorage(); const duplicate = new ArcSaveRepository(duplicateStorage);
const [a, b] = await Promise.all([duplicate.initialize(), duplicate.initialize()]);
assert.equal(a.save.saveId, b.save.saveId);

console.log('ARC local profile/settings tests passed.');
