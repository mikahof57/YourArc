import type { ArcContentManifest } from './contentManifest';
import type { MissionRun } from '../missions/missionTypes';

export interface TrustedContentRegistry {
  isTrusted(contentType: 'mission' | 'daily-task', catalogVersion: string, catalogHash: string): Promise<boolean>;
}

export class StaticTrustedContentRegistry implements TrustedContentRegistry {
  constructor(private readonly trusted: readonly ArcContentManifest[]) {}
  async isTrusted(contentType: 'mission' | 'daily-task', version: string, hash: string): Promise<boolean> {
    return this.trusted.some((manifest) => contentType === 'mission'
      ? manifest.missionCatalogVersion === version && manifest.missionCatalogHash === hash
      : manifest.dailyTaskCatalogVersion === version && manifest.dailyTaskCatalogHash === hash);
  }
}

export async function assertTrustedMissionRun(run: MissionRun, registry: TrustedContentRegistry): Promise<void> {
  if (!await registry.isTrusted('mission', run.catalog_version, run.mission_catalog_hash_snapshot)) {
    throw new Error('Mission catalog version/hash is not trusted for production settlement');
  }
}
