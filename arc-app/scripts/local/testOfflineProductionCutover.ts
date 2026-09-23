import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LocalEconomyService } from '../../src/features/economy/localEconomyService';
import { LocalObjectivesService } from '../../src/features/objectives/localObjectivesService';
import { LocalProfileService } from '../../src/features/profile/localProfileService';
import { LocalGameService, projectSaveToAppState } from '../../src/features/runtime/localGameService';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { getInitialState } from '../../src/utils/storage';

const appSource = readFileSync(resolve('src/App.tsx'), 'utf8');
assert.doesNotMatch(appSource, /supabase|AuthModal|Register|ChatWindow|CommunityModal|paymentService|progressionService|missionService|achievementService/);
assert.match(appSource, /initializeLocalSaveFoundation/);
assert.match(appSource, /<AppHubPage/);
assert.doesNotMatch(appSource, /fetch\(|WebSocket|realtime/);

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('network access is forbidden in offline cutover test'); };
try {
  const storage = new MemoryArcSaveStorage();
  const repository = new ArcSaveRepository(storage);
  const initial = createNewArcSaveGame('en');
  await repository.save(initial);
  const game = new LocalGameService(repository);
  const profile = new LocalProfileService(repository);
  const economy = new LocalEconomyService(repository);
  const objectives = new LocalObjectivesService(repository);
  const now = new Date('2026-09-08T12:00:00.000Z');

  const created = await game.initializeCharacter({
    profile: { name: 'Offline Pilot', avatarUrl: '/skins/data-scholar.png', gender: 'd' },
    stats: [{ statId: 'wissen', startValue: 10 }, { statId: 'geld', startValue: 0 }],
    timezone: 'UTC', now,
  });
  assert.equal(created.profile.isCreated, true);
  assert.equal(created.progression.canonicalStats.geld.value, 0);
  assert.equal(created.missions.events.filter((event) => event.type === 'LOGIN_DAY').length, 1);
  assert.ok(created.progression.assignments.length >= 2);

  const assignment = created.progression.assignments.find((item) => item.stat_id === 'wissen')!;
  const completed = await game.completeAssignment(assignment.assignment_id, null, now);
  assert.equal(completed.completion.confirmed, true);
  assert.equal(completed.save.progression.canonicalStats.wissen.value, 12);
  assert.ok(completed.save.progression.lifetimeXp > 0);
  const retry = await game.completeAssignment(assignment.assignment_id, null, now);
  assert.equal(retry.save.progression.events.filter((event) => event.assignmentId === assignment.assignment_id).length, 1);

  const updated = await profile.updateLocalProfile({ name: 'Offline Commander', age: 30, weight: 75, height: 180 });
  assert.equal(updated.profile.name, 'Offline Commander');
  await profile.updateSettings({ language: 'de', selectedDesignColors: ['#06b6d4'] });
  const calendar = structuredClone((await repository.load())!.calendar);
  calendar.privateEvents.push({ id: 'offline-event', title: 'Offline', date: '2026-09-09', time: '10:00', type: 'appointment' });
  await profile.updateCalendar(calendar);
  const routine = structuredClone((await repository.load())!.weeklyRoutine);
  routine[1] = [{ id: 'offline-routine', text: 'Routine' }];
  await profile.updateWeeklyRoutine(routine);

  const bought = await game.purchaseAndEquip('data-scholar');
  assert.ok(bought.economy.inventoryItemIds.includes('data-scholar'));
  assert.equal(bought.economy.equippedSkinId, 'data-scholar');
  const wheel = await game.claimWheel('2026-09-08', 0.2);
  assert.equal(wheel.result.reward, 5);
  await assert.rejects(() => game.claimWheel('2026-09-08', 0.2), /already_claimed/);

  await objectives.activateMission(2, { arcDay: '2026-09-08', occurredAt: now.toISOString() });
  const nextSave = (await repository.load())!;
  const nextAssignment = nextSave.progression.assignments.find((item) => item.stat_id === 'geld')!;
  await game.completeAssignment(nextAssignment.assignment_id, null, now);
  const persisted = (await new ArcSaveRepository(storage).load())!;
  assert.equal(persisted.saveId, initial.saveId);
  assert.equal(persisted.character.characterId, initial.character.characterId);
  assert.equal(persisted.profile.name, 'Offline Commander');
  assert.equal(persisted.settings.language, 'de');
  assert.equal(persisted.calendar.privateEvents.at(-1)?.id, 'offline-event');
  assert.equal(persisted.weeklyRoutine[1]?.at(-1)?.id, 'offline-routine');
  assert.equal(persisted.economy.wheel.lastClaimDate, '2026-09-08');
  assert.doesNotThrow(() => projectSaveToAppState(persisted, getInitialState()));
  assert.equal((await economy.load())?.saveId, initial.saveId);

  const priorCharacterId = persisted.character.characterId;
  const priorBalance = persisted.economy.credits;
  const reset = await game.resetCharacter();
  assert.notEqual(reset.character.characterId, priorCharacterId);
  assert.ok(reset.character.characterCode);
  assert.equal(reset.profile.characterCode, reset.character.characterCode);
  assert.equal(reset.progression.initializedAt, null);
  assert.equal(reset.economy.credits, priorBalance);
  assert.ok(reset.economy.inventoryItemIds.includes('data-scholar'));
  await game.initializeCharacter({
    profile: { name: 'Second Offline Pilot', avatarUrl: '/skins/data-scholar.png', gender: 'm' },
    stats: [{ statId: 'wissen', startValue: 0 }], timezone: 'UTC', now,
  });
  assert.equal((await repository.load())?.profile.name, 'Second Offline Pilot');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('ARC offline production cutover tests passed without network or Supabase.');
