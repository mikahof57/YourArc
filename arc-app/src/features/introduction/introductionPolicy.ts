import type { ArcSaveGame } from '../savegame/arcSaveGame';

export function shouldShowIntroduction(save: ArcSaveGame): boolean {
  return save.settings.introductionState === 'pending'
    && save.profile.isCreated && Boolean(save.progression.initializedAt);
}

/** Replay is presentation-only; finish and skip share the same durable dismissal. */
export async function dismissIntroduction(mode: 'automatic' | 'replay', persist: () => Promise<unknown>): Promise<void> {
  if (mode === 'automatic') await persist();
}
