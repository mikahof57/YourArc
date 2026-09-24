import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_CATALOG_VERSION, ARC_TITLE_CATALOG, isActiveAchievement, serializeAchievementCatalog } from '../achievements/achievementCatalog';
import { calculateAchievementProgress, emptyAchievementSnapshot } from '../achievements/achievementEngine';
import type { AchievementClaim, AchievementSnapshot, UserTitle } from '../achievements/achievementTypes';
import { sha256Hex } from '../content/contentHash';
import { applyReward } from '../economy/localEconomyDomain';
import { getLocalShopItem } from '../economy/localShopCatalog';
import { PERSONAL_MISSION_CATALOG, serializeMissionCatalog } from '../missions/missionCatalog';
import { addArcDays, calculateCooldown, calculateDeadline, calculateMissionProgress, canRepeatMission, evaluateMission, isMissionEligible } from '../missions/missionEngine';
import type { ArcActivityEvent, MissionDefinition, MissionRewardClaim, MissionRun, PersonalMissionsPayload } from '../missions/missionTypes';
import type { ArcSaveGame } from '../savegame/arcSaveGame';

export interface ArcLocalObjectiveContext {
  arcDay: string;
  occurredAt?: string;
}

export interface ArcLocalObjectiveResult {
  completedMissionRunIds: string[];
  unlockedAchievementIds: number[];
  rewardCredits: number;
}

const createId = (prefix: string) => `${prefix}:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const clone = <T>(value: T): T => structuredClone(value);

function assertIdentity(save: ArcSaveGame): void {
  if (save.objectives.saveId !== save.saveId || save.objectives.characterId !== save.character.characterId
    || save.missions.identity !== save.saveId || save.achievements.userId !== save.saveId) {
    throw new Error('arc_local_objective_identity_mismatch');
  }
}

function onboardingStartDay(save: ArcSaveGame): string | undefined {
  return save.missions.events.find((event) => event.type === 'CHARACTER_CREATED')?.arcDay;
}

function occupiedRuns(save: ArcSaveGame): MissionRun[] {
  return save.missions.runs.filter((run) => run.slot_index !== 0 && ['active', 'completed', 'expired'].includes(run.state));
}

function titleFor(titleId: string, achievementId: number, unlockedAt: string): UserTitle {
  const entry = ARC_TITLE_CATALOG.find(([id]) => id === titleId);
  if (!entry) throw new Error('arc_local_title_catalog_entry_missing');
  return { title_id: titleId, name_de: entry[1], name_en: entry[2], source_achievement_id: achievementId, unlocked_at: unlockedAt };
}

function settleMissionReward(save: ArcSaveGame, run: MissionRun, completedAt: string): number {
  const settlementId = `mission:${run.run_id}`;
  let claim = save.missions.rewardClaims.find((item) => item.settlementId === settlementId);
  if (!claim) {
    claim = {
      settlementId, missionRunId: run.run_id, userId: save.saveId, missionId: run.mission_id,
      missionCatalogVersion: run.catalog_version, missionCatalogHash: run.mission_catalog_hash_snapshot,
      rewardCreditsSnapshot: run.reward_credits_snapshot, rewardFormulaVersion: run.reward_formula_version,
      completedAt, ruleSnapshotHash: null, status: 'pending', attemptCount: 0, lastAttemptAt: null,
      lastError: null, settledAt: null, serverTransactionId: null, authoritativeBalance: null,
    };
    save.missions.rewardClaims.push(claim);
  }
  if (claim.status === 'settled') return 0;
  const transaction = applyReward(save, settlementId, claim.rewardCreditsSnapshot, 'mission', {
    missionId: claim.missionId, missionRunId: claim.missionRunId,
    catalogVersion: claim.missionCatalogVersion,
  });
  const settled: MissionRewardClaim = {
    ...claim, status: 'settled', attemptCount: claim.attemptCount + 1, lastAttemptAt: completedAt,
    lastError: null, settledAt: completedAt, serverTransactionId: transaction.id,
    authoritativeBalance: save.economy.credits,
  };
  save.missions.rewardClaims[save.missions.rewardClaims.indexOf(claim)] = settled;
  run.reward_settlement_id = settlementId;
  save.missions.lastAuthoritativeCreditBalance = save.economy.credits;
  return transaction.amount;
}

async function settleAchievement(save: ArcSaveGame, achievementId: number, detectedAt: string): Promise<number> {
  const definition = ACHIEVEMENT_CATALOG.find((item) => item.achievement_id === achievementId);
  if (!definition) throw new Error('arc_local_achievement_not_found');
  const settlementId = `achievement:${ACHIEVEMENT_CATALOG_VERSION}:${achievementId}`;
  let claim = save.achievements.claims.find((item) => item.settlementId === settlementId);
  if (!claim) {
    claim = {
      settlementId, userId: save.saveId, achievementId, catalogVersion: ACHIEVEMENT_CATALOG_VERSION,
      catalogHash: await sha256Hex(serializeAchievementCatalog()), rewardCredits: definition.reward_credits,
      titleId: definition.title_id, detectedAt, status: 'pending', attemptCount: 0, lastAttemptAt: null,
      lastError: null, settledAt: null, serverTransactionId: null, authoritativeBalance: null,
    };
    save.achievements.claims.push(claim);
  }
  if (claim.status === 'settled') return 0;
  const transaction = applyReward(save, settlementId, claim.rewardCredits, 'achievement', {
    achievementId, catalogVersion: claim.catalogVersion,
  });
  const settled: AchievementClaim = {
    ...claim, status: 'settled', attemptCount: claim.attemptCount + 1, lastAttemptAt: detectedAt,
    lastError: null, settledAt: detectedAt, serverTransactionId: transaction.id,
    authoritativeBalance: save.economy.credits,
  };
  save.achievements.claims[save.achievements.claims.indexOf(claim)] = settled;
  if (definition.title_id && !save.titles.owned.some((title) => title.title_id === definition.title_id)) {
    save.titles.owned.push(titleFor(definition.title_id, achievementId, detectedAt));
  }
  return transaction.amount;
}

export async function activateLocalMission(
  save: ArcSaveGame,
  missionId: number,
  context: ArcLocalObjectiveContext,
  catalog: readonly MissionDefinition[] = PERSONAL_MISSION_CATALOG,
): Promise<MissionRun> {
  assertIdentity(save);
  const mission = catalog.find((item) => item.mission_id === missionId);
  if (!mission) throw new Error('arc_local_mission_not_found');
  const occupied = occupiedRuns(save);
  if (occupied.length >= 6) throw new Error('arc_local_mission_slots_full');
  if (occupied.some((run) => run.catalog_version === mission.catalog_version && run.mission_id === missionId)) throw new Error('arc_local_mission_already_active');
  if (!canRepeatMission(mission, save.missions.runs, context.arcDay)
    || !isMissionEligible(mission, save.missions.events, context.arcDay, onboardingStartDay(save))) {
    throw new Error('arc_local_mission_unavailable');
  }
  const slot = [1, 2, 3, 4, 5, 6].find((value) => !occupied.some((run) => run.slot_index === value));
  if (!slot) throw new Error('arc_local_mission_slots_full');
  const activatedAt = context.occurredAt ?? new Date().toISOString();
  const run: MissionRun = {
    run_id: createId('local-mission-run'), user_id: save.saveId, mission_id: missionId,
    catalog_version: mission.catalog_version, mission_catalog_hash_snapshot: await sha256Hex(serializeMissionCatalog(catalog)),
    slot_index: slot, state: 'active', start_arc_day: context.arcDay, activated_at: activatedAt,
    deadline_arc_day: calculateDeadline(mission, context.arcDay, onboardingStartDay(save)),
    reward_credits_snapshot: mission.reward_credits, reward_formula_version: mission.reward_formula_version,
    progress: { current: 0, target: 1, completed: false, details: {} },
    rule_snapshot: clone(mission.rule_definition), repeat_interval_days_snapshot: mission.repeat_interval_days,
    completed_at: null, completed_arc_day: null, cancelled_at: null, acknowledged_at: null,
    cooldown_until_arc_day: null, reward_settlement_id: null, mission: clone(mission),
    trust_registration_status: 'registered', trust_registration_attempt_count: 0,
    trust_registration_last_error: null,
  };
  run.progress = calculateMissionProgress(run.rule_snapshot, run, save.missions.events);
  save.missions.runs.push(run);
  const snapshot = save.achievements.snapshot ?? emptyAchievementSnapshot();
  snapshot.missionsActivated += 1;
  save.achievements.snapshot = snapshot;
  save.objectives.updatedAt = activatedAt;
  await evaluateLocalAchievements(save, activatedAt);
  return run;
}

export async function recordLocalObjectiveActivity(
  save: ArcSaveGame,
  event: Omit<ArcActivityEvent, 'identity'>,
): Promise<ArcLocalObjectiveResult> {
  assertIdentity(save);
  if (save.objectives.processedActivityEventIds.includes(event.eventId)) {
    return { completedMissionRunIds: [], unlockedAchievementIds: [], rewardCredits: 0 };
  }
  const fullEvent: ArcActivityEvent = { ...clone(event), identity: save.saveId };
  save.missions.events.push(fullEvent);
  save.objectives.processedActivityEventIds.push(event.eventId);
  const completedMissionRunIds: string[] = [];
  let rewardCredits = 0;
  for (let index = 0; index < save.missions.runs.length; index += 1) {
    const original = save.missions.runs[index];
    let evaluated = evaluateMission(original, save.missions.events, event.arcDay);
    if (evaluated.state === 'completed' && original.state === 'active') {
      evaluated = { ...evaluated, completed_at: event.occurredAt, completed_arc_day: event.arcDay,
        cooldown_until_arc_day: calculateCooldown({ ...evaluated, completed_at: event.occurredAt, completed_arc_day: event.arcDay }) };
      completedMissionRunIds.push(evaluated.run_id);
    }
    save.missions.runs[index] = evaluated;
    if (evaluated.state === 'completed') rewardCredits += settleMissionReward(save, evaluated, evaluated.completed_at ?? event.occurredAt);
  }
  const snapshot = updateAchievementSnapshotFromActivity(save, fullEvent, completedMissionRunIds);
  save.achievements.snapshot = snapshot;
  const unlockedAchievementIds = await evaluateLocalAchievements(save, event.occurredAt);
  rewardCredits += unlockedAchievementIds.reduce((sum, id) => {
    const claim = save.achievements.claims.find((item) => item.achievementId === id);
    return sum + (claim?.rewardCredits ?? 0);
  }, 0);
  save.objectives.updatedAt = event.occurredAt;
  return { completedMissionRunIds, unlockedAchievementIds, rewardCredits };
}

function updateAchievementSnapshotFromActivity(save: ArcSaveGame, event: ArcActivityEvent, completedRunIds: string[]): AchievementSnapshot {
  const snapshot = clone(save.achievements.snapshot ?? emptyAchievementSnapshot());
  if (event.type === 'DAILY_TASK_COMPLETED' && event.category) {
    const day = { ...(snapshot.completionsByDay[event.arcDay] ?? {}) };
    day[event.category] = (day[event.category] ?? 0) + 1;
    snapshot.completionsByDay[event.arcDay] = day;
    snapshot.dailyTotal += 1;
    snapshot.categoryCounts[event.category] = (snapshot.categoryCounts[event.category] ?? 0) + 1;
  }
  refreshDerivedAchievementState(save, snapshot);
  snapshot.activeDays = Object.keys(snapshot.completionsByDay).length;
  snapshot.maxStreak = Math.max(snapshot.maxStreak, save.progression.loginStreak);
  for (const runId of completedRunIds) {
    const run = save.missions.runs.find((item) => item.run_id === runId);
    if (!run) continue;
    snapshot.missionsCompleted += 1;
    snapshot.missionsByDifficulty[run.mission.difficulty] = (snapshot.missionsByDifficulty[run.mission.difficulty] ?? 0) + 1;
    snapshot.missionCompletionsByDay[event.arcDay] = (snapshot.missionCompletionsByDay[event.arcDay] ?? 0) + 1;
  }
  return snapshot;
}

function refreshDerivedAchievementState(save: ArcSaveGame, snapshot: AchievementSnapshot): void {
  snapshot.level = save.progression.level;
  snapshot.maxStreak = Math.max(snapshot.maxStreak, save.progression.loginStreak, ...Object.values(save.progression.statStreaks));
  snapshot.missionsActivated = Math.max(snapshot.missionsActivated, save.missions.runs.length);
  snapshot.missionsCompleted = Math.max(snapshot.missionsCompleted, save.missions.runs.filter((run) => run.completed_at !== null).length);
  snapshot.uniqueSkinIds = [...new Set(save.economy.inventory.filter((item) => item.itemType === 'skin').map((item) => item.itemId))];
  snapshot.skinTiers = Object.fromEntries(snapshot.uniqueSkinIds.map((itemId) => [itemId, String(getLocalShopItem(itemId)?.metadata.tier ?? '')]));
  snapshot.gameplayCredits = save.economy.transactions
    // Historical rewards still count so existing achievement progress is preserved.
    .filter((entry) => entry.amount > 0 && ['daily_wheel', 'mission_reward'].includes(entry.type))
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export async function evaluateLocalAchievements(save: ArcSaveGame, detectedAt = new Date().toISOString()): Promise<number[]> {
  assertIdentity(save);
  const snapshot = save.achievements.snapshot ?? emptyAchievementSnapshot();
  refreshDerivedAchievementState(save, snapshot);
  save.achievements.snapshot = snapshot;
  const newlyUnlocked: number[] = [];
  for (const definition of ACHIEVEMENT_CATALOG) {
    // Retain legacy social/ranking IDs for old saves, but never award them offline.
    if (!isActiveAchievement(definition)) continue;
    if (save.achievements.locallyUnlocked.includes(definition.achievement_id)) continue;
    if (!calculateAchievementProgress(definition, snapshot).completed) continue;
    save.achievements.locallyUnlocked.push(definition.achievement_id);
    await settleAchievement(save, definition.achievement_id, detectedAt);
    newlyUnlocked.push(definition.achievement_id);
  }
  return newlyUnlocked;
}

export function cancelLocalMission(save: ArcSaveGame, runId: string, context: ArcLocalObjectiveContext): void {
  assertIdentity(save);
  const run = save.missions.runs.find((item) => item.run_id === runId && item.state === 'active');
  if (!run) throw new Error('arc_local_mission_not_active');
  run.state = 'cancelled'; run.slot_index = 0; run.cancelled_at = context.occurredAt ?? new Date().toISOString();
  run.cooldown_until_arc_day = run.repeat_interval_days_snapshot ? addArcDays(context.arcDay, run.repeat_interval_days_snapshot) : null;
}

export function acknowledgeLocalMission(save: ArcSaveGame, runId: string, occurredAt = new Date().toISOString()): void {
  assertIdentity(save);
  const run = save.missions.runs.find((item) => item.run_id === runId && ['completed', 'expired'].includes(item.state));
  if (!run) throw new Error('arc_local_mission_not_acknowledgeable');
  run.state = 'acknowledged'; run.slot_index = 0; run.acknowledged_at = occurredAt;
}

export function equipLocalTitle(save: ArcSaveGame, titleId: string | null): void {
  assertIdentity(save);
  if (titleId !== null && !save.titles.owned.some((title) => title.title_id === titleId)) throw new Error('arc_local_title_not_owned');
  save.titles.equippedTitleId = titleId;
}

export function getLocalMissionPayload(save: ArcSaveGame, arcDay: string): PersonalMissionsPayload {
  assertIdentity(save);
  const occupied = occupiedRuns(save);
  const available = PERSONAL_MISSION_CATALOG.filter((mission) => mission.enabled)
    .filter((mission) => !occupied.some((run) => run.catalog_version === mission.catalog_version && run.mission_id === mission.mission_id))
    .filter((mission) => canRepeatMission(mission, save.missions.runs, arcDay))
    .filter((mission) => isMissionEligible(mission, save.missions.events, arcDay, onboardingStartDay(save)));
  return { arc_day: arcDay, credit_balance: save.economy.credits, active_runs: occupied,
    reward_claims: save.missions.rewardClaims, available, source: 'local', cloud_sync: 'not-configured',
    cooldowns: save.missions.runs.filter((run) => run.cooldown_until_arc_day && run.cooldown_until_arc_day > arcDay)
      .map((run) => ({ mission_id: run.mission_id, cooldown_until_arc_day: run.cooldown_until_arc_day! })) };
}
