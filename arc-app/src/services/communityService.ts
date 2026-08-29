import { supabase } from '../lib/supabaseClient';
import { ClanData, ClanInvitation, ClanJoinRequest, FriendRequest, FriendUser, ChatChannel, ChatMessage, UserProfile } from '../types';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

export function getPostgrestErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (!error || typeof error !== 'object') return fallback;

  const candidate = error as Record<string, unknown>;
  const parts = [candidate.message, candidate.details, candidate.hint]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());
  const code = typeof candidate.code === 'string' && candidate.code.trim()
    ? `Code ${candidate.code.trim()}`
    : null;

  return [...new Set([...parts, ...(code ? [code] : [])])].join(' — ') || fallback;
}

function profileRowToFriend(row: any): FriendUser {
  return {
    id: row.user_id,
    name: row.name || 'OPERATIVE',
    characterCode: row.character_code || '',
    avatarUrl: row.avatar_url || FALLBACK_AVATAR,
    level: row.level || 1,
    isOnline: Boolean(row.is_online),
    lastTaskCompletedText: row.last_seen ? new Date(row.last_seen).toLocaleString() : 'Offline',
    statStreaks: {},
    totalPoints: row.standard_points || 0,
  };
}

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('user_id,name,avatar_url,gender,character_code,level,standard_points,credits').eq('user_id', user.id).single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(profile: Pick<UserProfile, 'name' | 'avatarUrl' | 'gender'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: profile.name,
      avatar_url: profile.avatarUrl,
      gender: profile.gender,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select('user_id,name,avatar_url,gender,character_code,level,standard_points,credits')
    .single();

  if (error) throw error;
  return data;
}

export async function findProfileByCode(code: string) {
  const clean = code.trim().toUpperCase();
  const { data, error } = await supabase.from('public_profiles').select('user_id').eq('character_code', clean).maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadFriends(): Promise<FriendUser[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('friendships').select('user_a,user_b').or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
  if (error) throw error;
  const ids = (data || []).map((f: any) => f.user_a === user.id ? f.user_b : f.user_a);
  if (!ids.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('public_profiles').select('user_id,name,character_code,avatar_url,level,is_online,last_seen,standard_points').in('user_id', ids);
  if (profileError) throw profileError;
  return (profiles || []).map(profileRowToFriend);
}

export async function loadFriendRequests(): Promise<FriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id,sender_id,created_at')
    .eq('receiver_id', user.id).eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  const senderIds = [...new Set((data || []).map((r: any) => r.sender_id))];
  if (!senderIds.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('public_profiles').select('user_id,name,character_code,avatar_url,level,standard_points').in('user_id', senderIds);
  if (profileError) throw profileError;
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
  return (data || []).map((r: any) => {
    const p = profileMap.get(r.sender_id) || {};
    return {
      id: r.id,
      fromUserId: r.sender_id,
      fromUserName: p.name || 'OPERATIVE',
      fromUserCode: p.character_code || '',
      fromUserAvatar: p.avatar_url || FALLBACK_AVATAR,
      fromUserLevel: p.level || 1,
      fromUserPoints: p.standard_points || 0,
      sentAt: r.created_at,
      viaCode: true,
    };
  });
}

export async function sendFriendRequestByCode(code: string) {
  const target = await findProfileByCode(code);
  if (!target) throw new Error('PLAYER_NOT_FOUND');
  const { error } = await supabase.rpc('send_friend_request', { p_receiver_id: target.user_id });
  if (error) throw error;
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
  const { error } = await supabase.rpc('respond_to_friend_request', { p_request_id: requestId, p_accept: accept });
  if (error) throw error;
}

export async function removeFriend(friendId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const [a, b] = [user.id, friendId].sort();
  const { error } = await supabase.from('friendships').delete().eq('user_a', a).eq('user_b', b);
  if (error) throw error;
}

export async function loadClans(): Promise<ClanData[]> {
  const { data: clans, error } = await supabase.from('clans').select('*').order('clan_points', { ascending: false });
  if (error) throw error;
  const clanIds = (clans || []).map((c: any) => c.id);
  if (!clanIds.length) return [];

  const [{ data: members, error: memberError }, { data: joinRequests, error: joinError }] = await Promise.all([
    supabase.from('clan_members').select('clan_id,user_id,role,joined_at').in('clan_id', clanIds),
    supabase.from('clan_join_requests').select('id,clan_id,user_id,status,created_at').in('clan_id', clanIds).eq('status', 'pending'),
  ]);
  if (memberError) throw memberError;
  if (joinError) throw joinError;

  const ids = [...new Set([
    ...(members || []).map((m: any) => m.user_id),
    ...(joinRequests || []).map((r: any) => r.user_id),
  ])];
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from('public_profiles').select('user_id,name,character_code,avatar_url,level,is_online,standard_points').in('user_id', ids)
    : { data: [] as any[], error: null };
  if (profileError) throw profileError;

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
  return (clans || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    tag: c.tag,
    leaderCode: profileMap.get(c.leader_id)?.character_code || '',
    description: c.description,
    clanPoints: c.clan_points || 0,
    badgeEmoji: c.badge_emoji,
    badgeConfig: c.badge_config,
    members: (members || []).filter((m: any) => m.clan_id === c.id).map((m: any) => {
      const p = profileMap.get(m.user_id) || {};
      return {
        id: m.user_id,
        name: p.name || 'OPERATIVE',
        characterCode: p.character_code || '',
        avatarUrl: p.avatar_url || FALLBACK_AVATAR,
        role: m.role,
        isOnline: Boolean(p.is_online),
        level: p.level || 1,
        joinedAt: m.joined_at?.slice(0,10) || '',
      };
    }),
    joinRequests: (joinRequests || []).filter((r: any) => r.clan_id === c.id).map((r: any) => {
      const p = profileMap.get(r.user_id) || {};
      return {
        id: r.id,
        clanId: r.clan_id,
        userId: r.user_id,
        userName: p.name || 'OPERATIVE',
        userCode: p.character_code || '',
        userAvatar: p.avatar_url || FALLBACK_AVATAR,
        userLevel: p.level || 1,
        userPoints: p.standard_points || 0,
        sentAt: r.created_at,
      };
    }),
  }));
}

export async function createClan(input: { name: string; tag: string; description: string; badgeEmoji: string; badgeConfig: any }) {
  const { data, error } = await supabase.rpc('create_clan', {
    p_name: input.name,
    p_tag: input.tag,
    p_description: input.description,
    p_badge_emoji: input.badgeEmoji,
    p_badge_config: input.badgeConfig,
  });
  if (error) throw error;
  return data as string;
}

export async function requestClanJoin(clanId: string) {
  const { error } = await supabase.rpc('request_clan_join', { p_clan_id: clanId });
  if (error) throw error;
}

export async function acceptClanJoin(requestId: string) {
  const { data, error } = await supabase.rpc('accept_clan_join_request', { p_request_id: requestId });
  if (error) throw error;
  return data;
}

export async function declineClanJoin(requestId: string) {
  const { error } = await supabase.rpc('decline_clan_join_request', { p_request_id: requestId });
  if (error) throw error;
}

export async function loadChatState(): Promise<{ channels: ChatChannel[]; clanMessages: ChatMessage[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { channels: [], clanMessages: [] };
  const { data: memberships, error } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
  if (error) throw error;
  const ids = (memberships || []).map((m: any) => m.conversation_id);
  if (!ids.length) return { channels: [], clanMessages: [] };
  const { data: conversations } = await supabase.from('conversations').select('*').in('id', ids);
  const { data: members } = await supabase.from('conversation_members').select('conversation_id,user_id').in('conversation_id', ids);
  const { data: messages } = await supabase.from('messages').select('id,conversation_id,sender_id,content,created_at').in('conversation_id', ids).order('created_at', { ascending: true });
  const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
  const { data: profiles } = senderIds.length ? await supabase.from('public_profiles').select('user_id,name,avatar_url').in('user_id', senderIds) : { data: [] as any[] };
  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
  const channels: ChatChannel[] = (conversations || []).filter((c: any) => c.type !== 'clan').map((c: any) => {
    const channelMessages = (messages || []).filter((m: any) => m.conversation_id === c.id).map((m: any) => {
      const p = profileMap.get(m.sender_id) || {};
      return { id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, senderName: p.name || 'OPERATIVE', senderAvatar: p.avatar_url || FALLBACK_AVATAR, text: m.content, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: m.sender_id === user.id };
    });
    return { id: c.id, name: c.name || 'Chat', isGroup: c.type === 'group', memberIds: (members || []).filter((m: any) => m.conversation_id === c.id).map((m: any) => m.user_id), messages: channelMessages, lastMessage: channelMessages.at(-1)?.text, lastMessageTime: channelMessages.at(-1)?.timestamp, unreadCount: 0 };
  });
  const clanMessages: ChatMessage[] = (messages || []).filter((m: any) => (conversations || []).find((c: any) => c.id === m.conversation_id && c.type === 'clan')).map((m: any) => {
    const p = profileMap.get(m.sender_id) || {};
    return { id: m.id, conversationId: m.conversation_id, senderId: m.sender_id, senderName: p.name || 'OPERATIVE', senderAvatar: p.avatar_url || FALLBACK_AVATAR, text: m.content, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isUser: m.sender_id === user.id };
  });
  return { channels, clanMessages };
}

export async function getOrCreateDirectConversation(friendId: string) {
  const { data, error } = await supabase.rpc('create_direct_conversation', { p_friend_id: friendId });
  if (error) throw error;
  return data as string;
}

export async function sendMessage(conversationId: string, text: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, content: text.trim() });
  if (error) throw error;
}

export async function loadMyBlockedUserIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((row: { blocked_id: string }) => row.blocked_id);
}

export async function blockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { p_blocked_id: userId });
  if (error) throw error;
}

export async function unblockUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { p_blocked_id: userId });
  if (error) throw error;
}

export async function reportUser(input: {
  reportedUserId: string;
  reason: string;
  conversationId?: string;
  messageId?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('report_user', {
    p_reported_user_id: input.reportedUserId,
    p_reason: input.reason.trim(),
    p_conversation_id: input.conversationId || null,
    p_message_id: input.messageId || null,
  });
  if (error) throw error;
  return data as string;
}


export async function createGroupConversation(name: string, friendIds: string[]) {
  const { data, error } = await supabase.rpc('create_group_conversation', {
    p_name: name.trim(),
    p_friend_ids: friendIds,
  });
  if (error) throw error;
  return data as string;
}

export async function sendClanInvitationByCode(clanId: string, code: string) {
  const target = await findProfileByCode(code);
  if (!target) throw new Error('PLAYER_NOT_FOUND');
  const { data, error } = await supabase.rpc('send_clan_invitation', {
    p_clan_id: clanId,
    p_receiver_id: target.user_id,
  });
  if (error) throw error;
  return data as string;
}

export async function loadClanInvitations(): Promise<ClanInvitation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('clan_invitations')
    .select('id,clan_id,sender_id,status,created_at')
    .eq('receiver_id', user.id).eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  const clanIds = [...new Set((data || []).map((r: any) => r.clan_id))];
  const senderIds = [...new Set((data || []).map((r: any) => r.sender_id))];
  const [{ data: clans }, { data: senders }] = await Promise.all([
    clanIds.length ? supabase.from('clans').select('*').in('id', clanIds) : Promise.resolve({ data: [] as any[] }),
    senderIds.length ? supabase.from('public_profiles').select('user_id,name').in('user_id', senderIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const clanMap = new Map<string, any>((clans || []).map((c: any) => [c.id, c]));
  const senderMap = new Map<string, any>((senders || []).map((p: any) => [p.user_id, p]));
  return (data || []).map((r: any) => {
    const c = clanMap.get(r.clan_id) || {};
    const p = senderMap.get(r.sender_id) || {};
    return {
      id: r.id,
      clanId: r.clan_id,
      clanName: c.name || 'Clan',
      clanTag: c.tag || '',
      clanBadgeEmoji: c.badge_emoji || '🛡️',
      clanBadgeConfig: c.badge_config || {},
      fromUserName: p.name || 'OPERATIVE',
      sentAt: r.created_at,
    };
  });
}

export async function respondToClanInvitation(invitationId: string, accept: boolean) {
  const { data, error } = await supabase.rpc('respond_to_clan_invitation', {
    p_invitation_id: invitationId,
    p_accept: accept,
  });
  if (error) throw error;
  return data as string;
}

export async function setClanMemberRole(clanId: string, memberId: string, role: 'officer' | 'member') {
  const { error } = await supabase.rpc('set_clan_member_role', {
    p_clan_id: clanId, p_member_id: memberId, p_role: role,
  });
  if (error) throw error;
}

export async function removeClanMember(clanId: string, memberId: string) {
  const { error } = await supabase.rpc('remove_clan_member', { p_clan_id: clanId, p_member_id: memberId });
  if (error) throw error;
}

export async function leaveClan(clanId: string, successorId?: string) {
  const { error } = await supabase.rpc('leave_clan', { p_clan_id: clanId, p_successor_id: successorId || null });
  if (error) throw error;
}


export async function setOnlineStatus(isOnline: boolean) {
  const { error } = await supabase.rpc('set_my_online_status', { p_is_online: isOnline });
  if (error) throw error;
}

export async function loadOwnedInventory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('user_inventory').select('item_id,item_type').eq('user_id', user.id);
  if (error) throw error;
  return data || [];
}

export async function spendCredits(amount: number, type: string, referenceId?: string, metadata: Record<string, any> = {}) {
  const { data, error } = await supabase.rpc('spend_credits', {
    p_amount: amount,
    p_type: type,
    p_reference_id: referenceId || null,
    p_metadata: metadata,
  });
  if (error) throw error;
  return data as number;
}

export async function purchaseStoreItem(itemId: string) {
  const { data, error } = await supabase.rpc('purchase_store_item', { p_item_id: itemId });
  if (error) throw error;
  return data as number;
}

export interface DailyWheelResult {
  reward: number;
  balance: number;
}

export async function claimDailyWheel(): Promise<DailyWheelResult> {
  const { data, error } = await supabase.rpc('claim_daily_wheel');
  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  const reward = Number(result?.reward);
  const balance = Number(result?.balance);
  if (!Number.isFinite(reward) || !Number.isFinite(balance)) {
    throw new Error('Invalid daily wheel response');
  }

  return { reward, balance };
}

export function subscribeToCommunity(callback: () => void) {
  return supabase.channel(`arc-community-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_join_requests' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_invitations' }, callback)
    .subscribe();
}

export function subscribeToMessages(callback: () => void) {
  return supabase.channel(`arc-messages-${crypto.randomUUID()}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback).subscribe();
}


export async function getOrCreateClanConversation(clanId: string) {
  const { data, error } = await supabase.rpc('create_or_get_clan_conversation', { p_clan_id: clanId });
  if (error) throw error;
  return data as string;
}
