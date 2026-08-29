import React, { useState, useEffect, useRef } from 'react';
import {
  AppState,
  FriendUser,
  ClanData,
  ClanMember,
  LeaderboardUser,
  UserProfile,
  StatAttribute,
  FriendRequest,
  ClanJoinRequest,
  ClanInvitation,
} from '../../types';
import {
  X,
  Users,
  Shield,
  Trophy,
  Flame,
  Plus,
  Copy,
  Check,
  UserPlus,
  Crown,
  Search,
  Zap,
  Radio,
  LogOut,
  Info,
  Trash2,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  ShieldCheck,
  UserMinus,
  Loader2,
} from 'lucide-react';
import {
  INITIAL_FRIENDS,
  INITIAL_CLANS,
  INITIAL_LEADERBOARD,
  GLOBAL_COMMUNITY_PLAYERS,
  INITIAL_INCOMING_FRIEND_REQUESTS,
} from '../../data/communityData';
import {
  ClanShieldBadge,
  SHIELD_SHAPES,
  PRESET_COLORS,
  POPULAR_IOS_EMOJIS,
} from '../ClanShieldBadge';
import {
  loadClans, loadFriendRequests, loadFriends, respondToFriendRequest, removeFriend,
  sendFriendRequestByCode, createClan as createClanBackend, requestClanJoin,
  loadClanInvitations, respondToClanInvitation, sendClanInvitationByCode,
  acceptClanJoin, declineClanJoin, setClanMemberRole, removeClanMember, leaveClan,
  subscribeToCommunity,
} from '../../services/communityService';

function getCommunityErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Unknown error';

  const candidate = error as Record<string, unknown>;
  const parts = [candidate.message, candidate.details, candidate.hint]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());
  const code = typeof candidate.code === 'string' && candidate.code.trim()
    ? `Code ${candidate.code.trim()}`
    : null;

  return [...new Set([...parts, ...(code ? [code] : [])])].join(' — ') || 'Unknown error';
}

interface CommunityModalProps {
  appState: AppState;
  lang?: string;
  onUpdateAppState: (updated: Partial<AppState>) => void;
  onClose: () => void;
}

export function getFlameInfo(streakDays: number, lang: string = 'en') {
  const isEn = lang === 'en';
  if (streakDays < 3) {
    return { showFlame: false, isGolden: false, colorClass: '', label: '', intensityStage: 0 };
  }

  if (streakDays >= 30) {
    return {
      showFlame: true,
      isGolden: true,
      colorClass: 'text-amber-400 fill-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,1)] animate-bounce',
      label: isEn ? `${streakDays} Days Golden Flame! 🌟` : `${streakDays} Tage Golden Flame! 🌟`,
      intensityStage: 10,
    };
  }

  const stage = Math.floor((streakDays - 3) / 3) + 1; // 1 to 9

  const stageStyles: Record<number, { colorClass: string; label: string }> = {
    1: { colorClass: 'text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]', label: isEn ? `${streakDays}d Streak (Level 1)` : `${streakDays}d Streak (Stufe 1)` },
    2: { colorClass: 'text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]', label: isEn ? `${streakDays}d Streak (Level 2)` : `${streakDays}d Streak (Stufe 2)` },
    3: { colorClass: 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]', label: isEn ? `${streakDays}d Streak (Level 3)` : `${streakDays}d Streak (Stufe 3)` },
    4: { colorClass: 'text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]', label: isEn ? `${streakDays}d Streak (Level 4)` : `${streakDays}d Streak (Stufe 4)` },
    5: { colorClass: 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]', label: isEn ? `${streakDays}d Streak (Level 5)` : `${streakDays}d Streak (Stufe 5)` },
    6: { colorClass: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]', label: isEn ? `${streakDays}d Streak (Level 6)` : `${streakDays}d Streak (Stufe 6)` },
    7: { colorClass: 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]', label: isEn ? `${streakDays}d Streak (Level 7)` : `${streakDays}d Streak (Stufe 7)` },
    8: { colorClass: 'text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.9)]', label: isEn ? `${streakDays}d Streak (Level 8)` : `${streakDays}d Streak (Stufe 8)` },
    9: { colorClass: 'text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,1)] animate-pulse', label: isEn ? `${streakDays}d Streak (Level 9)` : `${streakDays}d Streak (Stufe 9)` },
  };

  const currentStyle = stageStyles[stage] || stageStyles[1];

  return {
    showFlame: true,
    isGolden: false,
    colorClass: currentStyle.colorClass,
    label: currentStyle.label,
    intensityStage: stage,
  };
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  appState,
  lang = 'en',
  onUpdateAppState,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'clan' | 'clan_ranking' | 'leaderboard'>('friends');

  // Friends & Clans local state derived only from actual saved appState
  const friendsList = appState.friends || [];
  const userClan = appState.userClan !== undefined ? appState.userClan : null;
  const allClans = appState.clans || [];

  // Friend Requests state
  const incomingRequests: FriendRequest[] =
    appState.incomingFriendRequests !== undefined
      ? appState.incomingFriendRequests
      : INITIAL_INCOMING_FRIEND_REQUESTS;
  const sentRequestIds: string[] = appState.sentFriendRequestIds || [];
  const declinedRequestsInfo: Record<string, number> = appState.declinedRequestsInfo || {};

  // Leaderboard action feedback
  const [leaderboardFeedback, setLeaderboardFeedback] = useState<{
    id: string;
    text: string;
    isError?: boolean;
  } | null>(null);

  // Add friend state
  const [addFriendCode, setAddFriendCode] = useState('');
  const [addFriendName, setAddFriendName] = useState('');
  const [friendFeedback, setFriendFeedback] = useState<string | null>(null);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Create clan form state
  const [isCreatingClan, setIsCreatingClan] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  const [newClanEmoji, setNewClanEmoji] = useState('🛡️');
  const [newClanDesc, setNewClanDesc] = useState('');
  const [badgeShapeId, setBadgeShapeId] = useState<number>(1);
  const [badgeColors, setBadgeColors] = useState<string[]>(['#00f0ff', '#a855f7']);
  const [isCreatingClanPending, setIsCreatingClanPending] = useState(false);
  const [clanCreationSucceeded, setClanCreationSucceeded] = useState(false);
  const [clanCreationStatus, setClanCreationStatus] = useState<{
    text: string;
    type: 'error' | 'warning';
  } | null>(null);
  const clanCreationInFlight = useRef(false);

  // Invite member state
  const [inviteMemberCode, setInviteMemberCode] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Load real community state from Supabase whenever the modal opens.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [profile, friends, requests, clans, invitations] = await Promise.all([
          (await import('../../services/communityService')).getMyProfile(),
          loadFriends(),
          loadFriendRequests(),
          loadClans(),
          loadClanInvitations(),
        ]);
        if (!active) return;
        if (profile) {
          onUpdateAppState({
            credits: profile.credits ?? appState.credits ?? 0,
            friends,
            incomingFriendRequests: requests,
            clans,
            clanInvitations: invitations,
            userClan: clans.find((c) => c.members.some((m) => m.characterCode === profile.character_code)) || null,
          });
        }
      } catch (error) {
        console.error('Community backend load failed:', error);
      }
    })();
    const realtime = subscribeToCommunity(async () => {
      try {
        const [friends, requests, clans, invitations] = await Promise.all([
          loadFriends(), loadFriendRequests(), loadClans(), loadClanInvitations()
        ]);
        if (active) onUpdateAppState({
          friends, incomingFriendRequests: requests, clans, clanInvitations: invitations,
          userClan: clans.find((c) => c.members.some((m) => m.characterCode === characterCode)) || null,
        });
      } catch (error) {
        console.error('Community realtime refresh failed:', error);
      }
    });
    return () => { active = false; realtime.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const characterCode = appState.profile.characterCode || 'CYBER-OPERATOR-01';

  // Calculate User Level & Standard Points (compare ONLY collected/earned percentage points, excluding initial starting values)
  const defaultStatIds = ['wissen', 'muskeln', 'geist', 'beweglichkeit', 'business', 'geld'];
  const userStandardPoints = appState.stats
    .filter((s) => !s.isCustom && defaultStatIds.includes(s.id))
    .reduce((acc, s) => acc + Math.max(0, s.value - (s.startValue || 0)), 0);
  const totalLvl = Math.max(1, Math.floor(appState.stats.reduce((acc, s) => acc + s.value, 0) / (appState.stats.length || 1)));

  // User's own entry
  const userLeaderboardEntry: LeaderboardUser = {
    id: 'user-self',
    name: appState.profile.name || 'OPERATOR',
    characterCode: characterCode,
    avatarUrl: appState.profile.avatarUrl || 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
    level: totalLvl,
    standardPoints: userStandardPoints,
    rank: 0,
    isCurrentUser: true,
  };

  // Build Leaderboard for ALL players who created a character
  const realFriendEntries: LeaderboardUser[] = friendsList.map((f) => ({
    id: f.id,
    name: f.name,
    characterCode: f.characterCode,
    avatarUrl: f.avatarUrl,
    level: f.level,
    standardPoints: f.totalPoints,
    rank: 0,
  }));

  const realClanMembers: LeaderboardUser[] = (userClan?.members || [])
    .filter((m) => m.characterCode !== characterCode && !friendsList.some((f) => f.characterCode === m.characterCode))
    .map((m) => ({
      id: m.id,
      name: m.name,
      characterCode: m.characterCode,
      avatarUrl: m.avatarUrl,
      level: m.level,
      standardPoints: m.level * 10,
      rank: 0,
    }));

  const rawLeaderboard = [
    userLeaderboardEntry,
    ...realFriendEntries,
    ...realClanMembers,
    ...GLOBAL_COMMUNITY_PLAYERS,
  ];

  // Unique players deduplicated by characterCode or id
  const uniqueLeaderboard = rawLeaderboard.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.characterCode === item.characterCode || t.id === item.id)
  );

  uniqueLeaderboard.sort((a, b) => b.standardPoints - a.standardPoints);
  const fullLeaderboard = uniqueLeaderboard.map((u, idx) => ({ ...u, rank: idx + 1 }));

  const currentUserRank = fullLeaderboard.find((u) => u.isCurrentUser)?.rank || 1;

  // Copy Character Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(characterCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Send friend request from leaderboard (only real profiles can be requested).
  const handleSendRequestFromLeaderboard = async (player: LeaderboardUser) => {
    try {
      await sendFriendRequestByCode(player.characterCode);
      setLeaderboardFeedback({ id: player.id, text: lang === 'en' ? '✓ Friend request sent!' : '✓ Freundesanfrage gesendet!', isError: false });
    } catch (error: any) {
      const messages: Record<string, string> = {
        SELF_REQUEST: lang === 'en' ? 'You cannot add yourself.' : 'Du kannst dich nicht selbst hinzufügen.',
        ALREADY_FRIENDS: lang === 'en' ? 'This player is already your friend.' : 'Dieser Spieler ist bereits dein Freund.',
        REQUEST_EXISTS: lang === 'en' ? 'A request is already pending.' : 'Eine Anfrage ist bereits offen.',
        PLAYER_NOT_FOUND: lang === 'en' ? 'Player not found.' : 'Spieler nicht gefunden.',
      };
      setLeaderboardFeedback({ id: player.id, text: messages[error?.message] || (lang === 'en' ? 'Could not send request.' : 'Anfrage konnte nicht gesendet werden.'), isError: true });
    }
    setTimeout(() => setLeaderboardFeedback(null), 4000);
  };

  // Add Friend Request via Character Code - now stored in Supabase.
  const handleAddFriendByCode = async () => {
    if (!addFriendCode.trim()) return;
    const cleanCode = addFriendCode.trim().toUpperCase();
    try {
      await sendFriendRequestByCode(cleanCode);
      setAddFriendCode('');
      setAddFriendName('');
      setFriendFeedback(lang === 'en' ? '✓ Friend request sent! Waiting for approval.' : '✓ Freundesanfrage gesendet! Warte auf die Annahme.');
      setTimeout(() => setFriendFeedback(null), 4000);
    } catch (error: any) {
      const messages: Record<string, string> = {
        SELF_REQUEST: lang === 'en' ? 'You cannot send a request to yourself.' : 'Du kannst dir nicht selbst eine Anfrage senden.',
        ALREADY_FRIENDS: lang === 'en' ? 'This player is already your friend.' : 'Dieser Spieler ist bereits dein Freund.',
        REQUEST_EXISTS: lang === 'en' ? 'A request is already pending.' : 'Eine Anfrage ist bereits offen.',
        PLAYER_NOT_FOUND: lang === 'en' ? 'No player found for this character code.' : 'Kein Spieler mit diesem Charakter-Code gefunden.',
      };
      setFriendFeedback(messages[error?.message] || (lang === 'en' ? 'Could not send request.' : 'Anfrage konnte nicht gesendet werden.'));
    }
  };

  const handleAcceptRequest = async (req: FriendRequest) => {
    try {
      await respondToFriendRequest(req.id, true);
      const [friends, requests] = await Promise.all([loadFriends(), loadFriendRequests()]);
      onUpdateAppState({ friends, incomingFriendRequests: requests });
    } catch (error) {
      console.error('Accept friend request failed:', error);
    }
  };

  const handleDeclineRequest = async (req: FriendRequest) => {
    try {
      await respondToFriendRequest(req.id, false);
      const requests = await loadFriendRequests();
      onUpdateAppState({ incomingFriendRequests: requests });
    } catch (error) {
      console.error('Decline friend request failed:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      onUpdateAppState({ friends: await loadFriends() });
    } catch (error) {
      console.error('Remove friend failed:', error);
    }
  };

  // Clan action feedback
  const [clanFeedback, setClanFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Successor selection state when founder leaves
  const [showLeaveSuccessorModal, setShowLeaveSuccessorModal] = useState(false);
  const [selectedSuccessorCode, setSelectedSuccessorCode] = useState<string>('');

  // Derived Clan Roles
  const currentUserClanMember = userClan?.members.find((m) => m.characterCode === characterCode);
  const isUserClanFounder = userClan
    ? userClan.leaderCode === characterCode || currentUserClanMember?.role === 'leader'
    : false;
  const isUserClanAdmin = userClan ? isUserClanFounder || currentUserClanMember?.role === 'officer' : false;

  // Incoming Invitations & Sent Requests
  const clanInvitations = appState.clanInvitations || [];
  const sentClanJoinRequestIds = appState.sentClanJoinRequestIds || [];

  // Create Clan - persisted in Supabase.
  const handleCreateClan = async () => {
    if (clanCreationInFlight.current || clanCreationSucceeded) return;

    const name = newClanName.trim();
    const tag = newClanTag.trim().toUpperCase();
    if (name.length < 2 || name.length > 40) {
      setClanCreationStatus({
        text: lang === 'en'
          ? 'Clan name must be 2–40 characters long.'
          : 'Der Clanname muss 2–40 Zeichen lang sein.',
        type: 'error',
      });
      return;
    }
    if (tag.length < 2 || tag.length > 8) {
      setClanCreationStatus({
        text: lang === 'en'
          ? 'Clan tag must be 2–8 characters long.'
          : 'Der Clan-Tag muss 2–8 Zeichen lang sein.',
        type: 'error',
      });
      return;
    }

    setClanCreationStatus(null);
    clanCreationInFlight.current = true;
    setIsCreatingClanPending(true);
    try {
      await createClanBackend({
        name,
        tag,
        description: newClanDesc.trim() || 'Neuer Cyber Clan',
        badgeEmoji: newClanEmoji.trim() || '🛡️',
        badgeConfig: { shapeId: badgeShapeId, colors: badgeColors.length ? badgeColors : ['#00f0ff'], emoji: newClanEmoji.trim() || '🛡️' },
      });
      setClanCreationSucceeded(true);
    } catch (error: unknown) {
      setClanCreationStatus({
        text: `${lang === 'en' ? 'Clan creation failed' : 'Clan-Erstellung fehlgeschlagen'}: ${getCommunityErrorMessage(error)}`,
        type: 'error',
      });
      clanCreationInFlight.current = false;
      setIsCreatingClanPending(false);
      return;
    }

    try {
      const clans = await loadClans();
      const profile = await (await import('../../services/communityService')).getMyProfile();
      onUpdateAppState({ clans, userClan: profile ? clans.find((c) => c.members.some((m) => m.characterCode === profile.character_code)) || null : null });
      setIsCreatingClan(false);
      setNewClanName(''); setNewClanTag(''); setNewClanDesc('');
      setClanCreationStatus(null);
      setClanCreationSucceeded(false);
    } catch (error: unknown) {
      setClanCreationStatus({
        text: `${lang === 'en'
          ? 'Clan was created, but the Community view could not be refreshed. Please reload.'
          : 'Der Clan wurde erstellt, aber die Community-Ansicht konnte nicht aktualisiert werden. Bitte lade neu.'} (${getCommunityErrorMessage(error)})`,
        type: 'warning',
      });
    } finally {
      clanCreationInFlight.current = false;
      setIsCreatingClanPending(false);
    }
  };

  // Toggle badge colors (1 to 3 simultaneously)
  const toggleBadgeColor = (hex: string) => {
    if (badgeColors.includes(hex)) {
      if (badgeColors.length > 1) {
        setBadgeColors(badgeColors.filter((c) => c !== hex));
      }
    } else {
      if (badgeColors.length < 3) {
        setBadgeColors([...badgeColors, hex]);
      } else {
        setBadgeColors([badgeColors[0], badgeColors[1], hex]);
      }
    }
  };

  // Request to Join Clan - persisted in Supabase.
  const handleRequestJoinClan = async (clan: ClanData) => {
    if (userClan) { setClanFeedback({ text: lang === 'en' ? 'You are already in a clan.' : 'Du bist bereits in einem Clan.', isError: true }); return; }
    if (clan.members.length >= 30) { setClanFeedback({ text: lang === 'en' ? 'This clan is full.' : 'Dieser Clan ist voll.', isError: true }); return; }
    try {
      await requestClanJoin(clan.id);
      setClanFeedback({ text: lang === 'en' ? '✓ Join request sent!' : '✓ Beitrittsanfrage gesendet!', isError: false });
    } catch (error: any) {
      setClanFeedback({ text: error?.message || (lang === 'en' ? 'Could not send join request.' : 'Beitrittsanfrage konnte nicht gesendet werden.'), isError: true });
    }
    setTimeout(() => setClanFeedback(null), 4000);
  };

  // Accept Join Request - server-authoritative.
  const handleAcceptJoinRequest = async (req: ClanJoinRequest) => {
    if (!userClan) return;
    try {
      await acceptClanJoin(req.id);
      const clans = await loadClans();
      onUpdateAppState({
        clans,
        userClan: clans.find((c) => c.id === userClan.id) || null,
      });
      setClanFeedback({
        text: lang === 'en' ? `✓ ${req.userName} was added to the clan!` : `✓ ${req.userName} wurde in den Clan aufgenommen!`,
        isError: false,
      });
    } catch (error: any) {
      setClanFeedback({ text: error?.message || (lang === 'en' ? 'Could not accept request.' : 'Anfrage konnte nicht angenommen werden.'), isError: true });
    }
    setTimeout(() => setClanFeedback(null), 4000);
  };

  // Decline Join Request - server-authoritative.
  const handleDeclineJoinRequest = async (reqId: string) => {
    try {
      await declineClanJoin(reqId);
      const clans = await loadClans();
      onUpdateAppState({
        clans,
        userClan: userClan ? clans.find((c) => c.id === userClan.id) || null : null,
      });
    } catch (error) {
      console.error('Decline clan request failed:', error);
    }
  };

  // Send Clan Invitation - server-authoritative.
  const handleSendClanInvitation = async () => {
    if (!inviteMemberCode.trim() || !userClan) return;
    if (userClan.members.length >= 30) {
      setInviteFeedback(lang === 'en' ? 'Clan full! Maximum 30 members reached.' : 'Clan voll! Maximum 30 Mitglieder erreicht.');
      return;
    }
    try {
      await sendClanInvitationByCode(userClan.id, inviteMemberCode.trim());
      const invitations = await loadClanInvitations();
      onUpdateAppState({ clanInvitations: invitations });
      setInviteMemberCode('');
      setInviteFeedback(lang === 'en' ? '✓ Clan invitation sent!' : '✓ Clan-Einladung gesendet!');
    } catch (error: any) {
      const map: Record<string,string> = {
        PLAYER_NOT_FOUND: lang === 'en' ? 'Player not found.' : 'Spieler nicht gefunden.',
        already_member: lang === 'en' ? 'Player is already a member.' : 'Spieler ist bereits Mitglied.',
        invitation_exists: lang === 'en' ? 'An invitation is already pending.' : 'Eine Einladung ist bereits offen.',
        not_authorized: lang === 'en' ? 'You are not allowed to invite members.' : 'Du darfst keine Mitglieder einladen.',
      };
      setInviteFeedback(map[error?.message] || (error?.message || (lang === 'en' ? 'Invitation failed.' : 'Einladung fehlgeschlagen.')));
    }
    setTimeout(() => setInviteFeedback(null), 4000);
  };

  // Accept Incoming Clan Invitation - server-authoritative.
  const handleAcceptClanInvitation = async (inv: ClanInvitation) => {
    try {
      await respondToClanInvitation(inv.id, true);
      const [clans, invitations] = await Promise.all([loadClans(), loadClanInvitations()]);
      const profile = await (await import('../../services/communityService')).getMyProfile();
      onUpdateAppState({
        clans,
        clanInvitations: invitations,
        userClan: profile ? clans.find((c) => c.members.some((m) => m.characterCode === profile.character_code)) || null : null,
      });
    } catch (error: any) {
      alert(error?.message || (lang === 'en' ? 'Could not accept invitation.' : 'Einladung konnte nicht angenommen werden.'));
    }
  };

  const handleDeclineClanInvitation = async (invId: string) => {
    try {
      await respondToClanInvitation(invId, false);
      onUpdateAppState({ clanInvitations: await loadClanInvitations() });
    } catch (error) {
      console.error('Decline clan invitation failed:', error);
    }
  };

  // Promote / demote members - server-authoritative.
  const handlePromoteToAdmin = async (member: ClanMember) => {
    if (!userClan || !isUserClanFounder) return;
    try {
      await setClanMemberRole(userClan.id, member.id, 'officer');
      const clans = await loadClans();
      onUpdateAppState({ clans, userClan: clans.find((c) => c.id === userClan.id) || null });
    } catch (error) {
      console.error('Promote member failed:', error);
    }
  };

  const handleDemoteAdmin = async (member: ClanMember) => {
    if (!userClan || !isUserClanFounder) return;
    try {
      await setClanMemberRole(userClan.id, member.id, 'member');
      const clans = await loadClans();
      onUpdateAppState({ clans, userClan: clans.find((c) => c.id === userClan.id) || null });
    } catch (error) {
      console.error('Demote member failed:', error);
    }
  };

  // Kick / Remove Member - server-authoritative.
  const handleKickMember = async (memberToKick: ClanMember) => {
    if (!userClan) return;
    if (memberToKick.characterCode === characterCode) {
      await handleInitiateLeaveClan();
      return;
    }
    try {
      await removeClanMember(userClan.id, memberToKick.id);
      const clans = await loadClans();
      onUpdateAppState({ clans, userClan: clans.find((c) => c.id === userClan.id) || null });
    } catch (error: any) {
      setClanFeedback({ text: error?.message || (lang === 'en' ? 'Could not remove member.' : 'Mitglied konnte nicht entfernt werden.'), isError: true });
      setTimeout(() => setClanFeedback(null), 4000);
    }
  };

  // Leave Clan - server-authoritative.
  const handleInitiateLeaveClan = async () => {
    if (!userClan) return;
    const otherMembers = userClan.members.filter((m) => m.characterCode !== characterCode);
    if (isUserClanFounder && otherMembers.length > 0) {
      setShowLeaveSuccessorModal(true);
      setSelectedSuccessorCode(otherMembers[0].characterCode);
      return;
    }
    try {
      await leaveClan(userClan.id);
      const clans = await loadClans();
      onUpdateAppState({ clans, userClan: null });
      setClanFeedback({
        text: lang === 'en' ? 'You have successfully left the clan.' : 'Du hast den Clan erfolgreich verlassen.',
        isError: false,
      });
    } catch (error: any) {
      setClanFeedback({ text: error?.message || (lang === 'en' ? 'Could not leave clan.' : 'Clan konnte nicht verlassen werden.'), isError: true });
    }
    setTimeout(() => setClanFeedback(null), 4000);
  };

  // Confirm Founder Leaving after selecting successor.
  const handleConfirmFounderLeave = async () => {
    if (!userClan || !selectedSuccessorCode) return;
    const successor = userClan.members.find((m) => m.characterCode === selectedSuccessorCode);
    if (!successor) return;
    try {
      await leaveClan(userClan.id, successor.id);
      const clans = await loadClans();
      onUpdateAppState({ clans, userClan: null });
      setShowLeaveSuccessorModal(false);
      setClanFeedback({
        text: lang === 'en' ? `You left the clan. ${successor.name} is now the new clan founder!` : `Du hast den Clan verlassen. ${successor.name} ist nun der neue Clan-Gründer!`,
        isError: false,
      });
    } catch (error: any) {
      setClanFeedback({ text: error?.message || (lang === 'en' ? 'Could not leave clan.' : 'Clan konnte nicht verlassen werden.'), isError: true });
    }
    setTimeout(() => setClanFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-xl p-4 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[92vh] flex flex-col">
        {/* Corner Cyber Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title & Character Code Badge */}
        <div className="border-b border-slate-800 pb-4 mb-4 pr-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>COMMUNITY & CLAN NETWORK</span>
              </h2>
            </div>

            {/* Individual Character Code Box */}
            <div className="bg-slate-950/90 border border-cyan-500/40 px-3 py-1.5 rounded-lg flex items-center space-x-2 shrink-0 shadow-inner">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                {lang === 'en' ? 'Your Code:' : 'Dein Code:'}
              </span>
              <span className="text-xs font-bold text-cyan-300 tracking-widest">{characterCode}</span>
              <button
                onClick={handleCopyCode}
                title={lang === 'en' ? 'Copy Character Code' : 'Charakter-Code kopieren'}
                className="p-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 transition-all ml-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 mt-4">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'friends'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? `Friends (${friendsList.length})` : `Freunde (${friendsList.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('clan')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'clan'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? `My Clan ${userClan ? `[${userClan.tag}]` : ''}`
                  : `Mein Clan ${userClan ? `[${userClan.tag}]` : ''}`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('clan_ranking')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'clan_ranking'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? `Clan Rankings (${allClans.length})`
                  : `Clan-Rangliste (${allClans.length})`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? `Leaderboard (#Rank ${currentUserRank})`
                  : `Bestenliste (#Rank ${currentUserRank})`}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: FREUNDE */}
        {activeTab === 'friends' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Incoming Friend Requests Section */}
            {incomingRequests.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-3 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>
                      {lang === 'en'
                        ? `Pending Friend Requests (${incomingRequests.length})`
                        : `Offene Freundesanfragen (${incomingRequests.length})`}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'en' ? 'Confirmation Required' : 'Bestätigung erforderlich'}
                  </span>
                </div>

                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={req.fromUserAvatar}
                          alt={req.fromUserName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-cyan-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <span className="font-bold text-slate-100 text-sm truncate">{req.fromUserName}</span>
                            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 shrink-0 font-bold">
                              LVL {req.fromUserLevel}
                            </span>
                            {req.viaCode && (
                              <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold shrink-0">
                                {lang === 'en' ? 'Via Code' : 'Per Code'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {req.fromUserPoints} {lang === 'en' ? 'Points' : 'Punkte'} • {req.sentAt}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs transition-all flex items-center space-x-1 shadow-md active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Accept' : 'Annehmen'}</span>
                        </button>

                        <button
                          onClick={() => handleDeclineRequest(req)}
                          className="bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-3 py-1.5 rounded text-xs transition-all flex items-center space-x-1 active:scale-95"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{lang === 'en' ? 'Decline' : 'Ablehnen'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Friend Input Box */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center space-x-1.5">
                <UserPlus className="w-4 h-4" />
                <span>
                  {lang === 'en'
                    ? 'Send Friend Request via Character Code'
                    : 'Freundesanfrage per Charakter-Code senden'}
                </span>
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={addFriendCode}
                  onChange={(e) => setAddFriendCode(e.target.value)}
                  placeholder={lang === 'en' ? 'Character Code (e.g. CYBER-VRTX-88)' : 'Charakter-Code (z.B. CYBER-VRTX-88)'}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400 uppercase tracking-wider"
                />
                <input
                  type="text"
                  value={addFriendName}
                  onChange={(e) => setAddFriendName(e.target.value)}
                  placeholder={lang === 'en' ? 'Player Name (Optional)' : 'Spieler-Name (Optional)'}
                  className="w-full sm:w-44 bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleAddFriendByCode}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-all uppercase tracking-wider shrink-0 shadow-md active:scale-95"
                >
                  {lang === 'en' ? 'Send Request' : 'Anfrage Senden'}
                </button>
              </div>

              {friendFeedback && (
                <p className={`text-xs font-bold ${friendFeedback.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {friendFeedback}
                </p>
              )}
            </div>

            {/* Friends Cards List */}
            {friendsList.length === 0 ? (
              <div className="bg-slate-950/80 p-8 rounded-xl border border-slate-800 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300 uppercase">
                  {lang === 'en' ? 'No friends added yet' : 'Noch keine Freunde hinzugefügt'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {lang === 'en'
                    ? 'Enter your friend\'s character code above (e.g. CYBER-ABCD-12) to add them. You can copy and share your own code above!'
                    : 'Gib oben den Charakter-Code deines Freundes ein (z.B. CYBER-ABCD-12), um ihn hinzuzufügen. Du kannst deinen eigenen Code oben kopieren und teilen!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendsList.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Avatar with Online/Offline Dot */}
                        <div className="relative">
                          <img
                            src={friend.avatarUrl}
                            alt={friend.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                              friend.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600'
                            }`}
                            title={friend.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100 text-sm">{friend.name}</span>
                            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
                              LVL {friend.level}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                            Code: {friend.characterCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block max-w-[180px] sm:max-w-none">
                            {friend.lastTaskCompletedText}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-bold">
                            {lang === 'en' ? 'Points:' : 'Punkte:'} {friend.totalPoints} %
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          title={lang === 'en' ? 'Remove friend' : 'Freund entfernen'}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status Streaks with Intensifying Flame Progression */}
                    <div className="pt-2 border-t border-slate-900">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                        {lang === 'en'
                          ? 'Attribute Training Streaks & Flames:'
                          : 'Status-Training Streaks & Flammen:'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(friend.statStreaks).map(([statKey, days]) => {
                          const streakDays = typeof days === 'number' ? days : Number(days) || 0;
                          const flameInfo = getFlameInfo(streakDays, lang);
                          return (
                            <div
                              key={statKey}
                              className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-xs"
                              title={flameInfo.label || (lang === 'en' ? `${streakDays} Days Training` : `${streakDays} Tage Training`)}
                            >
                              <span className="capitalize text-slate-300 font-medium">{statKey}:</span>
                              <span className="font-bold text-cyan-300">{streakDays}d</span>

                              {flameInfo.showFlame && (
                                <Flame className={`w-4 h-4 ${flameInfo.colorClass}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLAN */}
        {activeTab === 'clan' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Global Clan Feedback Alert Banner */}
            {clanFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-between ${
                  clanFeedback.isError
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                }`}
              >
                <span>{clanFeedback.text}</span>
                <button
                  onClick={() => setClanFeedback(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Incoming Clan Invitations Banner (if user received invitations) */}
            {clanInvitations.length > 0 && (
              <div className="bg-slate-950/90 p-4 rounded-xl border border-cyan-500/40 space-y-3 shadow-lg">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>
                    {lang === 'en'
                      ? `Open Clan Invitations (${clanInvitations.length})`
                      : `Offene Clan-Einladungen (${clanInvitations.length})`}
                  </span>
                </span>

                <div className="space-y-2">
                  {clanInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <ClanShieldBadge config={inv.clanBadgeConfig} fallbackEmoji={inv.clanBadgeEmoji} size="sm" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100 text-xs">{inv.clanName}</span>
                            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-500/40">
                              [{inv.clanTag}]
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {lang === 'en' ? 'Invited by:' : 'Eingeladen von:'}{' '}
                            <strong className="text-slate-200">{inv.fromUserName}</strong> ({inv.sentAt})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleAcceptClanInvitation(inv)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded text-xs font-bold transition-all"
                        >
                          {lang === 'en' ? 'Accept' : 'Annehmen'}
                        </button>
                        <button
                          onClick={() => handleDeclineClanInvitation(inv.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs font-bold transition-all"
                        >
                          {lang === 'en' ? 'Decline' : 'Ablehnen'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userClan ? (
              <div className="space-y-4">
                {/* Clan Banner Card */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-5 rounded-xl border border-cyan-500/40 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center space-x-3">
                      <ClanShieldBadge config={userClan.badgeConfig} fallbackEmoji={userClan.badgeEmoji} size="lg" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-bold text-slate-100 uppercase">{userClan.name}</h3>
                          <span className="text-xs bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-500/40">
                            [{userClan.tag}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{userClan.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 min-w-[100px]">
                        <span className="text-[10px] text-slate-400 block uppercase">
                          {lang === 'en' ? 'Clan Points' : 'Clan-Punkte'}
                        </span>
                        <span className="text-lg font-bold text-cyan-400">{userClan.clanPoints} PTS</span>
                      </div>

                      <div className="text-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 min-w-[100px]">
                        <span className="text-[10px] text-slate-400 block uppercase">
                          {lang === 'en' ? 'Members' : 'Mitglieder'}
                        </span>
                        <span className="text-lg font-bold text-slate-200">
                          {userClan.members.length}/30
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clan Rules Info Banner */}
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-lg">
                    <p className="flex items-center space-x-1 text-cyan-300 font-bold">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{lang === 'en' ? 'Clan Points Rules:' : 'Clan-Punkte Regelwerk:'}</span>
                    </p>
                    <p>
                      {lang === 'en'
                        ? '• 10% earned percentage points in standard stats of all members = 1 Clan Point.'
                        : '• 10% erreichte Prozentpunkte in Standard-Statuswerten aller Mitglieder = 1 Clan-Punkt.'}
                    </p>
                    <p>
                      {lang === 'en'
                        ? '• Clan points decrease by 1 point per day if no member completes a daily task.'
                        : '• Die Clan-Punkte sinken um 1 Punkt pro Tag, wenn kein einziges Mitglied eine tägliche Aufgabe erledigt.'}
                    </p>
                    <p className="text-amber-400/90">
                      {lang === 'en'
                        ? '• Custom/user-created stats or tasks do not count towards Clan Points!'
                        : '• Eigene/benutzerdefinierte Statuswerte oder Aufgaben zählen nicht für Clan-Punkte!'}
                    </p>
                  </div>
                </div>

                {/* Pending Clan Join Requests Section (Visible to Founder or Admin) */}
                {isUserClanAdmin && (userClan.joinRequests || []).length > 0 && (
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-amber-500/40 space-y-3 shadow-lg">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>
                        {lang === 'en'
                          ? `Pending Join Requests (${(userClan.joinRequests || []).length})`
                          : `Offene Beitrittsanfragen (${(userClan.joinRequests || []).length})`}
                      </span>
                    </span>

                    <div className="space-y-2">
                      {(userClan.joinRequests || []).map((req) => (
                        <div
                          key={req.id}
                          className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={req.userAvatar}
                              alt={req.userName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-100 text-xs">{req.userName}</span>
                                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/40">
                                  LVL {req.userLevel}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">Code: {req.userCode}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleAcceptJoinRequest(req)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? 'Accept' : 'Annehmen'}</span>
                            </button>
                            <button
                              onClick={() => handleDeclineJoinRequest(req.id)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? 'Decline' : 'Ablehnen'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invite Member Box (Founder & Admin) */}
                {isUserClanAdmin && (
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center space-x-1.5">
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {lang === 'en'
                          ? 'Invite player to your clan (via code)'
                          : 'Spieler in deinen Clan einladen (per Code)'}
                      </span>
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteMemberCode}
                        onChange={(e) => setInviteMemberCode(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g. CYBER-VRTX-88' : 'z.B. CYBER-VRTX-88'}
                        className="flex-1 bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400 uppercase tracking-wider"
                      />
                      <button
                        onClick={handleSendClanInvitation}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-all uppercase tracking-wider shrink-0"
                      >
                        {lang === 'en' ? 'Invite' : 'Einladen'}
                      </button>
                    </div>

                    {inviteFeedback && (
                      <p className={`text-xs ${inviteFeedback.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {inviteFeedback}
                      </p>
                    )}
                  </div>
                )}

                {/* Member List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    {lang === 'en'
                      ? `Clan Members (${userClan.members.length}/30)`
                      : `Clan Mitglieder (${userClan.members.length}/30)`}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {userClan.members.map((member) => {
                      const isLeader = member.role === 'leader' || userClan.leaderCode === member.characterCode;
                      const isOfficer = member.role === 'officer';
                      const isSelf = member.characterCode === characterCode;

                      return (
                        <div
                          key={member.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                            isSelf
                              ? 'bg-cyan-950/40 border-cyan-500/50'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded object-cover border border-slate-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-200 truncate">{member.name}</span>
                                {isLeader ? (
                                  <span className="inline-flex items-center space-x-0.5 text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                                    <Crown className="w-3 h-3 text-amber-400" />
                                    <span>{lang === 'en' ? 'Founder' : 'Gründer'}</span>
                                  </span>
                                ) : isOfficer ? (
                                  <span className="inline-flex items-center space-x-0.5 text-[10px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/40 font-bold">
                                    <ShieldCheck className="w-3 h-3 text-purple-400" />
                                    <span>{lang === 'en' ? 'Admin' : 'Admin'}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">
                                    {lang === 'en' ? 'Member' : 'Mitglied'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate">Code: {member.characterCode}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-[10px] bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800">
                              LVL {member.level}
                            </span>

                            {/* Gründer Management Options */}
                            {isUserClanFounder && !isSelf && (
                              <>
                                {member.role === 'member' && (
                                  <button
                                    onClick={() => handlePromoteToAdmin(member)}
                                    title={lang === 'en' ? 'Promote to Admin' : 'Zum Admin ernennen'}
                                    className="text-[10px] bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 px-2 py-1 rounded font-bold transition-all"
                                  >
                                    + Admin
                                  </button>
                                )}
                                {member.role === 'officer' && (
                                  <button
                                    onClick={() => handleDemoteAdmin(member)}
                                    title={lang === 'en' ? 'Demote Admin' : 'Admin-Rechte entziehen'}
                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded font-bold transition-all"
                                  >
                                    - Admin
                                  </button>
                                )}
                                <button
                                  onClick={() => handleKickMember(member)}
                                  title={lang === 'en' ? 'Kick from clan' : 'Aus Clan kicken'}
                                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Admin Management Options (cannot kick Gründer or other Admins) */}
                            {isUserClanAdmin && !isUserClanFounder && !isSelf && member.role === 'member' && (
                              <button
                                onClick={() => handleKickMember(member)}
                                title={lang === 'en' ? 'Kick from clan' : 'Aus Clan kicken'}
                                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Founder Leave Successor Selection Box */}
                {showLeaveSuccessorModal && (
                  <div className="bg-rose-950/90 border border-rose-500/50 p-4 rounded-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs uppercase">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? 'Successor Requirement for Clan Founder'
                          : 'Nachfolger-Pflicht für Clan-Gründer'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lang === 'en'
                        ? 'As founder, you must select a successor before leaving the clan. They will receive all founder rights.'
                        : 'Als Clan-Gründer musst du vor dem Verlassen des Clans einen Nachfolger wählen. Dieser erhält alle Gründer-Rechte.'}
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        {lang === 'en' ? 'Select new Leader:' : 'Neuen Gründer wählen:'}
                      </label>
                      <select
                        value={selectedSuccessorCode}
                        onChange={(e) => setSelectedSuccessorCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                      >
                        {userClan.members
                          .filter((m) => m.characterCode !== characterCode)
                          .map((m) => (
                            <option key={m.id} value={m.characterCode}>
                              {m.name} ({m.characterCode}) {m.role === 'officer' ? '[Admin]' : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setShowLeaveSuccessorModal(false)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-bold transition-all"
                      >
                        {lang === 'en' ? 'Cancel' : 'Abbrechen'}
                      </button>
                      <button
                        onClick={handleConfirmFounderLeave}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-all shadow-md"
                      >
                        {lang === 'en'
                          ? 'Confirm Successor & Leave Clan'
                          : 'Nachfolger Bestätigen & Clan Verlassen'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Leave Clan Action */}
                {!showLeaveSuccessorModal && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleInitiateLeaveClan}
                      className="flex items-center space-x-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded text-xs transition-all font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Leave Clan' : 'Clan verlassen'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* NO CLAN - SHOW JOIN & CREATE OPTIONS */
              <div className="space-y-5">
                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 text-center space-y-3">
                  <Shield className="w-10 h-10 text-cyan-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-100 uppercase">
                    {lang === 'en' ? 'You are currently not in a clan' : 'Du bist aktuell in keinem Clan'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {lang === 'en'
                      ? 'Send a join request to an open clan or create your own clan with a custom badge!'
                      : 'Sende eine Beitrittsanfrage an einen offenen Clan oder gründe deinen eigenen Clan mit individuellem Wappen!'}
                  </p>

                  <button
                    onClick={() => {
                      setIsCreatingClan(!isCreatingClan);
                      if (!clanCreationSucceeded) setClanCreationStatus(null);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded text-xs transition-all uppercase tracking-wider"
                  >
                    {isCreatingClan
                      ? (lang === 'en' ? 'Cancel' : 'Abbrechen')
                      : (lang === 'en' ? 'Create Own Clan' : 'Eigenen Clan Gründen')}
                  </button>
                </div>

                {/* Create Clan Form with Wappen Designer */}
                {isCreatingClan && (
                  <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-cyan-500/40 space-y-4 animate-fadeIn">
                    <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>
                        {lang === 'en' ? 'Create Clan & Design Badge' : 'Clan Erstellen & Wappen Designen'}
                      </span>
                    </h4>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-bold">
                          {lang === 'en' ? 'Clan Name' : 'Clan Name'}
                        </label>
                        <input
                          type="text"
                          value={newClanName}
                          onChange={(e) => {
                            setNewClanName(e.target.value);
                            if (!clanCreationSucceeded) setClanCreationStatus(null);
                          }}
                          placeholder={lang === 'en' ? 'e.g. Cyber Titans' : 'z.B. Cyber Titans'}
                          maxLength={40}
                          className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-bold">
                          {lang === 'en' ? 'Clan Tag (2-8 characters)' : 'Clan Tag (2-8 Zeichen)'}
                        </label>
                        <input
                          type="text"
                          value={newClanTag}
                          onChange={(e) => {
                            setNewClanTag(e.target.value.toUpperCase());
                            if (!clanCreationSucceeded) setClanCreationStatus(null);
                          }}
                          placeholder={lang === 'en' ? 'e.g. TITAN' : 'z.B. TITAN'}
                          maxLength={8}
                          className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1 font-bold">
                        {lang === 'en' ? 'Clan Description' : 'Clan Beschreibung'}
                      </label>
                      <input
                        type="text"
                        value={newClanDesc}
                        onChange={(e) => setNewClanDesc(e.target.value)}
                        placeholder={lang === 'en' ? 'Motto and focus of your clan...' : 'Motto und Fokus deines Clans...'}
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* CLAN WAPPEN DESIGNER */}
                    <div className="bg-slate-900/90 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                          {lang === 'en' ? 'Clan Badge Customizer' : 'Clan-Wappen Customizer'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {lang === 'en' ? 'Live Preview' : 'Live Vorschau'}
                        </span>
                      </div>

                      {/* Live Badge Preview */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                        <ClanShieldBadge
                          config={{
                            shapeId: badgeShapeId,
                            colors: badgeColors,
                            emoji: newClanEmoji || '🛡️',
                          }}
                          size="xl"
                        />
                        <div className="text-center sm:text-left space-y-1">
                          <h5 className="font-bold text-slate-100 text-sm">
                            {newClanName.trim() || (lang === 'en' ? 'Your Clan' : 'Dein Clan')} [{newClanTag.trim() || 'TAG'}]
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            {lang === 'en'
                              ? `Shield shape #${badgeShapeId} • ${badgeColors.length} color(s) selected`
                              : `Schildform #${badgeShapeId} • ${badgeColors.length} Farbe(n) gewählt`}
                          </p>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                            {badgeColors.map((col, i) => (
                              <span
                                key={i}
                                className="w-4 h-4 rounded-full border border-white/40 shadow-sm inline-block"
                                style={{ backgroundColor: col }}
                                title={`Farbe ${i + 1}: ${col}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 1. Schildform (10 Schildformen) */}
                      <div>
                        <label className="block text-xs text-slate-300 mb-2 font-bold flex items-center justify-between">
                          <span>
                            {lang === 'en'
                              ? '1. Select Shield Shape (10 Variants)'
                              : '1. Schildform Wählen (10 Varianten)'}
                          </span>
                          <span className="text-cyan-400 font-mono text-[10px]">Form #{badgeShapeId}</span>
                        </label>

                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                          {SHIELD_SHAPES.map((shape) => {
                            const isSelected = badgeShapeId === shape.id;
                            return (
                              <button
                                key={shape.id}
                                type="button"
                                onClick={() => setBadgeShapeId(shape.id)}
                                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                                  isSelected
                                    ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] scale-105'
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                }`}
                                title={shape.name}
                              >
                                <ClanShieldBadge
                                  config={{
                                    shapeId: shape.id,
                                    colors: badgeColors,
                                    emoji: newClanEmoji || '🛡️',
                                  }}
                                  size="sm"
                                />
                                <span className="text-[9px] text-slate-300 font-bold truncate w-full text-center">
                                  #{shape.id}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Farben (1 bis 3 gleichzeitig) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-slate-300 font-bold">
                            {lang === 'en'
                              ? '2. Badge Colors (Select 1 - 3)'
                              : '2. Wappen-Farben (1 - 3 gleichzeitig wählbar)'}
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {lang === 'en' ? 'Active:' : 'Aktiv:'}{' '}
                            <strong className="text-cyan-400">{badgeColors.length}/3</strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2.5">
                          {PRESET_COLORS.map((hex) => {
                            const isSelected = badgeColors.includes(hex);
                            const selectedIndex = badgeColors.indexOf(hex);
                            return (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => toggleBadgeColor(hex)}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center relative transition-all active:scale-95 ${
                                  isSelected
                                    ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] scale-110'
                                    : 'border-slate-800 opacity-80 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: hex }}
                                title={hex}
                              >
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-slate-950 bg-white/90 px-1 rounded-full">
                                    {selectedIndex + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. iOS Emoji Wahl */}
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-bold">
                          {lang === 'en'
                            ? '3. Badge Emoji (Any iOS Keyboard Emoji)'
                            : '3. Wappen-Emoji (beliebiges iOS Keyboard Emoji)'}
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newClanEmoji}
                            onChange={(e) => setNewClanEmoji(e.target.value)}
                            placeholder={lang === 'en' ? 'Type/paste emoji...' : 'Emoji hier eingeben/einfügen...'}
                            maxLength={4}
                            className="w-24 bg-slate-950 border border-slate-700 text-center text-lg text-white rounded px-2 py-1.5 outline-none focus:border-cyan-400"
                          />
                          <p className="text-[10px] text-slate-400 flex-1 flex items-center">
                            {lang === 'en'
                              ? 'Type any emoji from your keyboard or choose from the presets below:'
                              : 'Tippe ein beliebiges Emoji von deiner iOS-Tastatur ein oder wähle aus den Vorlagen unten:'}
                          </p>
                        </div>

                        {/* Quick iOS Emoji Palette */}
                        <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800 max-h-28 overflow-y-auto">
                          {POPULAR_IOS_EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setNewClanEmoji(em)}
                              className={`p-1.5 text-base rounded hover:bg-slate-900 transition-all ${
                                newClanEmoji === em ? 'bg-cyan-950 border border-cyan-400 scale-110' : ''
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {clanCreationStatus && (
                      <div
                        role="alert"
                        className={`rounded-lg border px-3 py-2.5 text-xs font-bold leading-relaxed ${
                          clanCreationStatus.type === 'warning'
                            ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {clanCreationStatus.text}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCreateClan}
                      disabled={isCreatingClanPending || clanCreationSucceeded}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-lg transition-all active:scale-98 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      {isCreatingClanPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isCreatingClanPending
                        ? (lang === 'en' ? 'Creating Clan…' : 'Clan wird erstellt…')
                        : clanCreationSucceeded
                          ? (lang === 'en' ? 'Clan Created' : 'Clan erstellt')
                          : (lang === 'en' ? 'Confirm & Create Clan Now' : 'Clan Jetzt Bestätigen & Gründen')}
                    </button>
                  </div>
                )}

                {/* Public Clans List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    {lang === 'en'
                      ? 'Browse Available Clans & Request to Join'
                      : 'Verfügbare Clans Durchsuchen & Beitritt Anfragen'}
                  </span>

                  {allClans.length === 0 ? (
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                      {lang === 'en'
                        ? 'No open clans exist yet. Create the first clan above!'
                        : 'Es existieren noch keine offenen Clans. Gründe oben den ersten Clan!'}
                    </div>
                  ) : (
                    allClans.map((clan) => {
                      const isRequestPending =
                        sentClanJoinRequestIds.includes(clan.id) ||
                        (clan.joinRequests || []).some((r) => r.userCode === characterCode);

                      return (
                        <div
                          key={clan.id}
                          className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-3">
                            <ClanShieldBadge config={clan.badgeConfig} fallbackEmoji={clan.badgeEmoji} size="md" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-100 text-sm">{clan.name}</span>
                                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-bold border border-cyan-500/40">
                                  [{clan.tag}]
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{clan.description}</p>
                              <span className="text-[10px] text-slate-500 block mt-1">
                                {lang === 'en'
                                  ? `Members: ${clan.members.length}/30 | Points: ${clan.clanPoints}`
                                  : `Mitglieder: ${clan.members.length}/30 | Punkte: ${clan.clanPoints}`}
                              </span>
                            </div>
                          </div>

                          {isRequestPending ? (
                            <span className="bg-slate-900 border border-slate-700 text-slate-400 px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{lang === 'en' ? 'Request Pending' : 'Anfrage Ausstehend'}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequestJoinClan(clan)}
                              className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-3.5 py-1.5 rounded text-xs font-bold transition-all shrink-0"
                            >
                              {lang === 'en' ? 'Request to Join' : 'Beitritt Anfragen'}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLAN RANKING */}
        {activeTab === 'clan_ranking' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {lang === 'en'
                  ? 'Global Clan Rankings (by Clan Points)'
                  : 'Globale Clan-Rangliste (nach Clan-Punkten)'}
              </span>

              {allClans.length === 0 ? (
                <div className="bg-slate-950/80 p-8 rounded-xl border border-slate-800 text-center space-y-3">
                  <Crown className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase">
                    {lang === 'en' ? 'No Clans Available' : 'Keine Clans vorhanden'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {lang === 'en'
                      ? 'No clans created yet. Go to "My Clan" tab and create the first clan!'
                      : 'Es wurden noch keine Clans gegründet. Gehe zum Reiter \'Mein Clan\' und gründe den ersten Clan!'}
                  </p>
                </div>
              ) : (
                allClans
                  .slice()
                  .sort((a, b) => b.clanPoints - a.clanPoints)
                  .map((clan, idx) => {
                    const rank = idx + 1;
                    const isUserClan = userClan?.id === clan.id;

                    return (
                      <div
                        key={clan.id}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isUserClan
                            ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Rank Badge */}
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 bg-slate-900 border border-slate-800">
                            {rank === 1 ? (
                              <span className="text-amber-400">🥇</span>
                            ) : rank === 2 ? (
                              <span className="text-slate-300">🥈</span>
                            ) : rank === 3 ? (
                              <span className="text-amber-600">🥉</span>
                            ) : (
                              <span className="text-slate-400">#{rank}</span>
                            )}
                          </div>

                          <ClanShieldBadge config={clan.badgeConfig} fallbackEmoji={clan.badgeEmoji} size="md" />

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="font-bold text-slate-100 text-sm truncate">{clan.name}</span>
                              <span className="text-[10px] bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                [{clan.tag}]
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {lang === 'en' ? `${clan.members.length}/30 Players` : `${clan.members.length}/30 Spieler`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-cyan-400 block">{clan.clanPoints} PTS</span>
                          <span className="text-[10px] text-slate-500">
                            {lang === 'en' ? 'Clan Points' : 'Clan Punkte'}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BESTENLISTE (PLAYER LEADERBOARD) */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="space-y-2.5">
              {fullLeaderboard.map((player) => {
                const totalPlayers = fullLeaderboard.length;
                const percentile = (player.rank / totalPlayers) * 100;

                const isFrameEnabled = !player.isCurrentUser || appState.profile.showAvatarFrame !== false;

                const isRank1 = player.rank === 1;
                const isTop10 = percentile <= 10 && !isRank1;
                const isTop20 = percentile <= 20 && !isTop10 && !isRank1;

                // Frame styling classes based on requirement rules
                let frameStyleClass = 'border-slate-800 bg-slate-950';
                let avatarBorderClass = 'border border-slate-800';

                if (isFrameEnabled) {
                  if (isRank1) {
                    frameStyleClass =
                      'border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.7)] bg-gradient-to-r from-purple-950/40 via-slate-950 to-purple-950/40';
                    avatarBorderClass =
                      'border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8),0_0_8px_rgba(236,72,153,0.5)] ring-2 ring-fuchsia-400/60';
                  } else if (isTop10) {
                    frameStyleClass =
                      'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] bg-gradient-to-r from-amber-950/30 via-slate-950 to-amber-950/30';
                    avatarBorderClass = 'border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]';
                  } else if (isTop20) {
                    frameStyleClass =
                      'border-2 border-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.5)] bg-slate-950';
                    avatarBorderClass = 'border-2 border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.7)]';
                  } else if (player.isCurrentUser) {
                    frameStyleClass = 'border-2 border-cyan-400 bg-cyan-950/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]';
                    avatarBorderClass = 'border-2 border-cyan-400';
                  }
                }

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${frameStyleClass}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Rank Number Badge */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 bg-slate-900 border border-slate-800">
                        {player.rank === 1 ? (
                          <span className="text-purple-400 font-extrabold flex items-center space-x-0.5">
                            <span>1</span>
                          </span>
                        ) : player.rank <= 3 ? (
                          <span className={player.rank === 2 ? 'text-amber-400' : 'text-amber-600'}>
                            #{player.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400">#{player.rank}</span>
                        )}
                      </div>

                      {/* Avatar with Frame */}
                      <div className="relative shrink-0">
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          referrerPolicy="no-referrer"
                          className={`w-11 h-11 rounded-lg object-cover ${avatarBorderClass}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-bold text-slate-100 text-sm truncate">
                            {player.name} {player.isCurrentUser ? (lang === 'en' ? '(YOU)' : '(DU)') : ''}
                          </span>
                          <span className="text-[10px] bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                            LVL {player.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-bold text-cyan-400 block">
                          {player.standardPoints} %
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {lang === 'en' ? 'Standard Points' : 'Standard Punkte'}
                        </span>
                      </div>

                      {/* Plus button / Friend Request Status */}
                      {!player.isCurrentUser && (
                        <div>
                          {friendsList.some(
                            (f) => f.characterCode === player.characterCode || f.id === player.id
                          ) ? (
                            <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold flex items-center space-x-1">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{lang === 'en' ? 'Friends' : 'Befreundet'}</span>
                            </span>
                          ) : sentRequestIds.includes(player.id) ||
                            sentRequestIds.includes(player.characterCode) ? (
                            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-bold flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="hidden sm:inline">{lang === 'en' ? 'Sent' : 'Gesendet'}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendRequestFromLeaderboard(player)}
                              title={lang === 'en' ? 'Send friend request' : 'Freundesanfrage senden'}
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1 shadow-[0_0_10px_rgba(0,240,255,0.3)] active:scale-95 shrink-0"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                              <span className="hidden sm:inline">{lang === 'en' ? 'Request' : 'Anfrage'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Feedback Message (e.g. 24h cooldown warning) */}
                    {leaderboardFeedback?.id === player.id && (
                      <div className="w-full pt-2 border-t border-slate-800 mt-2">
                        <p
                          className={`text-[11px] font-bold flex items-center space-x-1 ${
                            leaderboardFeedback.isError ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{leaderboardFeedback.text}</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {fullLeaderboard.length === 1 && (
                <div className="mt-3 bg-cyan-950/30 p-4 rounded-xl border border-cyan-500/30 text-center space-y-1">
                  <p className="text-xs font-bold text-cyan-300">
                    {lang === 'en'
                      ? '💡 You are currently the only player on your leaderboard!'
                      : '💡 Du bist aktuell der einzige Spieler auf deiner Bestenliste!'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Add real players using their character code in the "Friends" tab to compare rankings.'
                      : 'Füge echte Mitspieler über deren Charakter-Code im Reiter \'Freunde\' hinzu, um deine Platzierung mit ihnen zu vergleichen.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
