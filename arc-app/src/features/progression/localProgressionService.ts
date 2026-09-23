import type { ArcSaveRepository } from '../savegame/arcSaveRepository';
import type { ArcSaveGame } from '../savegame/arcSaveGame';
import type { StatAttribute } from '../../types';
import {
  completeAssignment,
  createCustomAttribute,
  createCustomTask,
  deleteCustomAttribute,
  deleteCustomTask,
  initializeArcDay,
  initializeCharacter,
  resetCharacterProgression,
  updateCustomAttribute,
  updateCustomTask,
  type ArcCharacterInitializationInput,
  type ArcCustomAttributeInput,
  type ArcCustomTaskInput,
} from './localProgressionDomain';

/** Atomic persistence boundary for the pure local progression domain. */
export class LocalProgressionService {
  constructor(private readonly saves: ArcSaveRepository) {}

  initializeCharacter(input: ArcCharacterInitializationInput) {
    return this.saves.transaction((save) => initializeCharacter(save, input));
  }
  initializeArcDay(now = new Date()) {
    return this.saves.transaction((save) => { initializeArcDay(save, now); });
  }
  completeAssignment(assignmentId: string, choiceKey: string | null = null, now = new Date()) {
    let result: ReturnType<typeof completeAssignment> | null = null;
    return this.saves.transaction((save) => { result = completeAssignment(save, assignmentId, choiceKey, now); })
      .then((save) => ({ save, result: result! }));
  }
  createCustomAttribute(input: ArcCustomAttributeInput) {
    let statId = '';
    return this.saves.transaction((save) => { statId = createCustomAttribute(save, input); })
      .then((save) => ({ save, statId }));
  }
  updateCustomAttribute(statId: string, changes: Parameters<typeof updateCustomAttribute>[2]) {
    return this.saves.transaction((save) => updateCustomAttribute(save, statId, changes));
  }
  deleteCustomAttribute(statId: string) {
    return this.saves.transaction((save) => deleteCustomAttribute(save, statId));
  }
  createCustomTask(statId: string, input: ArcCustomTaskInput) {
    let taskId = '';
    return this.saves.transaction((save) => { taskId = createCustomTask(save, statId, input); })
      .then((save) => ({ save, taskId }));
  }
  updateCustomTask(statId: string, taskId: string, changes: Parameters<typeof updateCustomTask>[3]) {
    return this.saves.transaction((save) => updateCustomTask(save, statId, taskId, changes));
  }
  deleteCustomTask(statId: string, taskId: string) {
    return this.saves.transaction((save) => deleteCustomTask(save, statId, taskId));
  }
  syncCustomAttributes(desiredStats: StatAttribute[]) {
    return this.saves.transaction((save) => {
      const desired = desiredStats.filter((stat) => stat.isCustom);
      const desiredIds = new Set(desired.map((stat) => stat.id));
      for (const current of save.progression.customAttributes.filter((stat) => save.progression.statMeta[stat.id]?.active)) {
        if (!desiredIds.has(current.id)) deleteCustomAttribute(save, current.id);
      }
      for (const stat of desired) {
        const exists = save.progression.customAttributes.some((current) => current.id === stat.id && save.progression.statMeta[current.id]?.active);
        if (!exists) {
          const first = stat.tasks[0];
          if (!first) throw new Error('arc_local_custom_stat_requires_task');
          const createdId = createCustomAttribute(save, { displayName: stat.name, emoji: stat.emoji, taskTitle: first.title,
            taskDescription: first.description, taskSelectionMode: stat.taskSelectionMode });
          for (const task of stat.tasks.slice(1)) createCustomTask(save, createdId, { title: task.title, description: task.description, tier: task.tier });
          continue;
        }
        updateCustomAttribute(save, stat.id, { name: stat.name, emoji: stat.emoji, taskSelectionMode: stat.taskSelectionMode });
        const currentTasks = save.progression.customTasks[stat.id] ?? [];
        const originalTasks = [...currentTasks];
        for (const task of stat.tasks) {
          if (currentTasks.some((candidate) => candidate.id === task.id)) {
            updateCustomTask(save, stat.id, task.id, { title: task.title, description: task.description,
              tier: task.tier, order: task.order });
          } else {
            createCustomTask(save, stat.id, { title: task.title, description: task.description, tier: task.tier });
          }
        }
        const nextIds = new Set(stat.tasks.map((task) => task.id));
        for (const task of originalTasks) if (!nextIds.has(task.id)) deleteCustomTask(save, stat.id, task.id);
      }
    });
  }
  resetCharacterProgression() {
    return this.saves.transaction(resetCharacterProgression);
  }
  load(): Promise<ArcSaveGame | null> { return this.saves.load(); }
}
