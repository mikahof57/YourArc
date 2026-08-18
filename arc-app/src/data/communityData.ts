import { FriendUser, ClanData, LeaderboardUser, ChatState, FriendRequest } from '../types';

export function generateCharacterCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const num = Math.floor(10 + Math.random() * 90);
  return `CYBER-${rand}-${num}`;
}

export const INITIAL_FRIENDS: FriendUser[] = [];

export const INITIAL_INCOMING_FRIEND_REQUESTS: FriendRequest[] = [];

export const GLOBAL_COMMUNITY_PLAYERS: LeaderboardUser[] = [];

export const DEFAULT_CHAT_STATE: ChatState = {
  channels: [],
  clanMessages: [],
};

export const INITIAL_CLANS: ClanData[] = [];
export const INITIAL_LEADERBOARD: LeaderboardUser[] = GLOBAL_COMMUNITY_PLAYERS;



