import { DEFAULT_STATS } from '../../data/defaultStats';
import { getInitialState } from '../../utils/storage';
import type { AppState, StatAttribute } from '../../types';
import { emptyAchievementSnapshot } from '../achievements/achievementEngine';
import type { AchievementLocalState } from '../achievements/achievementTypes';
import type { MissionRepositoryState } from '../missions/missionTypes';
import { createEmptyCompanionBridgeState } from '../companion/companionPolicy';
import {
  ARC_CANONICAL_STAT_IDS,
  ARC_SAVEGAME_SCHEMA_VERSION,
  createArcId,
  type ArcCanonicalStatId,
  type ArcSaveBackup,
  type ArcSaveEnvelope,
  type ArcSaveGame,
} from './arcSaveGame';
import type { ArcSaveStorageAdapter } from './arcSaveStorage';
import { assertValidArcSaveGame, isArcSaveEnvelope, validateArcSaveGame } from './arcSaveValidation';

const PRIMARY_KEY = 'save:primary';
const BACKUP_PREFIX = 'backup:';
const LOCK_NAME = 'arc-savegame-write';
const LEGACY_APP_STATE_KEY = 'arc_app_system_state_v1';
const LEGACY_SECONDARY_PREFIX = 'arc_secondary_state_v1:';
const LEGACY_MISSION_PREFIX = 'arc_personal_missions_v1:';
const LEGACY_ACHIEVEMENT_PREFIX = 'arc_achievements_v1:';

export interface LegacyBrowserStorage {
  length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
}

export interface ArcSaveInitializationResult {
  save: ArcSaveGame;
  source: 'existing' | 'recovered' | 'legacy' | 'new';
  warnings: string[];
}

export interface ArcSaveInitializeOptions {
  legacyStorage?: LegacyBrowserStorage | null;
  preferredLegacyIdentity?: string | null;
  language?: 'de' | 'en';
}

type SaveMutator = (draft: ArcSaveGame) => void | ArcSaveGame | Promise<void | ArcSaveGame>;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function canonicalStatsFrom(stats: StatAttribute[]): Record<ArcCanonicalStatId, StatAttribute> {
  return Object.fromEntries(ARC_CANONICAL_STAT_IDS.map((statId) => {
    const source = stats.find((stat) => stat.id === statId)
      ?? DEFAULT_STATS.find((stat) => stat.id === statId)!;
    return [statId, clone(source)];
  })) as Record<ArcCanonicalStatId, StatAttribute>;
}

function emptyMissions(identity: string): MissionRepositoryState {
  return { version: 1, identity, runs: [], events: [], rewardClaims: [], lastAuthoritativeCreditBalance: null };
}

function emptyAchievements(identity: string): AchievementLocalState {
  return { version: 1, userId: identity, locallyUnlocked: [], claims: [], snapshot: emptyAchievementSnapshot() };
}

function upgradeObjectivesToV5(save: ArcSaveGame): void {
  save.missions = {
    ...save.missions,
    identity: save.saveId,
    runs: (save.missions.runs ?? []).map((run) => ({ ...run, user_id: save.saveId })),
    events: (save.missions.events ?? []).map((event) => ({ ...event, identity: save.saveId })),
    rewardClaims: (save.missions.rewardClaims ?? []).map((claim) => ({ ...claim, userId: save.saveId })),
  };
  save.achievements = {
    ...save.achievements,
    userId: save.saveId,
    claims: (save.achievements.claims ?? []).map((claim) => ({ ...claim, userId: save.saveId })),
  };
  save.objectives = save.objectives ?? {
    saveId: save.saveId,
    characterId: save.character.characterId,
    processedActivityEventIds: [...new Set(save.missions.events.map((event) => event.eventId))],
    updatedAt: save.updatedAt,
  };
  save.objectives.saveId = save.saveId;
  save.objectives.characterId = save.character.characterId;
  save.objectives.processedActivityEventIds = [...new Set(save.objectives.processedActivityEventIds ?? [])];
}

function upgradeCompanionsToV6(save: ArcSaveGame): void {
  save.companions = createEmptyCompanionBridgeState();
}

function upgradeEconomyToV4(save: ArcSaveGame, sourceVersion: string): void {
  const economy = save.economy;
  const colorIdsByHex: Record<string, string> = {
    '#f59e0b': 'color_amber', '#06b6d4': 'color_cyan', '#10b981': 'color_emerald',
    '#a855f7': 'color_purple', '#f43f5e': 'color_rose', '#3b82f6': 'color_blue',
    '#e2e8f0': 'color_silver', '#f97316': 'color_orange',
  };
  const oldTransactions = Array.isArray(economy.transactions) ? economy.transactions : [];
  economy.transactions = oldTransactions.map((transaction) => ({
    ...transaction,
    source: transaction.source ?? String(transaction.metadata?.source ?? 'legacy'),
    balanceBefore: transaction.balanceBefore ?? transaction.balanceAfter - transaction.amount,
  }));
  const openingBalance = economy.transactions[0]?.balanceBefore ?? 0;
  if (openingBalance !== 0) {
    economy.transactions.unshift({
      id: `local-economy-opening:${save.saveId}`,
      type: 'migration_balance', source: sourceVersion, amount: openingBalance,
      balanceBefore: 0, balanceAfter: openingBalance,
      referenceId: `economy_opening_v4:${save.saveId}`,
      createdAt: save.createdAt, metadata: { preservesExistingBalance: true },
    });
  }
  const lastBalance = economy.transactions.at(-1)?.balanceAfter;
  if (lastBalance !== economy.credits) {
    const before = lastBalance ?? 0;
    economy.transactions.push({
      id: `local-economy-migration:${save.saveId}`,
      type: 'migration_balance', source: sourceVersion, amount: economy.credits - before,
      balanceBefore: before, balanceAfter: economy.credits,
      referenceId: `economy_migration_v4:${save.saveId}`,
      createdAt: save.updatedAt, metadata: { preservesExistingBalance: true },
    });
  }
  const legacyOwnedIds = [...new Set([
    ...economy.inventoryItemIds,
    ...save.settings.purchasedAnimationIds,
    ...save.settings.unlockedDesignColors.map((hex) => colorIdsByHex[hex]).filter(Boolean),
  ])];
  economy.inventory = economy.inventory ?? legacyOwnedIds.filter((itemId) => itemId !== 'color_cyan').map((itemId) => ({
    itemId,
    itemType: (itemId.startsWith('anim_') ? 'animation' : itemId.startsWith('color_') ? 'color' : 'skin') as 'skin' | 'color' | 'animation',
    acquiredAt: save.updatedAt,
    source: 'legacy_inventory', referenceId: `legacy_inventory:${itemId}`, metadata: {},
  }));
  economy.inventoryItemIds = [...new Set(economy.inventory.map((item) => item.itemId))];
  if (economy.equippedSkinId && !economy.inventoryItemIds.includes(economy.equippedSkinId)) economy.equippedSkinId = '';
  economy.equippedItemIds = economy.equippedItemIds ?? {};
  if (save.settings.equippedAnimationId && economy.inventoryItemIds.includes(save.settings.equippedAnimationId)) {
    economy.equippedItemIds.animation = save.settings.equippedAnimationId;
  }
  const selectedColorId = colorIdsByHex[save.settings.selectedDesignColors[0]];
  if (selectedColorId && (selectedColorId === 'color_cyan' || economy.inventoryItemIds.includes(selectedColorId))) {
    economy.equippedItemIds.color = selectedColorId;
  }
  for (const [category, itemId] of Object.entries(economy.equippedItemIds)) {
    if (itemId && itemId !== 'color_cyan' && !economy.inventoryItemIds.includes(itemId)) economy.equippedItemIds[category] = null;
  }
  economy.processedReferenceIds = [...new Set(economy.transactions.map((transaction) => transaction.referenceId))];
  economy.processedExternalPurchaseIds = [...new Set(economy.transactions.map((transaction) => transaction.externalPurchaseId).filter((id): id is string => Boolean(id)))];
}

export function createNewArcSaveGame(language: 'de' | 'en' = 'de'): ArcSaveGame {
  const now = new Date().toISOString();
  const initial = getInitialState();
  const saveId = createArcId('save');
  const characterId = createArcId('character');
  return {
    saveId,
    schemaVersion: ARC_SAVEGAME_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    profile: clone(initial.profile),
    localStateMeta: {
      profileUpdatedAt: now,
      settingsUpdatedAt: now,
      calendarUpdatedAt: now,
      weeklyRoutineUpdatedAt: now,
    },
    character: {
      characterId,
      characterCode: initial.profile.characterCode ?? '',
      createdAt: initial.profile.createdAt || now,
    },
    progression: {
      canonicalStats: canonicalStatsFrom(initial.stats),
      customAttributes: [],
      customTasks: {},
      lifetimeXp: 0,
      level: 1,
      currentLevelXp: 0,
      requiredLevelXp: 100,
      arcDay: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      loginStreak: 0,
      completedTasksToday: [],
      assignments: [],
      history: [],
      dailySnapshots: [],
      statStreaks: {},
      statMeta: Object.fromEntries(ARC_CANONICAL_STAT_IDS.map((statId) => [statId, {
        active: true,
        activeSinceArcDay: null,
        statStreak: 0,
        physicalTrainingCycle: 0,
        maxValueLocked: false,
      }])),
      events: [],
      completedEventIds: [],
      loginDays: [],
      initializedAt: null,
      lastProcessedArcDay: null,
    },
    economy: {
      credits: 100,
      transactions: [{
        id: `local-initial-grant:${saveId}`,
        type: 'initial_grant', source: 'account_creation', amount: 100,
        balanceBefore: 0, balanceAfter: 100, referenceId: `initial_grant:${saveId}`,
        createdAt: now, metadata: { source: 'account_creation' },
      }],
      inventoryItemIds: [],
      inventory: [],
      processedReferenceIds: [`initial_grant:${saveId}`],
      processedExternalPurchaseIds: [],
      equippedSkinId: '',
      equippedItemIds: {},
      wheel: { lastClaimDate: null, claimHistory: [] },
    },
    missions: emptyMissions(saveId),
    achievements: emptyAchievements(saveId),
    titles: { owned: [], equippedTitleId: null },
    objectives: {
      saveId,
      characterId,
      processedActivityEventIds: [],
      updatedAt: now,
    },
    companions: createEmptyCompanionBridgeState(),
    settings: {
      introductionState: 'eligible',
      language,
      quotes: clone(initial.quoteSettings),
      activeBottomModules: [...initial.activeBottomModules],
      selectedDesignColors: [...(initial.selectedDesignColors ?? ['#06b6d4'])],
      unlockedDesignColors: [...(initial.unlockedDesignColors ?? ['#06b6d4'])],
      purchasedAnimationIds: [...(initial.purchasedAnimationIds ?? [])],
      equippedAnimationId: initial.equippedAnimationId ?? '',
      showAvatarFrame: initial.profile.showAvatarFrame !== false,
    },
    calendar: clone(initial.calendarState!),
    weeklyRoutine: clone(initial.weeklyRoutine!),
    ui: {
      collapsedWindows: clone(initial.collapsedWindows ?? {}),
      seenModuleItemIds: clone(initial.seenModuleItemIds ?? {}),
      moduleReloadsCountToday: initial.moduleReloadsCountToday ?? 0,
    },
    legacyImport: { importedAt: null, sourceKeys: [], sourceIdentity: null, warnings: [] },
  };
}

function storageKeys(storage: LegacyBrowserStorage, prefix: string): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys.sort();
}

function safeJson(storage: LegacyBrowserStorage, key: string): unknown | null {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function selectLegacyIdentity(storage: LegacyBrowserStorage, preferred?: string | null): {
  identity: string | null;
  warnings: string[];
} {
  if (preferred) return { identity: preferred, warnings: [] };
  const identities = new Set<string>();
  for (const prefix of [LEGACY_SECONDARY_PREFIX, LEGACY_MISSION_PREFIX, LEGACY_ACHIEVEMENT_PREFIX]) {
    for (const key of storageKeys(storage, prefix)) identities.add(key.slice(prefix.length));
  }
  if (identities.size === 1) return { identity: [...identities][0], warnings: [] };
  return {
    identity: null,
    warnings: identities.size > 1 ? ['multiple_legacy_identities_not_imported'] : [],
  };
}

function applyLegacyAppState(save: ArcSaveGame, state: Partial<AppState>): void {
  if (state.profile) {
    save.profile = { ...save.profile, ...clone(state.profile) };
    save.character.characterCode = state.profile.characterCode ?? save.character.characterCode;
    save.character.createdAt = state.profile.createdAt || save.character.createdAt;
  }
  if (Array.isArray(state.stats)) {
    save.progression.canonicalStats = canonicalStatsFrom(state.stats);
    save.progression.customAttributes = clone(state.stats.filter((stat) => stat.isCustom));
    save.progression.customTasks = Object.fromEntries(
      state.stats.filter((stat) => stat.isCustom).map((stat) => [stat.id, clone(stat.tasks)]),
    );
  }
  if (Number.isSafeInteger(state.lifetimeXp) && Number(state.lifetimeXp) >= 0) save.progression.lifetimeXp = Number(state.lifetimeXp);
  if (Number.isSafeInteger(state.level) && Number(state.level) >= 1) save.progression.level = Number(state.level);
  if (Number.isSafeInteger(state.currentLevelXp) && Number(state.currentLevelXp) >= 0) save.progression.currentLevelXp = Number(state.currentLevelXp);
  if (Number.isSafeInteger(state.requiredLevelXp) && Number(state.requiredLevelXp) >= 0) save.progression.requiredLevelXp = Number(state.requiredLevelXp);
  save.progression.arcDay = state.arcDay ?? save.progression.arcDay;
  save.progression.timezone = state.arcTimezone ?? save.progression.timezone;
  save.progression.loginStreak = state.consecutiveLoginDays ?? save.progression.loginStreak;
  save.progression.completedTasksToday = clone(state.completedTasksToday ?? save.progression.completedTasksToday);
  save.progression.assignments = clone(state.arcAssignments ?? save.progression.assignments);
  save.progression.history = clone(state.history ?? save.progression.history);
  save.progression.dailySnapshots = clone(state.history ?? save.progression.dailySnapshots);
  save.progression.statStreaks = clone(state.statStreaks ?? save.progression.statStreaks);
  if (state.profile?.isCreated || state.arcDay) {
    save.progression.initializedAt = state.profile?.createdAt || new Date().toISOString();
    save.progression.lastProcessedArcDay = state.arcDay ?? save.progression.lastProcessedArcDay;
    for (const stat of [...Object.values(save.progression.canonicalStats), ...save.progression.customAttributes]) {
      save.progression.statMeta[stat.id] = {
        active: true,
        activeSinceArcDay: state.arcDay ?? null,
        statStreak: state.statStreaks?.[stat.id] ?? 0,
        physicalTrainingCycle: 0,
        maxValueLocked: stat.value >= 100,
      };
    }
  }
  if (Number.isSafeInteger(state.credits) && Number(state.credits) >= 0) save.economy.credits = Number(state.credits);
  save.economy.inventoryItemIds = [...new Set(state.ownedSkinIds ?? save.economy.inventoryItemIds)];
  save.economy.equippedSkinId = state.equippedSkinId ?? save.economy.equippedSkinId;
  save.economy.wheel.lastClaimDate = state.lastWheelSpinDate || null;
  save.settings.quotes = clone(state.quoteSettings ?? save.settings.quotes);
  save.settings.activeBottomModules = [...(state.activeBottomModules ?? save.settings.activeBottomModules)];
  save.settings.selectedDesignColors = [...(state.selectedDesignColors ?? save.settings.selectedDesignColors)];
  save.settings.unlockedDesignColors = [...(state.unlockedDesignColors ?? save.settings.unlockedDesignColors)];
  save.settings.purchasedAnimationIds = [...(state.purchasedAnimationIds ?? save.settings.purchasedAnimationIds)];
  save.settings.equippedAnimationId = state.equippedAnimationId ?? save.settings.equippedAnimationId;
  save.settings.showAvatarFrame = state.profile?.showAvatarFrame ?? save.settings.showAvatarFrame;
  if (state.calendarState) save.calendar = clone(state.calendarState);
  if (state.weeklyRoutine) save.weeklyRoutine = clone(state.weeklyRoutine);
  save.ui.collapsedWindows = clone(state.collapsedWindows ?? save.ui.collapsedWindows);
  save.ui.seenModuleItemIds = clone(state.seenModuleItemIds ?? save.ui.seenModuleItemIds);
  save.ui.moduleReloadsCountToday = state.moduleReloadsCountToday ?? save.ui.moduleReloadsCountToday;
}

export function importLegacyArcState(
  storage: LegacyBrowserStorage,
  language: 'de' | 'en' = 'de',
  preferredIdentity?: string | null,
): ArcSaveGame | null {
  const sourceKeys: string[] = [];
  const appState = safeJson(storage, LEGACY_APP_STATE_KEY);
  const selection = selectLegacyIdentity(storage, preferredIdentity);
  const secondaryKey = selection.identity ? `${LEGACY_SECONDARY_PREFIX}${selection.identity}` : null;
  const missionKey = selection.identity ? `${LEGACY_MISSION_PREFIX}${selection.identity}` : null;
  const achievementKey = selection.identity ? `${LEGACY_ACHIEVEMENT_PREFIX}${selection.identity}` : null;
  const secondary = secondaryKey ? safeJson(storage, secondaryKey) : null;
  const missions = missionKey ? safeJson(storage, missionKey) : null;
  const achievements = achievementKey ? safeJson(storage, achievementKey) : null;
  if (!appState && !secondary && !missions && !achievements) return null;

  const save = createNewArcSaveGame(language);
  delete save.settings.introductionState; // Legacy imports are never first-time onboarding.
  if (appState && typeof appState === 'object') {
    applyLegacyAppState(save, appState as Partial<AppState>);
    sourceKeys.push(LEGACY_APP_STATE_KEY);
  }
  if (secondary && typeof secondary === 'object') {
    const value = secondary as Partial<AppState> & { profile?: Partial<AppState['profile']> };
    applyLegacyAppState(save, value);
    sourceKeys.push(secondaryKey!);
  }
  if (missions && typeof missions === 'object' && (missions as MissionRepositoryState).version === 1) {
    const importedMissions = clone(missions as MissionRepositoryState);
    save.missions = {
      ...importedMissions,
      identity: save.saveId,
      runs: importedMissions.runs.map((run) => ({ ...run, user_id: save.saveId })),
      events: importedMissions.events.map((event) => ({ ...event, identity: save.saveId })),
      rewardClaims: importedMissions.rewardClaims.map((claim) => ({ ...claim, userId: save.saveId })),
    };
    sourceKeys.push(missionKey!);
  }
  if (achievements && typeof achievements === 'object' && (achievements as AchievementLocalState).version === 1) {
    const importedAchievements = clone(achievements as AchievementLocalState);
    save.achievements = {
      ...importedAchievements,
      userId: save.saveId,
      claims: importedAchievements.claims.map((claim) => ({ ...claim, userId: save.saveId })),
    };
    sourceKeys.push(achievementKey!);
  }
  save.legacyImport = {
    importedAt: new Date().toISOString(),
    sourceKeys,
    sourceIdentity: selection.identity,
    warnings: selection.warnings,
  };
  upgradeEconomyToV4(save, 'legacy_import');
  assertValidArcSaveGame(save);
  return save;
}

export class ArcSaveRepository {
  private operationQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly storage: ArcSaveStorageAdapter) {}

  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const queued = this.operationQueue.then(operation, operation);
    this.operationQueue = queued.then(() => undefined, () => undefined);
    return queued;
  }

  private withCrossContextLock<T>(operation: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    return locks ? locks.request(LOCK_NAME, operation) : operation();
  }

  async load(): Promise<ArcSaveGame | null> {
    const value = await this.storage.get<unknown>(PRIMARY_KEY);
    return validateArcSaveGame(value).valid ? clone(value as ArcSaveGame) : null;
  }

  async save(save: ArcSaveGame): Promise<ArcSaveGame> {
    return this.serialize(() => this.withCrossContextLock(async () => {
      const next = clone(save);
      next.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(next);
      await this.storage.set(PRIMARY_KEY, next);
      return clone(next);
    }));
  }

  async update(mutator: SaveMutator): Promise<ArcSaveGame> {
    return this.transaction(mutator);
  }

  async transaction(mutator: SaveMutator): Promise<ArcSaveGame> {
    return this.serialize(() => this.withCrossContextLock(async () => {
      const current = await this.load();
      if (!current) throw new Error('ARC savegame is not initialized');
      const draft = clone(current);
      const result = await mutator(draft);
      const next: ArcSaveGame = result && typeof result === 'object' ? result : draft;
      next.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(next);
      await this.storage.set(PRIMARY_KEY, next);
      return clone(next);
    }));
  }

  async backup(reason: ArcSaveBackup['reason'] = 'manual', snapshot?: unknown): Promise<ArcSaveBackup> {
    const source = snapshot ?? await this.storage.get<unknown>(PRIMARY_KEY);
    if (source === null) throw new Error('No ARC savegame is available to back up');
    const sourceVersion = typeof source === 'object' && source !== null && 'schemaVersion' in source
      ? Number((source as { schemaVersion?: unknown }).schemaVersion)
      : 0;
    const backup: ArcSaveBackup = {
      backupId: createArcId('backup'),
      createdAt: new Date().toISOString(),
      reason,
      sourceSchemaVersion: Number.isSafeInteger(sourceVersion) ? sourceVersion : 0,
      snapshot: clone(source),
    };
    await this.storage.set(`${BACKUP_PREFIX}${backup.createdAt}:${backup.backupId}`, backup);
    return clone(backup);
  }

  async recover(): Promise<ArcSaveGame | null> {
    const keys = (await this.storage.keys(BACKUP_PREFIX)).sort().reverse();
    for (const key of keys) {
      const backup = await this.storage.get<ArcSaveBackup>(key);
      if (!backup) continue;
      const candidate = backup.snapshot;
      if (!validateArcSaveGame(candidate).valid) continue;
      const recovered = clone(candidate as ArcSaveGame);
      recovered.updatedAt = new Date().toISOString();
      await this.storage.set(PRIMARY_KEY, recovered);
      return recovered;
    }
    return null;
  }

  async migrate(raw: unknown): Promise<ArcSaveGame> {
    if (!raw || typeof raw !== 'object') throw new Error('ARC savegame migration input is invalid');
    if (!('schemaVersion' in raw)) throw new Error('ARC savegame schema version is missing');
    const sourceVersion = Number((raw as { schemaVersion?: unknown }).schemaVersion);
    if (!Number.isSafeInteger(sourceVersion) || sourceVersion < 0) throw new Error('ARC savegame schema version is invalid');
    if (sourceVersion > ARC_SAVEGAME_SCHEMA_VERSION) throw new Error('ARC savegame was created by a newer app version');
    if (sourceVersion === ARC_SAVEGAME_SCHEMA_VERSION) {
      assertValidArcSaveGame(raw);
      return clone(raw);
    }

    await this.backup('migration', raw);
    if (sourceVersion === 5) {
      const migrated = clone(raw) as ArcSaveGame;
      upgradeCompanionsToV6(migrated);
      migrated.schemaVersion = ARC_SAVEGAME_SCHEMA_VERSION;
      migrated.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(migrated);
      await this.storage.set(PRIMARY_KEY, migrated);
      return clone(migrated);
    }
    if (sourceVersion === 4) {
      const migrated = clone(raw) as ArcSaveGame;
      upgradeObjectivesToV5(migrated);
      upgradeCompanionsToV6(migrated);
      migrated.schemaVersion = ARC_SAVEGAME_SCHEMA_VERSION;
      migrated.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(migrated);
      await this.storage.set(PRIMARY_KEY, migrated);
      return clone(migrated);
    }
    if (sourceVersion === 3) {
      const migrated = clone(raw) as ArcSaveGame;
      upgradeEconomyToV4(migrated, 'savegame_v3');
      upgradeObjectivesToV5(migrated);
      upgradeCompanionsToV6(migrated);
      migrated.schemaVersion = ARC_SAVEGAME_SCHEMA_VERSION;
      migrated.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(migrated);
      await this.storage.set(PRIMARY_KEY, migrated);
      return clone(migrated);
    }
    if (sourceVersion === 2) {
      const migrated = clone(raw) as ArcSaveGame;
      const now = new Date().toISOString();
      migrated.localStateMeta = {
        profileUpdatedAt: migrated.updatedAt || now,
        settingsUpdatedAt: migrated.updatedAt || now,
        calendarUpdatedAt: migrated.updatedAt || now,
        weeklyRoutineUpdatedAt: migrated.updatedAt || now,
      };
      upgradeEconomyToV4(migrated, 'savegame_v2');
      upgradeObjectivesToV5(migrated);
      upgradeCompanionsToV6(migrated);
      migrated.schemaVersion = ARC_SAVEGAME_SCHEMA_VERSION;
      migrated.updatedAt = now;
      assertValidArcSaveGame(migrated);
      await this.storage.set(PRIMARY_KEY, migrated);
      return clone(migrated);
    }
    if (sourceVersion === 1) {
      const migrated = clone(raw) as ArcSaveGame;
      const progression = migrated.progression;
      progression.statMeta = progression.statMeta ?? Object.fromEntries(
        [...ARC_CANONICAL_STAT_IDS, ...progression.customAttributes.map((stat) => stat.id)].map((statId) => [statId, {
          active: true,
          activeSinceArcDay: progression.arcDay,
          statStreak: progression.statStreaks[statId] ?? 0,
          physicalTrainingCycle: 0,
          maxValueLocked: (progression.canonicalStats[statId as ArcCanonicalStatId]?.value ?? 0) >= 100,
        }]),
      );
      progression.events = progression.events ?? [];
      progression.completedEventIds = progression.completedEventIds ?? [];
      progression.loginDays = progression.loginDays ?? [];
      progression.initializedAt = progression.initializedAt ?? (progression.arcDay ? migrated.createdAt : null);
      progression.lastProcessedArcDay = progression.lastProcessedArcDay ?? progression.arcDay;
      upgradeEconomyToV4(migrated, 'savegame_v1');
      upgradeObjectivesToV5(migrated);
      upgradeCompanionsToV6(migrated);
      migrated.localStateMeta = {
        profileUpdatedAt: migrated.updatedAt,
        settingsUpdatedAt: migrated.updatedAt,
        calendarUpdatedAt: migrated.updatedAt,
        weeklyRoutineUpdatedAt: migrated.updatedAt,
      };
      migrated.schemaVersion = ARC_SAVEGAME_SCHEMA_VERSION;
      migrated.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(migrated);
      await this.storage.set(PRIMARY_KEY, migrated);
      return clone(migrated);
    }
    if (sourceVersion !== 0) throw new Error(`No ARC savegame migration exists for version ${sourceVersion}`);
    const legacy = raw as { state?: Partial<AppState>; language?: 'de' | 'en'; saveId?: string; createdAt?: string };
    const migrated = createNewArcSaveGame(legacy.language ?? 'de');
    delete migrated.settings.introductionState;
    if (legacy.saveId) {
      migrated.saveId = legacy.saveId;
      migrated.missions.identity = legacy.saveId;
      migrated.achievements.userId = legacy.saveId;
    }
    if (legacy.createdAt) migrated.createdAt = legacy.createdAt;
    if (legacy.state) applyLegacyAppState(migrated, legacy.state);
    upgradeEconomyToV4(migrated, 'savegame_v0');
    upgradeObjectivesToV5(migrated);
    upgradeCompanionsToV6(migrated);
    migrated.updatedAt = new Date().toISOString();
    assertValidArcSaveGame(migrated);
    await this.storage.set(PRIMARY_KEY, migrated);
    return clone(migrated);
  }

  async reset(language: 'de' | 'en' = 'de'): Promise<ArcSaveGame> {
    const current = await this.storage.get<unknown>(PRIMARY_KEY);
    if (current !== null) await this.backup('manual', current);
    return this.save(createNewArcSaveGame(language));
  }

  async initialize(options: ArcSaveInitializeOptions = {}): Promise<ArcSaveInitializationResult> {
    return this.serialize(() => this.withCrossContextLock(async () => {
      const raw = await this.storage.get<unknown>(PRIMARY_KEY);
      if (raw !== null) {
        if (validateArcSaveGame(raw).valid) return { save: clone(raw as ArcSaveGame), source: 'existing', warnings: [] };
        const rawVersion = typeof raw === 'object' && raw !== null && 'schemaVersion' in raw
          ? Number((raw as { schemaVersion: unknown }).schemaVersion)
          : null;
        if (rawVersion !== null && rawVersion > ARC_SAVEGAME_SCHEMA_VERSION) {
          throw new Error('ARC savegame was created by a newer app version');
        }
        try {
          const migrated = await this.migrate(raw);
          return { save: migrated, source: 'existing', warnings: [] };
        } catch (migrationError) {
          const recovered = await this.recover();
          if (recovered) return { save: recovered, source: 'recovered', warnings: ['primary_save_recovered'] };
          throw migrationError;
        }
      }

      const legacy = options.legacyStorage
        ? importLegacyArcState(options.legacyStorage, options.language, options.preferredLegacyIdentity)
        : null;
      const save = legacy ?? createNewArcSaveGame(options.language);
      assertValidArcSaveGame(save);
      await this.storage.set(PRIMARY_KEY, save);
      return {
        save: clone(save),
        source: legacy ? 'legacy' : 'new',
        warnings: [...save.legacyImport.warnings],
      };
    }));
  }

  async export(): Promise<ArcSaveEnvelope> {
    const save = await this.load();
    if (!save) throw new Error('No valid ARC savegame is available');
    return { format: 'arc-savegame', formatVersion: 1, exportedAt: new Date().toISOString(), save };
  }

  async import(envelope: unknown): Promise<ArcSaveGame> {
    if (!isArcSaveEnvelope(envelope)) throw new Error('ARC savegame import is invalid');
    return this.serialize(() => this.withCrossContextLock(async () => {
      const candidate = clone(envelope.save);
      assertValidArcSaveGame(candidate);
      // Restoring a backup is not a new-character creation event.
      if (candidate.settings.introductionState === 'pending') candidate.settings.introductionState = 'completed';
      const current = await this.storage.get<unknown>(PRIMARY_KEY);
      if (current !== null) await this.backup('recovery', current);
      candidate.updatedAt = new Date().toISOString();
      assertValidArcSaveGame(candidate);
      // IndexedDB put is atomic. The current primary remains untouched until its
      // recovery snapshot is durable and the complete candidate has validated.
      await this.storage.set(PRIMARY_KEY, candidate);
      return clone(candidate);
    }));
  }
}
