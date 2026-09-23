import { ArcSaveRepository, type ArcSaveInitializationResult } from '../features/savegame/arcSaveRepository';
import { IndexedDbArcSaveStorage } from '../features/savegame/arcSaveStorage';
import { LocalProfileService } from '../features/profile/localProfileService';
import { LocalEconomyService } from '../features/economy/localEconomyService';
import { LocalObjectivesService } from '../features/objectives/localObjectivesService';
import { LocalProgressionService } from '../features/progression/localProgressionService';
import { LocalGameService } from '../features/runtime/localGameService';
import { LocalCompanionBridgeService } from '../features/companion/localCompanionBridgeService';

export const localSaveRepository = new ArcSaveRepository(new IndexedDbArcSaveStorage());
export const localProfileService = new LocalProfileService(localSaveRepository);
export const localEconomyService = new LocalEconomyService(localSaveRepository);
export const localObjectivesService = new LocalObjectivesService(localSaveRepository);
export const localProgressionService = new LocalProgressionService(localSaveRepository);
export const localGameService = new LocalGameService(localSaveRepository);
export const localCompanionBridgeService = new LocalCompanionBridgeService(localSaveRepository);

let initialization: Promise<ArcSaveInitializationResult> | null = null;

export function initializeLocalSaveFoundation(language: 'de' | 'en'): Promise<ArcSaveInitializationResult> {
  if (!initialization) {
    initialization = localSaveRepository.initialize({
      legacyStorage: typeof localStorage === 'undefined' ? null : localStorage,
      language,
    });
  }
  return initialization;
}
