import type { ArcSaveRepository } from '../savegame/arcSaveRepository';
import { applyCompanionEvent, ArcCompanionEventRejected } from './companionEventDomain';
import type {
  ArcCompanionAppState,
  ArcCompanionAuditEntry,
  ArcCompanionHandshake,
  ArcCompanionProcessResult,
} from './companionTypes';
import { validateCompanionEvent, validateCompanionHandshake } from './companionValidation';

const clone = <T>(value: T): T => structuredClone(value);

export class LocalCompanionBridgeService {
  constructor(private readonly saves: ArcSaveRepository) {}

  validateEvent(value: unknown, now = new Date()) {
    return validateCompanionEvent(value, now);
  }

  async processEvent(value: unknown, receivedAt = new Date()): Promise<ArcCompanionProcessResult> {
    const validation = validateCompanionEvent(value, receivedAt);
    if (validation.valid === false) return { accepted: false, eventId: validation.eventId, reason: validation.reason };
    let result: Extract<ArcCompanionProcessResult, { accepted: true }> | null = null;
    try {
      await this.saves.transaction((save) => { result = applyCompanionEvent(save, validation.event, receivedAt); });
      return result!;
    } catch (error) {
      if (error instanceof ArcCompanionEventRejected) {
        return { accepted: false, eventId: error.eventId, reason: error.reason };
      }
      throw error;
    }
  }

  async getProcessedEvent(eventId: string): Promise<{ processed: boolean; audit: ArcCompanionAuditEntry | null }> {
    const save = await this.saves.load();
    return {
      processed: save?.companions.processedEventIds.includes(eventId) ?? false,
      audit: clone(save?.companions.auditLog.find((entry) => entry.eventId === eventId) ?? null),
    };
  }

  async getAuditLog(): Promise<ArcCompanionAuditEntry[]> {
    return clone((await this.saves.load())?.companions.auditLog ?? []);
  }

  async getCompanionState(): Promise<ArcCompanionAppState[]> {
    return clone((await this.saves.load())?.companions.apps ?? []);
  }

  async markHandshake(value: unknown): Promise<ArcCompanionAppState> {
    const validation = validateCompanionHandshake(value);
    if (validation.valid === false) throw new Error(`arc_companion_handshake_rejected:${validation.reason}`);
    let state: ArcCompanionAppState | null = null;
    await this.saves.transaction((save) => {
      const app = save.companions.apps.find((item) => item.appId === validation.handshake.appId);
      if (!app) throw new Error('arc_companion_state_missing');
      app.installed = true;
      app.connected = true;
      app.lastHandshakeAt = validation.handshake.timestamp;
      state = clone(app);
    });
    return state!;
  }

  async disconnectCompanion(appId: string): Promise<ArcCompanionAppState> {
    let state: ArcCompanionAppState | null = null;
    await this.saves.transaction((save) => {
      const app = save.companions.apps.find((item) => item.appId === appId);
      if (!app) throw new Error('arc_companion_app_not_found');
      app.connected = false;
      state = clone(app);
    });
    return state!;
  }
}

export type { ArcCompanionHandshake };
