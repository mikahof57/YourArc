import { AVAILABLE_SKINS } from '../../data/skinData';
import { generateCharacterCode } from '../../utils/characterCode';
import type { AppState, ArcDailyAssignment, StatAttribute, TaskItem, UserProfile } from '../../types';
import type { Language } from '../../utils/i18n';
import { createPresetTaskCatalogForLanguage } from '../../utils/presetTaskCatalog';
import { getTodayDateString } from '../../utils/storage';
import { emptyAchievementSnapshot } from '../achievements/achievementEngine';
import { completeAssignment, initializeArcDay, initializeCharacter, resetCharacterProgression, type ArcCharacterInitializationInput } from '../progression/localProgressionDomain';
import { evaluateLocalAchievements, recordLocalObjectiveActivity } from '../objectives/localObjectivesDomain';
import { equipItem, purchaseItem, spendForReload } from '../economy/localEconomyDomain';
import { createArcId, type ArcSaveGame } from '../savegame/arcSaveGame';
import type { ArcSaveRepository } from '../savegame/arcSaveRepository';

const clone = <T>(value: T): T => structuredClone(value);
const LOCAL_FALLBACK_AVATAR = '/assets/skins/Data Scholar.png';
const localizedCatalogs = new Map<Language, Map<string, ReturnType<typeof createPresetTaskCatalogForLanguage>[number]>>();

export function mapLocalAssignmentToTaskItem(assignment: ArcDailyAssignment, language: Language): TaskItem {
  let catalog = localizedCatalogs.get(language);
  if (!catalog) {
    catalog = new Map(createPresetTaskCatalogForLanguage(language).map((task) => [`${task.catalogVersion}:${task.canonicalStatKey}:${task.taskKey}`, task]));
    localizedCatalogs.set(language, catalog);
  }
  const localized = assignment.task_source === 'preset' && assignment.preset_catalog_version && assignment.preset_task_key
    ? catalog.get(`${assignment.preset_catalog_version}:${assignment.stat_id}:${assignment.preset_task_key}`) : undefined;
  return { id: assignment.assignment_id, title: localized?.title ?? assignment.title,
    description: localized?.description ?? assignment.description, order: assignment.sort_order,
    tier: assignment.tier ?? undefined, isCustom: assignment.task_source === 'custom' };
}

export function getLocalRestdayOptions(assignment: ArcDailyAssignment): Array<{ key: string; title: string }> {
  const options = assignment.task_metadata.options;
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => option && typeof option === 'object'
    && typeof Reflect.get(option, 'key') === 'string'
    ? [{ key: String(Reflect.get(option, 'key')), title: String(Reflect.get(option, 'title') ?? Reflect.get(option, 'key')) }]
    : []);
}

export function projectSaveToAppState(save: ArcSaveGame, previous: AppState): AppState {
  const activeStats: StatAttribute[] = [
    ...Object.values(save.progression.canonicalStats),
    ...save.progression.customAttributes,
  ].filter((stat) => save.progression.statMeta[stat.id]?.active).map(clone);
  const equippedSkin = AVAILABLE_SKINS.find((skin) => skin.id === save.economy.equippedSkinId);
  const savedAvatar = /^https?:\/\//i.test(save.profile.avatarUrl) ? LOCAL_FALLBACK_AVATAR : save.profile.avatarUrl;
  return {
    ...previous,
    profile: {
      ...clone(save.profile),
      avatarUrl: equippedSkin?.avatarUrl ?? savedAvatar,
      characterCode: save.character.characterCode || save.profile.characterCode,
    },
    stats: activeStats,
    quoteSettings: clone(save.settings.quotes),
    activeBottomModules: [...save.settings.activeBottomModules] as AppState['activeBottomModules'],
    lastActiveDate: save.progression.arcDay ?? getTodayDateString(),
    completedTasksToday: [...save.progression.completedTasksToday],
    history: clone(save.progression.history),
    moduleReloadsCountToday: save.ui.moduleReloadsCountToday,
    seenModuleItemIds: clone(save.ui.seenModuleItemIds),
    statStreaks: clone(save.progression.statStreaks),
    credits: save.economy.credits,
    consecutiveLoginDays: save.progression.loginStreak,
    ownedSkinIds: [...save.economy.inventoryItemIds],
    equippedSkinId: save.economy.equippedSkinId,
    selectedDesignColors: [...save.settings.selectedDesignColors],
    unlockedDesignColors: [...save.settings.unlockedDesignColors],
    purchasedAnimationIds: [...save.settings.purchasedAnimationIds],
    equippedAnimationId: save.settings.equippedAnimationId,
    calendarState: { ...clone(save.calendar), groupCalendars: [], activeCalendarId: 'private' },
    weeklyRoutine: clone(save.weeklyRoutine),
    collapsedWindows: clone(save.ui.collapsedWindows),
    arcDay: save.progression.arcDay ?? undefined,
    arcTimezone: save.progression.timezone,
    lifetimeXp: save.progression.lifetimeXp,
    level: save.progression.level,
    currentLevelXp: save.progression.currentLevelXp,
    requiredLevelXp: save.progression.requiredLevelXp,
    arcAssignments: clone(save.progression.assignments.filter((assignment) => assignment.arc_day === save.progression.arcDay)),
  };
}

export class LocalGameService {
  constructor(private readonly saves: ArcSaveRepository) {}

  initializeDay(now = new Date()) {
    return this.saves.transaction(async (save) => {
      if (!save.progression.initializedAt) return;
      initializeArcDay(save, now);
      const arcDay = save.progression.arcDay!;
      await recordLocalObjectiveActivity(save, {
        eventId: `login:${save.saveId}:${arcDay}`,
        type: 'LOGIN_DAY', occurredAt: now.toISOString(), arcDay,
      });
    });
  }

  initializeCharacter(input: ArcCharacterInitializationInput) {
    return this.saves.transaction(async (save) => {
      initializeCharacter(save, input);
      await recordLocalObjectiveActivity(save, {
        eventId: `character-created:${save.character.characterId}`,
        type: 'CHARACTER_CREATED', occurredAt: (input.now ?? new Date()).toISOString(),
        arcDay: save.progression.arcDay!,
      });
      await recordLocalObjectiveActivity(save, {
        eventId: `login:${save.saveId}:${save.progression.arcDay!}`,
        type: 'LOGIN_DAY', occurredAt: (input.now ?? new Date()).toISOString(),
        arcDay: save.progression.arcDay!,
      });
    });
  }

  completeAssignment(assignmentId: string, choiceKey: string | null = null, now = new Date()) {
    let completion: ReturnType<typeof completeAssignment> | null = null;
    return this.saves.transaction(async (save) => {
      const assignment = save.progression.assignments.find((item) => item.assignment_id === assignmentId);
      if (!assignment) throw new Error('arc_local_assignment_not_found');
      completion = completeAssignment(save, assignmentId, choiceKey, now);
      await recordLocalObjectiveActivity(save, {
        eventId: `daily-task:${assignment.assignment_id}`,
        type: 'DAILY_TASK_COMPLETED', occurredAt: now.toISOString(), arcDay: assignment.arc_day,
        category: assignment.stat_id,
        taskId: assignment.preset_task_key ?? assignment.custom_task_id ?? assignment.assignment_id,
        assignmentId: assignment.assignment_id, taskSource: assignment.task_source,
        dailyTaskCatalogVersion: assignment.task_source === 'preset' ? assignment.preset_catalog_version : null,
        dailyTaskCatalogHash: null, presetTaskKey: assignment.preset_task_key,
        customTaskId: assignment.custom_task_id,
      });
    }).then((save) => ({ save, completion: completion! }));
  }

  purchaseAndEquip(itemId: string) {
    return this.saves.transaction(async (save) => {
      purchaseItem(save, itemId, `shop_purchase:${itemId}`);
      equipItem(save, itemId);
      await evaluateLocalAchievements(save);
    });
  }

  spendForModuleReload(moduleId: string, operationId: string, newSeenIds: string[]) {
    return this.saves.transaction((save) => {
      spendForReload(save, operationId);
      save.ui.seenModuleItemIds = { ...save.ui.seenModuleItemIds, [moduleId]: [...newSeenIds] };
    });
  }

  resetCharacter() {
    return this.saves.transaction((save) => {
      resetCharacterProgression(save);
      const now = new Date().toISOString();
      const characterId = createArcId('character');
      const characterCode = generateCharacterCode();
      save.character = { characterId, characterCode, createdAt: now };
      save.profile = {
        name: '', gender: 'm', avatarUrl: '', isCreated: false, createdAt: now,
        characterCode, showAvatarFrame: save.settings.showAvatarFrame,
      };
      save.missions = { version: 1, identity: save.saveId, runs: [], events: [], rewardClaims: [], lastAuthoritativeCreditBalance: null };
      save.achievements = { version: 1, userId: save.saveId, locallyUnlocked: [], claims: [], snapshot: emptyAchievementSnapshot() };
      save.titles = { owned: [], equippedTitleId: null };
      save.objectives = { saveId: save.saveId, characterId, processedActivityEventIds: [], updatedAt: now };
    });
  }

  updateProfile(profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'gender' | 'age' | 'weight' | 'height' | 'avatarCategory' | 'showAvatarFrame'>) {
    return this.saves.transaction((save) => {
      save.profile = { ...save.profile, ...clone(profile) };
      save.localStateMeta.profileUpdatedAt = new Date().toISOString();
    });
  }
}
