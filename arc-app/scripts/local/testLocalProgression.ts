import assert from 'node:assert/strict';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { LocalProgressionService } from '../../src/features/progression/localProgressionService';
import {
  addXp, applyDecay, arcLevelFromLifetimeXp, arcOfficialTaskXp, arcXpThresholdForLevel,
  completeAssignment, createCustomAttribute, createCustomTask, initializeArcDay,
  initializeCharacter, resetCharacterProgression, updateCustomAttribute, updateCustomTask, updateStat,
} from '../../src/features/progression/localProgressionDomain';

const time = (day: string) => new Date(`${day}T12:00:00.000Z`);
const character = {
  profile: { name: 'Offline Test', avatarUrl: 'local-avatar', gender: 'd' as const },
  stats: [{ statId: 'wissen' as const, startValue: 0 }, { statId: 'muskeln' as const, startValue: 99 }],
  timezone: 'UTC', now: time('2026-09-08'),
};

{
  const save = createNewArcSaveGame(); initializeCharacter(save, character);
  assert.equal(save.progression.canonicalStats.wissen.value, 0);
  assert.equal(save.progression.canonicalStats.muskeln.value, 99);
  assert.equal(save.progression.assignments.filter((a) => a.arc_day === '2026-09-08').length, 2);
  assert.throws(() => initializeCharacter(save, character), /already_initialized/);
  const assignment = save.progression.assignments.find((a) => a.stat_id === 'wissen')!;
  const result = completeAssignment(save, assignment.assignment_id, null, time('2026-09-08'));
  assert.equal(result.stat_after, 2); assert.equal(result.xp_gained, arcOfficialTaskXp(assignment.tier));
  assert.equal(completeAssignment(save, assignment.assignment_id).idempotent_retry, true);
  assert.equal(save.progression.events.filter((e) => e.eventType === 'TASK_COMPLETION').length, 1);
  initializeArcDay(save, time('2026-09-08'));
  assert.equal(save.progression.assignments.filter((a) => a.arc_day === '2026-09-08').length, 2);
  initializeArcDay(save, time('2026-09-09'));
  assert.equal(save.progression.canonicalStats.wissen.value, 2);
  assert.equal(save.progression.canonicalStats.muskeln.value, 98);
  assert.equal(save.progression.loginStreak, 2);
  initializeArcDay(save, time('2026-09-11')); assert.equal(save.progression.loginStreak, 1);
  updateStat(save, 'wissen', 100); updateStat(save, 'wissen', 10);
  assert.equal(save.progression.canonicalStats.wissen.value, 100);
  applyDecay(save, '2026-09-11', '2026-09-12'); assert.equal(save.progression.canonicalStats.wissen.value, 100);
  const priorMuscleAssignment = save.progression.assignments.find((a) => a.arc_day === '2026-09-11' && a.stat_id === 'muskeln')!;
  priorMuscleAssignment.completed_at = time('2026-09-11').toISOString();
  save.progression.statMeta.muskeln.physicalTrainingCycle = 6;
  save.progression.lastProcessedArcDay = '2026-09-11'; initializeArcDay(save, time('2026-09-12'));
  const rest = save.progression.assignments.find((a) => a.arc_day === '2026-09-12' && a.stat_id === 'muskeln')!;
  assert.equal(rest.assignment_kind, 'restday');
  assert.throws(() => completeAssignment(save, rest.assignment_id), /restday_choice_invalid/);
  completeAssignment(save, rest.assignment_id, 'sauna', time('2026-09-12'));
  assert.equal(save.progression.statMeta.muskeln.physicalTrainingCycle, 0);
}

{
  assert.equal(arcXpThresholdForLevel(1), 0); assert.equal(arcXpThresholdForLevel(2), 100);
  assert.equal(arcLevelFromLifetimeXp(99), 1); assert.equal(arcLevelFromLifetimeXp(100), 2);
  const save = createNewArcSaveGame(); addXp(save, 100);
  assert.equal(save.progression.level, 2); assert.equal(save.progression.currentLevelXp, 0);
}

{
  const save = createNewArcSaveGame(); initializeCharacter(save, character);
  const statId = createCustomAttribute(save, { displayName: 'Focus', emoji: '🎯', taskTitle: 'Focus once', taskSelectionMode: 'sequential' });
  updateCustomAttribute(save, statId, { name: 'Deep Focus', emoji: '🧠' });
  const taskId = createCustomTask(save, statId, { title: 'Focus twice', description: 'Two blocks' });
  updateCustomTask(save, statId, taskId, { title: 'Focus deeply', order: 3 });
  assert.equal(save.progression.customAttributes[0].name, 'Deep Focus');
  assert.equal(save.progression.customTasks[statId].find((task) => task.id === taskId)?.title, 'Focus deeply');
  assert.throws(() => updateStat(save, statId, Number.NaN), /stat_value_invalid/);
  save.economy.credits = 44; resetCharacterProgression(save);
  assert.equal(save.progression.initializedAt, null); assert.equal(save.economy.credits, 44);
}

{
  const storage = new MemoryArcSaveStorage(); const repository = new ArcSaveRepository(storage);
  await repository.save(createNewArcSaveGame()); const service = new LocalProgressionService(repository);
  await service.initializeCharacter(character); const before = await repository.load();
  await assert.rejects(() => service.createCustomAttribute({ displayName: '', emoji: 'x', taskTitle: 'x' }));
  assert.deepEqual(await repository.load(), before);
  const created = await service.createCustomAttribute({ displayName: 'Local', emoji: 'L', taskTitle: 'Persist me' });
  const task = await service.createCustomTask(created.statId, { title: 'Second' });
  await service.updateCustomTask(created.statId, task.taskId, { title: 'Persisted edit' });
  const reloaded = await new ArcSaveRepository(storage).load();
  assert.equal(reloaded?.progression.customTasks[created.statId].find((item) => item.id === task.taskId)?.title, 'Persisted edit');
}

console.log('ARC local progression parity tests passed.');
