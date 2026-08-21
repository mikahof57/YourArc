export type Gender = 'm' | 'f' | 'd';

export interface Habit {
  id: string;
  title: string;
  category?: 'strength' | 'discipline' | 'intellect' | 'vitality' | string;
  completed: boolean;
  streak: number;
  xpReward?: number;
  user_id?: string;
  updated_at?: string;
}

export interface CharacterStats {
  level: number;
  currentXp: number;
  maxXp: number;
  strength: number;
  discipline: number;
  intellect: number;
  vitality: number;
  id?: string;
  user_id?: string;
  updated_at?: string;
}

export interface UserProfile {
  name: string;
  gender: Gender;
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  avatarUrl: string;
  avatarCategory?: 'superheroes' | 'anime' | 'comic';
  isCreated: boolean;
  createdAt: string; // ISO string
  characterCode?: string; // e.g. 'CYBER-X79K-91'
  showAvatarFrame?: boolean; // toggle ranking frames on/off
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  order: number;
  tier?: number; // 0..12 difficulty tier based on stat percentage
  isCustom?: boolean; // true if added manually by user
}

export interface DeletedTaskItem {
  id: string;
  statId: string;
  statName: string;
  statEmoji: string;
  title: string;
  description: string;
  tier?: number;
  isCustom?: boolean;
  deletedAt: string; // ISO date string
}

export interface StatAttribute {
  id: string;
  name: string;
  emoji: string; // Custom emoji or icon identifier
  value: number; // 1 to 100
  startValue?: number; // Starting percentage (1-100) set at character creation or settings
  tasks: TaskItem[];
  taskSelectionMode: 'random' | 'sequential';
  currentTaskIndex?: number;
  completedToday?: boolean;
  isCustom?: boolean; // if custom user created stat
}

export type QuoteCategory = 'filme' | 'anime' | 'spiele' | 'religion' | 'philosophie';
export type ReligionSubCategory = 'christentum' | 'islam' | 'judentum' | 'buddhismus' | 'hinduismus';

export interface QuoteSettings {
  selectedCategories: QuoteCategory[] | ['alle'];
  selectedReligion?: ReligionSubCategory;
}

export interface Quote {
  id: string;
  text: string;
  textEn?: string;
  author: string;
  authorEn?: string;
  category: QuoteCategory;
  subCategory?: ReligionSubCategory;
  subCategoryEn?: string;
}

export type BottomBarModuleId = 'motivation' | 'business_ideas' | 'books' | 'biohacking' | 'stoic_rules';

export interface BottomBarModuleConfig {
  id: BottomBarModuleId;
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  active: boolean;
}

export interface DayHistoryRecord {
  date: string; // YYYY-MM-DD
  stats: Record<string, number>; // statId -> value
}

export interface FriendUser {
  id: string;
  name: string;
  characterCode: string;
  avatarUrl: string;
  level: number;
  isOnline: boolean;
  lastTaskCompletedText: string;
  statStreaks: Record<string, number>; // statId -> streak days
  totalPoints: number;
}

export interface ClanMember {
  id: string;
  name: string;
  characterCode: string;
  avatarUrl: string;
  role: 'leader' | 'officer' | 'member';
  isOnline: boolean;
  level: number;
  joinedAt: string;
}

export interface ClanBadgeConfig {
  shapeId: number; // 1 to 10 shield shapes
  colors: string[]; // 1 to 3 colors (e.g., ['#00f0ff', '#a855f7', '#ec4899'])
  emoji: string; // iOS emoji
}

export interface ClanJoinRequest {
  id: string;
  clanId: string;
  userId: string;
  userName: string;
  userCode: string;
  userAvatar: string;
  userLevel: number;
  userPoints: number;
  sentAt: string;
}

export interface ClanInvitation {
  id: string;
  clanId: string;
  clanName: string;
  clanTag: string;
  clanBadgeEmoji: string;
  clanBadgeConfig?: ClanBadgeConfig;
  fromUserName: string;
  sentAt: string;
}

export interface ClanData {
  id: string;
  name: string;
  tag: string;
  leaderCode: string;
  description: string;
  members: ClanMember[];
  clanPoints: number;
  badgeEmoji: string;
  badgeConfig?: ClanBadgeConfig;
  joinRequests?: ClanJoinRequest[];
}

export interface LeaderboardUser {
  id: string;
  name: string;
  characterCode: string;
  avatarUrl: string;
  level: number;
  standardPoints: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserCode: string;
  fromUserAvatar: string;
  fromUserLevel: number;
  fromUserPoints: number;
  sentAt: string;
  viaCode?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isUser?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  isGroup: boolean;
  avatarUrl?: string;
  memberIds: string[]; // Friend IDs or character codes
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  messages: ChatMessage[];
}

export interface ChatState {
  channels: ChatChannel[];
  clanMessages: ChatMessage[];
}

export interface UserAuthAccount {
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface WeeklyDayTask {
  id: string;
  text: string;
  completedDate?: string; // YYYY-MM-DD when completed
}

// 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
export type WeeklyRoutineState = Record<number, WeeklyDayTask[]>;

export interface CollapsedWindowsState {
  tasks?: boolean;
  quote?: boolean;
  weekly?: boolean;
  calendar?: boolean;
}

export interface AppState {
  profile: UserProfile;
  stats: StatAttribute[];
  quoteSettings: QuoteSettings;
  activeBottomModules: BottomBarModuleId[];
  lastActiveDate: string; // YYYY-MM-DD
  completedTasksToday: string[]; // array of statIds completed today
  history: DayHistoryRecord[];
  moduleReloadsCountToday?: number; // 0 to 3 reloads per day
  seenModuleItemIds?: Record<string, string[]>; // moduleId -> list of seen item IDs
  friends?: FriendUser[];
  incomingFriendRequests?: FriendRequest[];
  sentFriendRequestIds?: string[]; // IDs of players user sent request to
  declinedRequestsInfo?: Record<string, number>; // playerId -> timestamp when declined
  userClan?: ClanData | null;
  clans?: ClanData[];
  clanInvitations?: ClanInvitation[];
  sentClanJoinRequestIds?: string[]; // IDs of clans user requested to join
  statStreaks?: Record<string, number>; // statId -> streak in days for user
  chatState?: ChatState;
  deletedTasks?: DeletedTaskItem[];
  credits?: number; // Server-authoritative user credit balance cached locally
  consecutiveLoginDays?: number; // Daily consecutive login streak count
  lastDailyBonusDate?: string; // YYYY-MM-DD when last daily bonus was granted
  authAccount?: UserAuthAccount | null; // Logged in user account details
  ownedSkinIds?: string[]; // IDs of skins owned by user
  equippedSkinId?: string; // Currently equipped skin ID
  lastWheelSpinDate?: string; // YYYY-MM-DD when last daily wheel spin occurred
  hasUnlockedDesignCustomizer?: boolean; // Whether user purchased design customizer feature
  unlockedDesignColors?: string[]; // List of hex color codes unlocked individually by user
  selectedDesignColors?: string[]; // Up to 3 selected hex/color IDs e.g. ['#f59e0b', '#06b6d4']
  purchasedAnimationIds?: string[]; // IDs of purchased UI background animations
  equippedAnimationId?: string; // Currently active background animation ID
  calendarState?: CalendarState;
  weeklyRoutine?: WeeklyRoutineState;
  collapsedWindows?: CollapsedWindowsState;
}

export type CalendarEventType = 'appointment' | 'goal';

export interface CalendarEvent {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  date: string; // YYYY-MM-DD
  time?: string; // e.g. "14:30"
  type: CalendarEventType; // 'appointment' or 'goal'
  isCompleted?: boolean;
  createdByName?: string;
  createdByCode?: string;
}

export interface GroupCalendarMember {
  code: string;
  name: string;
  avatarUrl?: string;
  role: 'owner' | 'member';
}

export interface GroupCalendar {
  id: string;
  name: string;
  createdDate: string;
  members: GroupCalendarMember[];
  events: CalendarEvent[];
}

export interface CalendarState {
  privateEvents: CalendarEvent[];
  groupCalendars: GroupCalendar[];
  activeCalendarId: string; // 'private' or groupCalendar.id
}
