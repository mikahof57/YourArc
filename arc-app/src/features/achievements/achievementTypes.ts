export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementSection = 'career' | 'body_mind' | 'money_business' | 'versatility' | 'consistency' | 'missions' | 'shop' | 'gameplay_credits' | 'community' | 'meta_ranking';
export type AchievementRule =
  | { type: 'daily_total' | 'level' | 'active_days' | 'max_streak' | 'missions_completed' | 'epic_missions' | 'skins_owned' | 'gameplay_credits' | 'friends'; target: number }
  | { type: 'category_total'; categories: string[]; target: number }
  | { type: 'category_each'; categories: string[]; target: number }
  | { type: 'areas_each'; target: number }
  | { type: 'areas_on_day'; areas: number; days: number }
  | { type: 'tasks_on_day'; target: number }
  | { type: 'mission_activated' | 'mission_all_difficulties' | 'skin_tier' | 'clan_joined' | 'clan_founder_five' | 'clan_admin_received' | 'account_started'; target?: number; tier?: string }
  | { type: 'meta'; level: number; daily: number; missions: number }
  | { type: 'complete_package' }
  | { type: 'global_rank'; rank: number; population: number }
  | { type: 'clan_rank'; rank: number; population: number };

export interface AchievementDefinition {
  achievement_id: number; catalog_version: string; title_de: string; title_en: string;
  condition_de: string; condition_en: string; section: AchievementSection;
  rarity: AchievementRarity; reward_credits: number; title_id: string | null;
  rule: AchievementRule; sort_order: number; availability: 'active' | 'inactive_legacy';
}

export interface AchievementSnapshot {
  dailyTotal: number; level: number; categoryCounts: Record<string, number>;
  completionsByDay: Record<string, Record<string, number>>; maxStreak: number; activeDays: number;
  missionsActivated: number; missionsCompleted: number; missionsByDifficulty: Record<string, number>;
  missionCompletionsByDay: Record<string, number>; uniqueSkinIds: string[]; skinTiers: Record<string, string>;
  gameplayCredits: number; confirmedFriends: number; clanJoined: boolean; foundedClanReachedFive: boolean;
  receivedClanAdminRole: boolean; globalRankMilestones: Array<{ rank: number; population: number }>;
  clanRankMilestones: Array<{ rank: number; population: number }>;
}

export interface AchievementProgress { current: number; target: number; completed: boolean; label?: string }
export type AchievementSettlementStatus = 'pending' | 'settling' | 'settled' | 'failed_retryable' | 'failed_terminal';
export interface AchievementClaim {
  settlementId: string; userId: string; achievementId: number; catalogVersion: string; catalogHash: string;
  rewardCredits: number; titleId: string | null; detectedAt: string; status: AchievementSettlementStatus;
  attemptCount: number; lastAttemptAt: string | null; lastError: string | null; settledAt: string | null;
  serverTransactionId: string | null; authoritativeBalance: number | null;
}
export interface AchievementLocalState { version: 1; userId: string; locallyUnlocked: number[]; claims: AchievementClaim[]; snapshot: AchievementSnapshot | null }
export interface UserTitle { title_id: string; name_de: string; name_en: string; source_achievement_id: number; unlocked_at: string }
