import type {
  ArcDailyAssignment,
  CalendarState,
  CollapsedWindowsState,
  DayHistoryRecord,
  QuoteSettings,
  StatAttribute,
  Gender,
  WeeklyRoutineState,
} from '../../types';
import type { AchievementLocalState, UserTitle } from '../achievements/achievementTypes';
import type { MissionRepositoryState } from '../missions/missionTypes';
import type { ArcCompanionBridgeState } from '../companion/companionTypes';

export const ARC_SAVEGAME_SCHEMA_VERSION = 6 as const;
export const ARC_CANONICAL_STAT_IDS = [
  'wissen',
  'muskeln',
  'geist',
  'beweglichkeit',
  'business',
  'geld',
] as const;

export type ArcCanonicalStatId = typeof ARC_CANONICAL_STAT_IDS[number];

/** Offline player presentation only; deliberately contains no account/social identity. */
export interface ArcLocalPlayerProfile {
  name: string;
  gender: Gender;
  age?: number;
  weight?: number;
  height?: number;
  avatarUrl: string;
  avatarCategory?: 'superheroes' | 'anime' | 'comic';
  isCreated: boolean;
  createdAt: string;
  characterCode?: string;
  showAvatarFrame?: boolean;
}

export interface ArcLocalStatMeta {
  active: boolean;
  activeSinceArcDay: string | null;
  statStreak: number;
  physicalTrainingCycle: number;
  maxValueLocked: boolean;
}

export interface ArcLocalProgressionEvent {
  eventId: string;
  eventType: 'TASK_COMPLETION' | 'DAILY_DECAY' | 'ADMIN_ADJUSTMENT' | 'COMPANION_REWARD';
  arcDay: string;
  statId: string;
  assignmentId: string | null;
  delta: number;
  valueBefore: number;
  valueAfter: number;
  xpGained: number;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ArcEconomyTransaction {
  id: string;
  type: string;
  source: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  createdAt: string;
  itemId?: string;
  rewardId?: string;
  externalPurchaseId?: string;
  metadata: Record<string, unknown>;
}

export interface ArcInventoryItem {
  itemId: string;
  itemType: 'skin' | 'color' | 'animation' | 'other';
  acquiredAt: string;
  source: string;
  referenceId: string;
  metadata: Record<string, unknown>;
}

export interface ArcSaveGame {
  saveId: string;
  schemaVersion: typeof ARC_SAVEGAME_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  profile: ArcLocalPlayerProfile;
  localStateMeta: {
    profileUpdatedAt: string;
    settingsUpdatedAt: string;
    calendarUpdatedAt: string;
    weeklyRoutineUpdatedAt: string;
  };
  character: {
    characterId: string;
    characterCode: string;
    createdAt: string;
  };
  progression: {
    canonicalStats: Record<ArcCanonicalStatId, StatAttribute>;
    customAttributes: StatAttribute[];
    customTasks: Record<string, StatAttribute['tasks']>;
    lifetimeXp: number;
    level: number;
    currentLevelXp: number;
    requiredLevelXp: number;
    arcDay: string | null;
    timezone: string;
    loginStreak: number;
    completedTasksToday: string[];
    assignments: ArcDailyAssignment[];
    history: DayHistoryRecord[];
    dailySnapshots: DayHistoryRecord[];
    statStreaks: Record<string, number>;
    statMeta: Record<string, ArcLocalStatMeta>;
    events: ArcLocalProgressionEvent[];
    completedEventIds: string[];
    loginDays: string[];
    initializedAt: string | null;
    lastProcessedArcDay: string | null;
  };
  economy: {
    credits: number;
    transactions: ArcEconomyTransaction[];
    inventoryItemIds: string[];
    inventory: ArcInventoryItem[];
    processedReferenceIds: string[];
    processedExternalPurchaseIds: string[];
    equippedSkinId: string;
    equippedItemIds: Record<string, string | null>;
    wheel: {
      lastClaimDate: string | null;
      claimHistory: Array<{ date: string; reward: number; transactionId: string | null }>;
    };
  };
  missions: MissionRepositoryState;
  achievements: AchievementLocalState;
  titles: {
    owned: UserTitle[];
    equippedTitleId: string | null;
  };
  objectives: {
    saveId: string;
    characterId: string;
    processedActivityEventIds: string[];
    updatedAt: string;
  };
  companions: ArcCompanionBridgeState;
  settings: {
    /** Missing on older saves means already handled; no migration is required. */
    introductionState?: 'eligible' | 'pending' | 'completed';
    language: 'de' | 'en';
    quotes: QuoteSettings;
    activeBottomModules: string[];
    selectedDesignColors: string[];
    unlockedDesignColors: string[];
    purchasedAnimationIds: string[];
    equippedAnimationId: string;
    showAvatarFrame: boolean;
  };
  calendar: CalendarState;
  weeklyRoutine: WeeklyRoutineState;
  ui: {
    collapsedWindows: CollapsedWindowsState;
    seenModuleItemIds: Record<string, string[]>;
    moduleReloadsCountToday: number;
  };
  legacyImport: {
    importedAt: string | null;
    sourceKeys: string[];
    sourceIdentity: string | null;
    warnings: string[];
  };
}

export interface ArcSaveBackup {
  backupId: string;
  createdAt: string;
  reason: 'migration' | 'manual' | 'recovery';
  sourceSchemaVersion: number;
  snapshot: unknown;
}

export interface ArcSaveEnvelope {
  format: 'arc-savegame';
  formatVersion: 1;
  exportedAt: string;
  save: ArcSaveGame;
}

export function createArcId(prefix: 'save' | 'character' | 'backup'): string {
  const randomId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `arc-${prefix}-${randomId}`;
}
