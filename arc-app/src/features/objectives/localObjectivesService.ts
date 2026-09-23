import type { ArcActivityEvent } from '../missions/missionTypes';
import type { ArcSaveRepository } from '../savegame/arcSaveRepository';
import {
  acknowledgeLocalMission, activateLocalMission, cancelLocalMission, equipLocalTitle,
  evaluateLocalAchievements, getLocalMissionPayload, recordLocalObjectiveActivity,
  type ArcLocalObjectiveContext,
} from './localObjectivesDomain';

/** Atomic Phase 5 shadow API. Production Mission/Achievement services remain active. */
export class LocalObjectivesService {
  constructor(private readonly saves: ArcSaveRepository) {}
  load() { return this.saves.load(); }
  async getMissions(arcDay: string) {
    const save = await this.saves.load();
    if (!save) throw new Error('ARC savegame is not initialized');
    return getLocalMissionPayload(save, arcDay);
  }
  activateMission(missionId: number, context: ArcLocalObjectiveContext) {
    return this.saves.transaction(async (save) => { await activateLocalMission(save, missionId, context); });
  }
  cancelMission(runId: string, context: ArcLocalObjectiveContext) {
    return this.saves.transaction((save) => cancelLocalMission(save, runId, context));
  }
  acknowledgeMission(runId: string, occurredAt?: string) {
    return this.saves.transaction((save) => acknowledgeLocalMission(save, runId, occurredAt));
  }
  recordActivity(event: Omit<ArcActivityEvent, 'identity'>) {
    let result: Awaited<ReturnType<typeof recordLocalObjectiveActivity>> | null = null;
    return this.saves.transaction(async (save) => { result = await recordLocalObjectiveActivity(save, event); })
      .then((save) => ({ save, result: result! }));
  }
  evaluateAchievements(detectedAt?: string) {
    return this.saves.transaction(async (save) => { await evaluateLocalAchievements(save, detectedAt); });
  }
  equipTitle(titleId: string | null) {
    return this.saves.transaction((save) => equipLocalTitle(save, titleId));
  }
}
