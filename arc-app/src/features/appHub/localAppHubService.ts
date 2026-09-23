import { ARC_COMPANION_APP_CATALOG, type ArcCompanionAppDefinition, type ArcCompanionLifecycleStatus } from './appHubCatalog';
export type { ArcCompanionEventEnvelope } from '../companion/companionTypes';

export interface ArcCompanionRuntimePort {
  markInstalled(appId: string): Promise<void>;
  markConnected(appId: string): Promise<void>;
  markDisconnected(appId: string): Promise<void>;
  updateLocalCompanionState(appId: string, state: Record<string, unknown>): Promise<void>;
  openCompanionApp(app: ArcCompanionAppDefinition): Promise<boolean>;
}

const clone = <T>(value: T): T => structuredClone(value);

export class LocalAppHubService {
  constructor(
    private readonly catalog: readonly ArcCompanionAppDefinition[] = ARC_COMPANION_APP_CATALOG,
    private readonly runtime: ArcCompanionRuntimePort | null = null,
  ) {}

  getApps(): ArcCompanionAppDefinition[] {
    return [...this.catalog].sort((a, b) => a.sortOrder - b.sortOrder).map(clone);
  }

  getAppById(appId: string): ArcCompanionAppDefinition | null {
    const app = this.catalog.find((candidate) => candidate.appId === appId);
    return app ? clone(app) : null;
  }

  getAppsByStatus(status: ArcCompanionLifecycleStatus): ArcCompanionAppDefinition[] {
    return this.getApps().filter((app) => app.status === status);
  }

  async markInstalled(appId: string): Promise<void> {
    await this.requireRuntime(appId).markInstalled(appId);
  }

  async markConnected(appId: string): Promise<void> {
    await this.requireRuntime(appId).markConnected(appId);
  }

  async markDisconnected(appId: string): Promise<void> {
    await this.requireRuntime(appId).markDisconnected(appId);
  }

  async updateLocalCompanionState(appId: string, state: Record<string, unknown>): Promise<void> {
    await this.requireRuntime(appId).updateLocalCompanionState(appId, clone(state));
  }

  async openCompanionApp(appId: string): Promise<boolean> {
    const app = this.requireApp(appId);
    if (!app.available || app.status === 'coming_soon') return false;
    if (!this.runtime) return false;
    return this.runtime.openCompanionApp(clone(app));
  }

  private requireApp(appId: string): ArcCompanionAppDefinition {
    const app = this.catalog.find((candidate) => candidate.appId === appId);
    if (!app) throw new Error('arc_app_hub_app_not_found');
    return app;
  }

  private requireRuntime(appId: string): ArcCompanionRuntimePort {
    const app = this.requireApp(appId);
    if (!app.available || app.status === 'coming_soon') throw new Error('arc_app_hub_companion_unavailable');
    if (!this.runtime) throw new Error('arc_app_hub_runtime_adapter_not_configured');
    return this.runtime;
  }
}

export const localAppHubService = new LocalAppHubService();
