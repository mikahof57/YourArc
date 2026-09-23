import {
  ARC_CANONICAL_STAT_IDS,
  ARC_SAVEGAME_SCHEMA_VERSION,
  type ArcSaveBackup,
  type ArcSaveEnvelope,
  type ArcSaveGame,
} from './arcSaveGame';
import { ARC_COMPANION_APP_CATALOG } from '../appHub/appHubCatalog';
import { ARC_COMPANION_REWARD_POLICY, ARC_COMPANION_SOURCE_STAT_MAP } from '../companion/companionPolicy';
import { ARC_COMPANION_EVENT_SCHEMA_VERSION } from '../companion/companionTypes';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const validId = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const validInteger = (value: unknown, minimum = 0) => Number.isSafeInteger(value) && Number(value) >= minimum;

export interface ArcSaveValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateArcSaveGame(value: unknown): ArcSaveValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) return { valid: false, errors: ['savegame_not_object'] };

  if (!validId(value.saveId)) errors.push('save_id_invalid');
  if (value.schemaVersion !== ARC_SAVEGAME_SCHEMA_VERSION) errors.push('schema_version_invalid');
  if (!validId(value.createdAt) || !validId(value.updatedAt)) errors.push('timestamps_invalid');
  if (!isRecord(value.character) || !validId(value.character.characterId)) errors.push('character_id_invalid');
  if (!isRecord(value.profile)) errors.push('profile_invalid');
  else {
    if (typeof value.profile.name !== 'string' || value.profile.name.length > 60
      || !['m', 'f', 'd'].includes(String(value.profile.gender))
      || typeof value.profile.avatarUrl !== 'string' || value.profile.avatarUrl.length > 2048
      || typeof value.profile.isCreated !== 'boolean') errors.push('profile_fields_invalid');
    for (const field of ['age', 'weight', 'height'] as const) {
      const candidate = value.profile[field];
      if (candidate !== undefined && (!Number.isFinite(candidate) || Number(candidate) <= 0)) errors.push(`profile_${field}_invalid`);
    }
    if ('email' in value.profile || 'user_id' in value.profile || 'is_online' in value.profile || 'last_seen' in value.profile) {
      errors.push('profile_account_fields_forbidden');
    }
  }
  if (!isRecord(value.localStateMeta)
    || !validId(value.localStateMeta.profileUpdatedAt)
    || !validId(value.localStateMeta.settingsUpdatedAt)
    || !validId(value.localStateMeta.calendarUpdatedAt)
    || !validId(value.localStateMeta.weeklyRoutineUpdatedAt)) errors.push('local_state_meta_invalid');

  const progression = value.progression;
  if (!isRecord(progression) || !isRecord(progression.canonicalStats)) {
    errors.push('progression_invalid');
  } else {
    for (const statId of ARC_CANONICAL_STAT_IDS) {
      const stat = progression.canonicalStats[statId];
      if (!isRecord(stat) || stat.id !== statId) {
        errors.push(`canonical_stat_${statId}_missing`);
        continue;
      }
      if (!validInteger(stat.value) || Number(stat.value) > 100) {
        errors.push(`canonical_stat_${statId}_value_invalid`);
      }
    }
    if (!validInteger(progression.lifetimeXp)
      || !validInteger(progression.level, 1)
      || !validInteger(progression.currentLevelXp)
      || !validInteger(progression.requiredLevelXp)) {
      errors.push('xp_or_level_invalid');
    }
    if (!isRecord(progression.statMeta)
      || !Array.isArray(progression.events)
      || !Array.isArray(progression.completedEventIds)
      || !Array.isArray(progression.loginDays)) {
      errors.push('progression_runtime_state_invalid');
    } else {
      const allStats = [
        ...ARC_CANONICAL_STAT_IDS.map((id) => progression.canonicalStats[id]),
        ...(Array.isArray(progression.customAttributes) ? progression.customAttributes : []),
      ];
      for (const stat of allStats) {
        if (!isRecord(stat)) continue;
        const meta = progression.statMeta[String(stat.id)];
        if (!isRecord(meta) || typeof meta.active !== 'boolean'
          || !validInteger(meta.statStreak)
          || !isIntegerInRange(meta.physicalTrainingCycle, 0, 6)
          || typeof meta.maxValueLocked !== 'boolean') {
          errors.push(`stat_meta_${String(stat.id)}_invalid`);
        }
        if (isRecord(meta) && meta.maxValueLocked === true && stat.value !== 100) {
          errors.push(`stat_${String(stat.id)}_permanent_max_invalid`);
        }
      }
    }
  }

  const economy = value.economy;
  if (!isRecord(economy)
    || !Number.isSafeInteger(economy.credits)
    || Number(economy.credits) < 0
    || !Array.isArray(economy.transactions)
    || !Array.isArray(economy.inventoryItemIds)
    || !Array.isArray(economy.inventory)
    || !Array.isArray(economy.processedReferenceIds)
    || !Array.isArray(economy.processedExternalPurchaseIds)) {
    errors.push('economy_invalid');
  } else {
    const transactions = economy.transactions;
    const transactionIds = new Set<string>();
    const references = new Set<string>();
    let priorBalance = 0;
    for (const transaction of transactions) {
      if (!isRecord(transaction) || !validId(transaction.id) || !validId(transaction.type)
        || !validId(transaction.source) || !validId(transaction.referenceId)
        || !Number.isSafeInteger(transaction.amount) || !validInteger(transaction.balanceBefore)
        || !validInteger(transaction.balanceAfter)
        || transaction.balanceBefore !== priorBalance
        || Number(transaction.balanceAfter) !== Number(transaction.balanceBefore) + Number(transaction.amount)
        || transactionIds.has(String(transaction.id)) || references.has(String(transaction.referenceId))) {
        errors.push('economy_ledger_invalid'); break;
      }
      transactionIds.add(String(transaction.id)); references.add(String(transaction.referenceId));
      priorBalance = Number(transaction.balanceAfter);
    }
    if (transactions.length && priorBalance !== economy.credits) errors.push('economy_balance_mismatch');
    if (!transactions.length && economy.credits !== 0) errors.push('economy_opening_balance_missing');
    const ownedIds = economy.inventoryItemIds;
    if (!ownedIds.every(validId) || new Set(ownedIds).size !== ownedIds.length) errors.push('economy_inventory_ids_invalid');
    if (economy.inventory.length !== ownedIds.length
      || economy.inventory.some((item) => !isRecord(item) || !ownedIds.includes(String(item.itemId)))) errors.push('economy_inventory_invalid');
    if (typeof economy.equippedSkinId !== 'string'
      || (economy.equippedSkinId && !ownedIds.includes(economy.equippedSkinId))) errors.push('economy_equipped_skin_invalid');
    const externalPurchaseIds = economy.processedExternalPurchaseIds as unknown[];
    if (new Set(economy.processedReferenceIds).size !== economy.processedReferenceIds.length
      || economy.processedReferenceIds.some((reference) => !validId(reference))
      || new Set(externalPurchaseIds).size !== externalPurchaseIds.length
      || externalPurchaseIds.some((reference) => !validId(reference))) errors.push('economy_idempotency_index_invalid');
    if (economy.transactions.some((transaction) => isRecord(transaction) && transaction.externalPurchaseId
      && !externalPurchaseIds.includes(String(transaction.externalPurchaseId)))) errors.push('economy_external_purchase_index_invalid');
  }

  if (!isRecord(value.missions) || value.missions.version !== 1) errors.push('missions_invalid');
  if (!isRecord(value.achievements) || value.achievements.version !== 1) errors.push('achievements_invalid');
  if (isRecord(value.missions) && value.missions.identity !== value.saveId) errors.push('missions_identity_invalid');
  if (isRecord(value.achievements) && value.achievements.userId !== value.saveId) errors.push('achievements_identity_invalid');
  if (isRecord(value.missions)) {
    if (!Array.isArray(value.missions.runs) || !Array.isArray(value.missions.events)
      || !Array.isArray(value.missions.rewardClaims)
      || value.missions.runs.some((run) => !isRecord(run) || run.user_id !== value.saveId)
      || value.missions.events.some((event) => !isRecord(event) || event.identity !== value.saveId)
      || value.missions.rewardClaims.some((claim) => !isRecord(claim) || claim.userId !== value.saveId)) {
      errors.push('missions_state_invalid');
    }
  }
  if (isRecord(value.achievements)) {
    if (!Array.isArray(value.achievements.locallyUnlocked) || !Array.isArray(value.achievements.claims)
      || value.achievements.claims.some((claim) => !isRecord(claim) || claim.userId !== value.saveId)
      || new Set(value.achievements.locallyUnlocked).size !== value.achievements.locallyUnlocked.length) {
      errors.push('achievements_state_invalid');
    }
  }
  const titles = value.titles;
  if (!isRecord(titles) || !Array.isArray(titles.owned)
    || (titles.equippedTitleId !== null && typeof titles.equippedTitleId !== 'string')
    || (typeof titles.equippedTitleId === 'string'
      && !titles.owned.some((title) => isRecord(title) && title.title_id === titles.equippedTitleId))) {
    errors.push('titles_invalid');
  }
  if (!isRecord(value.objectives) || value.objectives.saveId !== value.saveId
    || !isRecord(value.character) || value.objectives.characterId !== value.character.characterId
    || !Array.isArray(value.objectives.processedActivityEventIds)
    || value.objectives.processedActivityEventIds.some((eventId) => !validId(eventId))
    || new Set(value.objectives.processedActivityEventIds).size !== value.objectives.processedActivityEventIds.length
    || !validId(value.objectives.updatedAt)) {
    errors.push('objectives_invalid');
  }
  const companions = value.companions;
  if (!isRecord(companions) || companions.schemaVersion !== ARC_COMPANION_EVENT_SCHEMA_VERSION
    || !Array.isArray(companions.apps) || !Array.isArray(companions.processedEventIds)
    || !Array.isArray(companions.dailyUsage) || !Array.isArray(companions.auditLog)) {
    errors.push('companions_invalid');
  } else {
    const processedEventIds = companions.processedEventIds as unknown[];
    const knownAppIds = ARC_COMPANION_APP_CATALOG.map((app) => app.appId);
    const stateAppIds = companions.apps.map((app) => isRecord(app) ? String(app.appId) : '');
    if (companions.apps.length !== knownAppIds.length || new Set(stateAppIds).size !== knownAppIds.length
      || knownAppIds.some((appId) => !stateAppIds.includes(appId))
      || companions.apps.some((app) => !isRecord(app) || !knownAppIds.includes(String(app.appId))
        || typeof app.installed !== 'boolean' || typeof app.connected !== 'boolean'
        || (app.connected === true && app.installed !== true)
        || app.bridgeSchemaVersion !== ARC_COMPANION_EVENT_SCHEMA_VERSION
        || !validNullableTimestamp(app.lastHandshakeAt) || !validNullableTimestamp(app.lastEventAt)
        || (app.lastProcessedEventId !== null
          && (!validId(app.lastProcessedEventId) || !processedEventIds.includes(app.lastProcessedEventId))))) {
      errors.push('companion_apps_invalid');
    }
    if (processedEventIds.length > ARC_COMPANION_REWARD_POLICY.maxProcessedEventIds
      || processedEventIds.some((eventId) => !validId(eventId))
      || new Set(processedEventIds).size !== processedEventIds.length) {
      errors.push('companion_processed_events_invalid');
    }
    const dailyKeys = new Set<string>();
    if (companions.dailyUsage.length > ARC_COMPANION_APP_CATALOG.length * (ARC_COMPANION_REWARD_POLICY.dailyUsageRetentionDays + 1)
      || companions.dailyUsage.some((usage) => {
      if (!isRecord(usage) || !knownAppIds.includes(String(usage.appId)) || !validArcDay(usage.arcDay)
        || !isIntegerInRange(usage.statPoints, 0, ARC_COMPANION_REWARD_POLICY.maxStatPointsPerAppPerDay)
        || !isIntegerInRange(usage.xp, 0, ARC_COMPANION_REWARD_POLICY.maxXpPerAppPerDay)) return true;
      const key = `${usage.appId}:${usage.arcDay}`;
      if (dailyKeys.has(key)) return true;
      dailyKeys.add(key);
      return false;
    })) errors.push('companion_daily_usage_invalid');
    const auditIds = new Set<string>();
    if (companions.auditLog.length > ARC_COMPANION_REWARD_POLICY.maxAuditEntries
      || companions.auditLog.some((entry) => {
        if (!isRecord(entry) || !validId(entry.eventId) || auditIds.has(String(entry.eventId))
          || !processedEventIds.includes(entry.eventId) || !knownAppIds.includes(String(entry.sourceApp))
          || !ARC_COMPANION_REWARD_POLICY.supportedEventTypes.includes(entry.eventType as never)
          || !validId(entry.activityId) || !validTimestamp(entry.receivedAt) || !validTimestamp(entry.eventTimestamp)
          || ARC_COMPANION_SOURCE_STAT_MAP.get(String(entry.sourceApp)) !== entry.rewardStat
          || !validInteger(entry.requestedRewardPoints) || !validInteger(entry.appliedRewardPoints)
          || Number(entry.requestedRewardPoints) > ARC_COMPANION_REWARD_POLICY.maxStatPointsPerEvent
          || Number(entry.appliedRewardPoints) > Number(entry.requestedRewardPoints)
          || !validInteger(entry.requestedRewardXp) || !validInteger(entry.appliedRewardXp)
          || Number(entry.requestedRewardXp) > ARC_COMPANION_REWARD_POLICY.maxXpPerEvent
          || Number(entry.appliedRewardXp) !== Number(entry.requestedRewardXp)
          || entry.status !== 'accepted' || entry.schemaVersion !== ARC_COMPANION_EVENT_SCHEMA_VERSION) return true;
        auditIds.add(String(entry.eventId));
        return false;
      })) errors.push('companion_audit_invalid');
  }
  if (!isRecord(value.settings) || !isRecord(value.calendar) || !isRecord(value.weeklyRoutine) || !isRecord(value.ui)) {
    errors.push('local_state_invalid');
  }

  if (isRecord(value.settings) && value.settings.introductionState !== undefined
    && !['eligible', 'pending', 'completed'].includes(String(value.settings.introductionState))) errors.push('introduction_state_invalid');

  return { valid: errors.length === 0, errors };
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): boolean {
  return Number.isSafeInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function validNullableTimestamp(value: unknown): boolean {
  return value === null || validTimestamp(value);
}

function validArcDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));
}

export function isArcSaveBackup(value: unknown): value is ArcSaveBackup {
  return isRecord(value)
    && validId(value.backupId)
    && validId(value.createdAt)
    && ['migration', 'manual', 'recovery'].includes(String(value.reason))
    && Number.isSafeInteger(value.sourceSchemaVersion)
    && 'snapshot' in value;
}

export function isArcSaveEnvelope(value: unknown): value is ArcSaveEnvelope {
  return isRecord(value)
    && value.format === 'arc-savegame'
    && value.formatVersion === 1
    && validTimestamp(value.exportedAt)
    && validateArcSaveGame(value.save).valid;
}

export function assertValidArcSaveGame(value: unknown): asserts value is ArcSaveGame {
  const validation = validateArcSaveGame(value);
  if (!validation.valid) throw new Error(`ARC savegame rejected: ${validation.errors.join(', ')}`);
}
