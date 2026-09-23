import { ARC_PRESET_TASK_CATALOG_VERSION } from '../../config/progression';
import { PERSONAL_MISSION_CATALOG_VERSION } from '../missions/missionCatalog';
import { ACHIEVEMENT_CATALOG_VERSION } from '../achievements/achievementCatalog';

export const MISSION_CATALOG_VERSION = PERSONAL_MISSION_CATALOG_VERSION;
export const DAILY_TASK_CATALOG_VERSION = ARC_PRESET_TASK_CATALOG_VERSION;
export { ACHIEVEMENT_CATALOG_VERSION };

export interface ArcContentManifest {
  missionCatalogVersion: string;
  missionCatalogHash: string;
  dailyTaskCatalogVersion: string;
  dailyTaskCatalogHash: string;
  achievementCatalogVersion: string;
  achievementCatalogHash: string;
}

export const MISSION_CATALOG_HASH = '97337355932eb0cd4835e98604e61c2eb2da16092e0ea783c880afe5e3bab1f8';
export const DAILY_TASK_CATALOG_HASH = 'c41892977b935cb61d677529b9ca95bc76df482f32b993e661a1df09dd1239e3';
export const ACHIEVEMENT_CATALOG_HASH = '6e01bfc462cbf703e52cec61dd7923f3f053a79c9154f51a64d7094ccea5ee45';

export const ARC_CONTENT_MANIFEST: Readonly<ArcContentManifest> = Object.freeze({
  missionCatalogVersion: MISSION_CATALOG_VERSION,
  missionCatalogHash: MISSION_CATALOG_HASH,
  dailyTaskCatalogVersion: DAILY_TASK_CATALOG_VERSION,
  dailyTaskCatalogHash: DAILY_TASK_CATALOG_HASH,
  achievementCatalogVersion: ACHIEVEMENT_CATALOG_VERSION,
  achievementCatalogHash: ACHIEVEMENT_CATALOG_HASH,
});

export function getArcContentManifest(): Promise<ArcContentManifest> {
  return Promise.resolve(ARC_CONTENT_MANIFEST);
}
