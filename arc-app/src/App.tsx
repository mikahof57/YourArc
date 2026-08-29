/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppState, ArcDailyPayload, StatAttribute, TaskItem, BottomBarModuleConfig, UserAuthAccount, UserProfile } from './types';
import {
  loadAppState,
  saveAppState,
  getRandomQuote,
  getTodayDateString,
} from './utils/storage';
import { Language, getStoredLanguage, setStoredLanguage, t } from './utils/i18n';
import { ALL_EXTRA_MODULES } from './data/extraModules';
import { DEFAULT_STATS } from './data/defaultStats';

import { CyberHeader } from './components/CyberHeader';
import { CharacterCreation } from './components/Onboarding/CharacterCreation';
import { ProfileSection } from './components/HUD/ProfileSection';
import { StatIconsGrid } from './components/HUD/StatIconsGrid';
import { TaskModal } from './components/HUD/TaskModal';
import { DailyQuoteCard } from './components/HUD/DailyQuoteCard';
import { WeeklyRoutineWidget } from './components/HUD/WeeklyRoutineWidget';
import { CalendarWidget } from './components/HUD/CalendarWidget';
import { BottomBar } from './components/HUD/BottomBar';

import { SettingsModal } from './components/Modals/SettingsModal';
import { StatsGraphModal } from './components/Modals/StatsGraphModal';
import { ExtraModuleModal } from './components/Modals/ExtraModuleModal';
import { CommunityModal } from './components/Modals/CommunityModal';
import { ShopModal } from './components/Modals/ShopModal';
import { AuthModal } from './components/Modals/AuthModal';
import { ChatWindow } from './components/Chat/ChatWindow';
import { DeletedTasksModal } from './components/Modals/DeletedTasksModal';
import { Register } from './components/Register';
import { DeletedTaskItem } from './types';
import { BackgroundAnimations } from './components/Effects/BackgroundAnimations';
import { UserCheck, Shield, X, Loader2 } from 'lucide-react';
import { InterfaceColorOption, UIAnimationOption } from './data/shopData';
import { useStore } from './store/useStore';
import {
  getMyProfile,
  updateMyProfile,
  loadFriends,
  loadFriendRequests,
  loadClans,
  loadClanInvitations,
  loadOwnedInventory,
  purchaseStoreItem,
  claimDailyWheel,
  setOnlineStatus,
  spendCredits,
} from './services/communityService';
import { startCreditCheckout } from './services/paymentService';
import {
  completeArcDailyAssignment,
  getArcRestdayOptions,
  getCompletedArcStatIds,
  initializeArcCharacter,
  loadArcDailyProgression,
  mapArcAssignmentToTaskItem,
  mapArcHistoryToUiHistory,
  mapArcPayloadToUiStats,
  resetArcCharacter,
} from './services/progressionService';

function applyArcProgression(prev: AppState, progression: ArcDailyPayload): AppState {
  return {
    ...prev,
    stats: mapArcPayloadToUiStats(progression, prev.stats),
    completedTasksToday: getCompletedArcStatIds(progression.assignments),
    history: mapArcHistoryToUiHistory(progression),
    arcAssignments: progression.assignments,
    arcDay: progression.arc_day,
    arcTimezone: progression.timezone,
    lastActiveDate: progression.arc_day,
    consecutiveLoginDays: progression.login_streak,
    lifetimeXp: progression.lifetime_xp,
    level: progression.level,
    currentLevelXp: progression.current_level_xp,
    requiredLevelXp: progression.required_level_xp,
    statStreaks: Object.fromEntries(progression.stats.map((stat) => [stat.stat_id, stat.stat_streak])),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error !== null && typeof error === 'object') {
    const message = Reflect.get(error, 'message');
    if (typeof message === 'string') return message;
  }
  return String(error ?? '');
}

const DEFAULT_PROFILE_AVATAR_URL =
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80';

function createFirstTimeProfileDraft(serverProfile: Awaited<ReturnType<typeof getMyProfile>>): UserProfile {
  const serverGender = serverProfile?.gender;
  return {
    name: serverProfile?.name ?? '',
    gender: serverGender === 'f' || serverGender === 'd' ? serverGender : 'm',
    avatarUrl: serverProfile?.avatar_url || DEFAULT_PROFILE_AVATAR_URL,
    isCreated: false,
    createdAt: getTodayDateString(),
    characterCode: serverProfile?.character_code ?? undefined,
  };
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [arcInitializationStatus, setArcInitializationStatus] = useState<'idle' | 'loading' | 'initialized' | 'missing' | 'error'>('idle');
  const [firstTimeProfileDraft, setFirstTimeProfileDraft] = useState<UserProfile | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  // Store Auth state
  const user = useStore((state) => state.user);
  const isAuthInitializing = useStore((state) => state.isAuthInitializing);
  const initializeAuth = useStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    setBlockedUserIds([]);
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setArcInitializationStatus('loading');
      (async () => {
        try {
          const progressionPromise = loadArcDailyProgression()
            .then((progression) => ({ progression, error: null }))
            .catch((error: unknown) => ({ progression: null, error }));
          const [profile, friends, requests, clans, invitations, inventory, progressionResult] = await Promise.all([
            getMyProfile(),
            loadFriends(),
            loadFriendRequests(),
            loadClans(),
            loadClanInvitations(),
            loadOwnedInventory(),
            progressionPromise,
          ]);
          setAppState((prev) => {
            const hydrated = progressionResult.progression
              ? applyArcProgression(prev, progressionResult.progression)
              : prev;
            return {
              ...hydrated,
              profile: profile
                ? { ...prev.profile, name: profile.name || prev.profile.name, avatarUrl: profile.avatar_url || prev.profile.avatarUrl, characterCode: profile.character_code, isCreated: true }
                : prev.profile,
              credits: profile?.credits ?? prev.credits ?? 0,
              friends,
              incomingFriendRequests: requests,
              clans,
              clanInvitations: invitations,
              ownedSkinIds: inventory.filter((i: any) => i.item_type === 'skin').map((i: any) => i.item_id),
              unlockedDesignColors: ['#06b6d4', ...inventory.filter((i: any) => i.item_type === 'color').map((i: any) => {
                const colorMap: Record<string,string> = {
                  color_amber:'#f59e0b', color_emerald:'#10b981', color_purple:'#a855f7',
                  color_rose:'#f43f5e', color_blue:'#3b82f6', color_silver:'#e2e8f0', color_orange:'#f97316'
                };
                return colorMap[i.item_id];
              }).filter(Boolean)],
              purchasedAnimationIds: inventory.filter((i: any) => i.item_type === 'animation').map((i: any) => i.item_id),
              hasUnlockedDesignCustomizer: inventory.some((i: any) => i.item_id === 'design_customizer'),
              userClan: profile
                ? clans.find((c) => c.members.some((m) => m.characterCode === profile.character_code)) || null
                : prev.userClan,
            };
          });
          if (progressionResult.progression) {
            setFirstTimeProfileDraft(null);
            setArcInitializationStatus('initialized');
          } else {
            const message = getErrorMessage(progressionResult.error);
            if (message === 'arc_daily_progress_not_initialized') {
              setFirstTimeProfileDraft(createFirstTimeProfileDraft(profile));
              setArcInitializationStatus('missing');
            } else {
              console.error('Failed to hydrate ARC progression:', progressionResult.error);
              setArcInitializationStatus('error');
            }
          }
        } catch (error) {
          console.error('Failed to hydrate ARC backend state:', error);
          setArcInitializationStatus('error');
        }
      })();
    } else {
      setFirstTimeProfileDraft(null);
      setArcInitializationStatus('idle');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setOnlineStatus(true).catch((error) => console.error('Could not set online status:', error));
    const markOffline = () => {
      // Best effort on tab close; normal reconnects set the state back to online.
      setOnlineStatus(false).catch(() => undefined);
    };
    window.addEventListener('beforeunload', markOffline);
    return () => {
      window.removeEventListener('beforeunload', markOffline);
      setOnlineStatus(false).catch(() => undefined);
    };
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment !== 'success') return;
    const refreshCredits = async () => {
      try {
        // Stripe webhook is authoritative; refresh after a short delay to allow the webhook to settle.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const profile = await getMyProfile();
        if (profile) setAppState((prev) => ({ ...prev, credits: profile.credits ?? 0 }));
      } catch (error) {
        console.error('Could not refresh credits after payment:', error);
      } finally {
        window.history.replaceState({}, '', window.location.pathname);
      }
    };
    refreshCredits();
  }, [user]);

  const handleSetLanguage = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  // Modals state
  const [selectedStatForTask, setSelectedStatForTask] = useState<StatAttribute | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(false);
  const [activeExtraModule, setActiveExtraModule] = useState<BottomBarModuleConfig | null>(null);
  const [isConfirmNewCharOpen, setIsConfirmNewCharOpen] = useState<boolean>(false);
  const [isResettingCharacter, setIsResettingCharacter] = useState<boolean>(false);
  const [characterResetError, setCharacterResetError] = useState<string | null>(null);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isDeletedTasksOpen, setIsDeletedTasksOpen] = useState<boolean>(false);
  const [shopInitialTab, setShopInitialTab] = useState<'wheel' | 'exchange' | 'marketplace' | 'design' | 'animations'>('marketplace');

  // Server-authoritative shop handlers. The browser only requests an item purchase;
  // Supabase decides the price, checks the balance, and records the transaction.
  const handleUnlockDesignCustomizer = async () => {
    try {
      const newBalance = await purchaseStoreItem('design_customizer');
      playSoundEffect('levelup');
      setAppState((prev) => ({ ...prev, credits: newBalance, hasUnlockedDesignCustomizer: true }));
      return true;
    } catch (error) {
      console.error('Design customizer purchase failed:', error);
      return false;
    }
  };

  const handleToggleDesignColor = (colorHex: string) => {
    playSoundEffect('click');
    setAppState((prev) => {
      if (colorHex === 'RESET_STANDARD') return { ...prev, selectedDesignColors: ['#06b6d4'] };
      const current = prev.selectedDesignColors || [];
      let updated: string[];
      if (current.includes(colorHex)) {
        updated = current.filter((c) => c !== colorHex);
        if (updated.length === 0) updated = ['#06b6d4'];
      } else {
        updated = current.length >= 3 ? [...current.slice(1), colorHex] : [...current, colorHex];
      }
      return { ...prev, selectedDesignColors: updated };
    });
  };

  const handleBuyColor = async (color: InterfaceColorOption) => {
    try {
      const newBalance = await purchaseStoreItem(color.id);
      playSoundEffect('levelup');
      setAppState((prev) => ({
        ...prev,
        credits: newBalance,
        unlockedDesignColors: [...new Set([...(prev.unlockedDesignColors || ['#06b6d4']), color.hex])],
        selectedDesignColors: [...new Set([...(prev.selectedDesignColors || ['#06b6d4']), color.hex])].slice(-3),
      }));
      return true;
    } catch (error) {
      console.error('Color purchase failed:', error);
      return false;
    }
  };

  const handleBuyAnimation = async (anim: UIAnimationOption) => {
    try {
      const newBalance = await purchaseStoreItem(anim.id);
      playSoundEffect('levelup');
      setAppState((prev) => ({
        ...prev,
        credits: newBalance,
        purchasedAnimationIds: [...new Set([...(prev.purchasedAnimationIds || []), anim.id])],
        equippedAnimationId: anim.id,
      }));
      return true;
    } catch (error) {
      console.error('Animation purchase failed:', error);
      return false;
    }
  };

  const handleEquipAnimation = (animId: string) => {
    playSoundEffect('click');
    setAppState((prev) => ({ ...prev, equippedAnimationId: prev.equippedAnimationId === animId ? '' : animId }));
  };

  // Task Restoration Handler
  const handleRestoreTask = (taskToRestore: DeletedTaskItem) => {
    playSoundEffect('complete');
    setAppState((prev) => {
      const newDeletedTasks = (prev.deletedTasks || []).filter((t) => t.id !== taskToRestore.id);

      const restoredTask: TaskItem = {
        id: taskToRestore.id,
        title: taskToRestore.title,
        description: taskToRestore.description,
        order: 99,
        tier: taskToRestore.tier,
        isCustom: taskToRestore.isCustom,
      };

      const updatedStats = prev.stats.map((s) => {
        if (s.id === taskToRestore.statId) {
          const exists = s.tasks.some((t) => t.id === restoredTask.id);
          if (!exists) {
            return {
              ...s,
              tasks: [...s.tasks, restoredTask],
            };
          }
        }
        return s;
      });

      return {
        ...prev,
        stats: updatedStats,
        deletedTasks: newDeletedTasks,
      };
    });
  };

  // Save changes to local storage whenever appState updates
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Audio effect synthesizers via Web Audio API
  const playSoundEffect = (type: 'complete' | 'click' | 'levelup') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (err) {
      // Audio context ignored if prohibited by browser policy
    }
  };

  // Onboarding completion
  const handleCharacterCreationComplete = async (profile: AppState['profile'], selectedStats: StatAttribute[]) => {
    if (!user) throw new Error('Authentication is required before ARC initialization.');

    if (arcInitializationStatus === 'missing') {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await initializeArcCharacter(
        { name: profile.name, avatar_url: profile.avatarUrl, gender: profile.gender },
        selectedStats.map((stat) => ({ stat_id: stat.id, start_value: stat.startValue ?? stat.value })),
        timezone,
      );
    } else if (arcInitializationStatus === 'initialized') {
      await updateMyProfile({ name: profile.name, avatarUrl: profile.avatarUrl, gender: profile.gender });
    } else {
      throw new Error('ARC progression initialization state is not ready.');
    }

    const [progression, confirmedProfile] = await Promise.all([
      loadArcDailyProgression(),
      getMyProfile(),
    ]);
    if (!confirmedProfile) throw new Error('The confirmed ARC profile could not be loaded.');

    setAppState((prev) => ({
      ...applyArcProgression(prev, progression),
      profile: {
        ...prev.profile,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        name: confirmedProfile.name,
        avatarUrl: confirmedProfile.avatar_url,
        gender: confirmedProfile.gender,
        characterCode: confirmedProfile.character_code,
        isCreated: true,
      },
    }));
    useStore.getState().setProfile({
      name: confirmedProfile.name,
      avatarUrl: confirmedProfile.avatar_url,
      gender: confirmedProfile.gender,
    });
    setArcInitializationStatus('initialized');
    playSoundEffect('levelup');
  };

  const handleResetCharacter = async () => {
    setIsResettingCharacter(true);
    setCharacterResetError(null);
    try {
      const resetResult = await resetArcCharacter();
      const cleanProfile = {
        ...createFirstTimeProfileDraft(null),
        characterCode: resetResult.characterCode,
      };
      setFirstTimeProfileDraft(cleanProfile);
      setAppState((prev) => ({
        ...prev,
        profile: cleanProfile,
        stats: DEFAULT_STATS,
        completedTasksToday: [],
        history: [],
        friends: [],
        incomingFriendRequests: [],
        sentFriendRequestIds: [],
        declinedRequestsInfo: {},
        userClan: null,
        clans: [],
        clanInvitations: [],
        sentClanJoinRequestIds: [],
        statStreaks: {},
        chatState: { channels: [], clanMessages: [] },
        deletedTasks: [],
        consecutiveLoginDays: 0,
        arcDay: undefined,
        arcTimezone: undefined,
        lifetimeXp: 0,
        level: 1,
        currentLevelXp: 0,
        requiredLevelXp: undefined,
        arcAssignments: [],
      }));
      setBlockedUserIds([]);
      useStore.getState().setProfile({
        name: '',
        avatarUrl: cleanProfile.avatarUrl,
        gender: cleanProfile.gender,
        characterCode: cleanProfile.characterCode,
        level: 1,
        standardPoints: 0,
      });
      setIsConfirmNewCharOpen(false);
      setArcInitializationStatus('missing');
    } catch (error) {
      console.error('ARC character reset failed:', error);
      setCharacterResetError(
        getErrorMessage(error) || (lang === 'en'
          ? 'The character reset failed. Your current character was kept.'
          : 'Das Zurücksetzen ist fehlgeschlagen. Dein aktueller Charakter wurde beibehalten.'),
      );
    } finally {
      setIsResettingCharacter(false);
    }
  };

  const handleToggleWindowCollapse = (windowKey: 'dailyTasks' | 'motivation' | 'calendar' | 'weeklyRoutine') => {
    playSoundEffect('click');
    setAppState((prev) => {
      const current = prev.collapsedWindows || {};
      return {
        ...prev,
        collapsedWindows: {
          ...current,
          [windowKey]: !current[windowKey],
        },
      };
    });
  };

  const handleMarkTaskDone = async (statId: string, choiceKey: string | null = null) => {
    const assignment = appState.arcAssignments?.find((item) => item.stat_id === statId);
    if (!assignment) throw new Error('No server daily assignment is available for this stat.');
    if (assignment.completed_at !== null) return;

    const result = await completeArcDailyAssignment(assignment.assignment_id, choiceKey);
    if (!result.confirmed) throw new Error('The server did not confirm this assignment completion.');

    // Completion changes become visible only through a fresh authoritative payload.
    const progression = await loadArcDailyProgression();
    setAppState((prev) => applyArcProgression(prev, progression));

    playSoundEffect('complete');
  };

  // Active custom bottom bar modules list
  const activeBottomModulesConfigs = ALL_EXTRA_MODULES.filter((m) =>
    appState.activeBottomModules.includes(m.id)
  );

  const currentQuote = getRandomQuote(appState);

  // Compute active design colors for UI theme customization
  const themeColors =
    appState.selectedDesignColors && appState.selectedDesignColors.length > 0
      ? appState.selectedDesignColors
      : ['#06b6d4'];

  const themeC1 = themeColors[0] || '#06b6d4';
  const themeC2 = themeColors[1] || themeC1;
  const themeC3 = themeColors[2] || themeC2;

  const dynamicThemeStyles = {
    '--theme-c1': themeC1,
    '--theme-c2': themeC2,
    '--theme-c3': themeC3,
    '--theme-grad': `linear-gradient(135deg, ${themeC1}, ${themeC2}, ${themeC3})`,
    '--theme-glow1': `${themeC1}33`,
    '--theme-glow2': `${themeC2}33`,
    '--theme-glow3': `${themeC3}33`,
  } as React.CSSProperties;

  // While auth status is initializing, show a loading screen to prevent screen flickering
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-mono p-4">
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border-2 border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <div className="flex items-center space-x-2 text-cyan-400 text-sm font-bold tracking-widest uppercase">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AUTHENTICATING // SYSTEM INITIALIZATION</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Register
        lang={lang}
        onSetLanguage={handleSetLanguage}
        onRegisterSuccess={(accountData) => {
          playSoundEffect('levelup');
          setAppState((prev) => ({
            ...prev,
            profile: { ...prev.profile, name: accountData.username || prev.profile.name },
            authAccount: {
              email: accountData.email,
              username: accountData.username,
              token: `tok_${Date.now()}`,
            },
          }));
        }}
      />
    );
  }

  if (arcInitializationStatus === 'idle' || arcInitializationStatus === 'loading') {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-cyan-400 flex items-center justify-center font-mono">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span>LOADING ARC PROGRESSION...</span>
      </div>
    );
  }

  if (arcInitializationStatus === 'error') {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-rose-300 flex items-center justify-center p-6 font-mono text-center">
        ARC progression could not be loaded. Reload the application to retry.
      </div>
    );
  }

  // Missing authoritative progression always requires the complete three-step flow.
  if (arcInitializationStatus === 'missing') {
    return (
      <CharacterCreation
        initialProfile={firstTimeProfileDraft ?? createFirstTimeProfileDraft(null)}
        initialStats={DEFAULT_STATS}
        onComplete={handleCharacterCreationComplete}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans transition-all duration-500"
      style={dynamicThemeStyles}
    >
      {/* Top Interface Theme Accent Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50 transition-all duration-500 shadow-md pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${themeC1}, ${themeC2}, ${themeC3})`,
          boxShadow: `0 0 12px ${themeC1}`,
        }}
      />

      {/* Background Cyber Ambient FX */}
      <BackgroundAnimations
        activeAnimationId={appState.equippedAnimationId}
        customColors={appState.selectedDesignColors}
      />
      {/* Dynamic Background Radial Glow according to active design colors */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-700 opacity-60"
        style={{
          background: `radial-gradient(ellipse at top, ${themeC1}25 0%, ${themeC2}15 45%, ${themeC3}10 70%, #020617 100%)`,
        }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Cyber Header */}
        <CyberHeader
          dateStr={appState.lastActiveDate}
          soundEnabled={soundEnabled}
          lang={lang}
          onSetLanguage={handleSetLanguage}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenCharacterCreation={() => setIsConfirmNewCharOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          authAccount={appState.authAccount}
        />

        {/* Main Interface HUD Container */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 my-auto">
          {/* Top Profile Section */}
          <ProfileSection
            profile={appState.profile}
            stats={appState.stats}
            credits={appState.credits ?? 0}
            level={appState.level}
            lang={lang}
            onOpenCommunity={() => {
              playSoundEffect('click');
              setIsCommunityOpen(true);
            }}
            onOpenShop={() => {
              playSoundEffect('click');
              setIsShopOpen(true);
            }}
          />

          {/* Middle Stat Action Icons Grid (Tagesaufgaben) */}
          <StatIconsGrid
            stats={appState.stats}
            completedTasksToday={appState.completedTasksToday}
            lang={lang}
            isMinimized={!!appState.collapsedWindows?.dailyTasks}
            onToggleMinimize={() => handleToggleWindowCollapse('dailyTasks')}
            onSelectStatIcon={(stat) => {
              playSoundEffect('click');
              setSelectedStatForTask(stat);
            }}
          />

          {/* Daily Motivational Quote (Motivations Spruch / Impuls) */}
          <DailyQuoteCard
            quote={currentQuote}
            lang={lang}
            isMinimized={!!appState.collapsedWindows?.motivation}
            onToggleMinimize={() => handleToggleWindowCollapse('motivation')}
          />

          {/* 7-Day Weekly Routine (Sieben Tage) - placed right above Calendar */}
          <WeeklyRoutineWidget
            appState={appState}
            lang={lang}
            isMinimized={!!appState.collapsedWindows?.weeklyRoutine}
            onToggleMinimize={() => handleToggleWindowCollapse('weeklyRoutine')}
            onUpdateAppState={(updated) => setAppState((prev) => ({ ...prev, ...updated }))}
            playSoundEffect={playSoundEffect}
          />

          {/* Calendar & Goal Countdown Widget (Kalender) */}
          <CalendarWidget
            appState={appState}
            lang={lang}
            isMinimized={!!appState.collapsedWindows?.calendar}
            onToggleMinimize={() => handleToggleWindowCollapse('calendar')}
            onUpdateAppState={(updated) => setAppState((prev) => ({ ...prev, ...updated }))}
            playSoundEffect={playSoundEffect}
          />
        </main>

        {/* Bottom Navigation Bar */}
        <BottomBar
          activeModules={activeBottomModulesConfigs}
          lang={lang}
          onOpenShop={() => {
            playSoundEffect('click');
            setIsShopOpen(true);
          }}
          onOpenSettings={() => {
            playSoundEffect('click');
            setIsSettingsOpen(true);
          }}
          onOpenGraph={() => {
            playSoundEffect('click');
            setIsGraphOpen(true);
          }}
          onToggleChat={() => {
            playSoundEffect('click');
            setIsChatOpen((prev) => !prev);
          }}
          isChatOpen={isChatOpen}
          onOpenModuleContent={(mod) => {
            playSoundEffect('click');
            setActiveExtraModule(mod);
          }}
        />
      </div>

      {/* MODALS */}

      {/* Chat Window Popover */}
      {isChatOpen && (
        <ChatWindow
          appState={appState}
          blockedUserIds={blockedUserIds}
          onBlockedUserIdsChange={setBlockedUserIds}
          lang={lang}
          onUpdateAppState={(updated) => setAppState((prev) => ({ ...prev, ...updated }))}
          onClose={() => setIsChatOpen(false)}
          onOpenCommunity={() => {
            setIsChatOpen(false);
            setIsCommunityOpen(true);
          }}
        />
      )}

      {/* Daily Task Detail Modal */}
      {selectedStatForTask && (() => {
        const selectedAssignment = appState.arcAssignments?.find(
          (assignment) => assignment.stat_id === selectedStatForTask.id,
        );
        if (!selectedAssignment) return null;
        return (
        <TaskModal
          stat={selectedStatForTask}
          task={mapArcAssignmentToTaskItem(selectedAssignment, lang)}
          isCompleted={selectedAssignment.completed_at !== null}
          assignmentKind={selectedAssignment.assignment_kind}
          restdayOptions={getArcRestdayOptions(selectedAssignment)}
          lang={lang}
          onClose={() => setSelectedStatForTask(null)}
          onMarkDone={handleMarkTaskDone}
        />
        );
      })()}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          appState={appState}
          lang={lang}
          onSetLanguage={handleSetLanguage}
          onSaveProfile={async (prof) => {
            const confirmed = await updateMyProfile({
              name: prof.name,
              avatarUrl: prof.avatarUrl,
              gender: prof.gender,
            });
            const confirmedProfile = {
              name: confirmed.name,
              avatarUrl: confirmed.avatar_url,
              gender: confirmed.gender,
            };
            setAppState((prev) => ({
              ...prev,
              profile: { ...prof, ...confirmedProfile },
            }));
            useStore.getState().setProfile(confirmedProfile);
          }}
          onSaveStats={(stats) => setAppState((prev) => ({ ...prev, stats }))}
          onSaveQuoteSettings={(qs) => setAppState((prev) => ({ ...prev, quoteSettings: qs }))}
          onSaveBottomModules={(mods) =>
            setAppState((prev) => ({ ...prev, activeBottomModules: mods }))
          }
          onSaveDeletedTasks={(dts) => setAppState((prev) => ({ ...prev, deletedTasks: dts }))}
          onOpenDeletedTasksModal={() => setIsDeletedTasksOpen(true)}
          onToggleDesignColor={handleToggleDesignColor}
          onEquipAnimation={handleEquipAnimation}
          onOpenShopWithTab={(tab) => {
            setIsSettingsOpen(false);
            setShopInitialTab(tab);
            setIsShopOpen(true);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Deleted Tasks Modal */}
      {isDeletedTasksOpen && (
        <DeletedTasksModal
          deletedTasks={appState.deletedTasks || []}
          lang={lang}
          onRestoreTask={handleRestoreTask}
          onClose={() => setIsDeletedTasksOpen(false)}
        />
      )}

      {/* 30-Day Progress Graph Modal */}
      {isGraphOpen && (
        <StatsGraphModal
          history={appState.history}
          stats={appState.stats}
          lang={lang}
          onClose={() => setIsGraphOpen(false)}
        />
      )}

      {/* Extra Bottom Bar Module Content Modal */}
      {activeExtraModule && (
        <ExtraModuleModal
          moduleConfig={activeExtraModule}
          lang={lang}
          reloadsCountToday={appState.moduleReloadsCountToday || 0}
          seenModuleItemIds={appState.seenModuleItemIds || {}}
          currentCredits={appState.credits ?? 0}
          onPerformReload={async (moduleId, newSeenIds) => {
            playSoundEffect('click');
            try {
              const newBalance = await spendCredits(1, 'module_reload', moduleId, { module_id: moduleId });
              setAppState((prev) => ({
                ...prev,
                credits: newBalance,
                seenModuleItemIds: {
                  ...(prev.seenModuleItemIds || {}),
                  [moduleId]: newSeenIds,
                },
              }));
              return true;
            } catch (error) {
              console.error('Module reload credit charge failed:', error);
              return false;
            }
          }}
          onOpenShop={() => {
            setActiveExtraModule(null);
            setIsShopOpen(true);
          }}
          onClose={() => setActiveExtraModule(null)}
        />
      )}

      {/* Community Modal */}
      {isCommunityOpen && (
        <CommunityModal
          appState={appState}
          blockedUserIds={blockedUserIds}
          onBlockedUserIdsChange={setBlockedUserIds}
          lang={lang}
          onUpdateAppState={(updated) => setAppState((prev) => ({ ...prev, ...updated }))}
          onClose={() => setIsCommunityOpen(false)}
        />
      )}

      {/* Shop Modal */}
      {isShopOpen && (
        <ShopModal
          lang={lang}
          currentCredits={appState.credits ?? 0}
          ownedSkinIds={appState.ownedSkinIds || []}
          equippedSkinId={appState.equippedSkinId || ''}
          lastWheelSpinDate={appState.lastWheelSpinDate || ''}
          hasUnlockedDesignCustomizer={appState.hasUnlockedDesignCustomizer || false}
          unlockedDesignColors={appState.unlockedDesignColors || ['#f59e0b']}
          selectedDesignColors={appState.selectedDesignColors || []}
          purchasedAnimationIds={appState.purchasedAnimationIds || []}
          equippedAnimationId={appState.equippedAnimationId || ''}
          initialTab={shopInitialTab}
          onAddCredits={async (amount) => {
            playSoundEffect('click');
            await startCreditCheckout(amount);
          }}
          onBuySkin={async (skin) => {
            try {
              const newBalance = await purchaseStoreItem(skin.id);
              playSoundEffect('levelup');
              setAppState((prev) => {
                const updatedProfile = { ...prev.profile };
                if (skin.avatarUrl) updatedProfile.avatarUrl = skin.avatarUrl;
                if (skin.titleName) updatedProfile.title = skin.titleName;
                return {
                  ...prev,
                  credits: newBalance,
                  ownedSkinIds: [...new Set([...(prev.ownedSkinIds || []), skin.id])],
                  equippedSkinId: skin.id,
                  profile: updatedProfile,
                };
              });
              return true;
            } catch (error) {
              console.error('Skin purchase failed:', error);
              return false;
            }
          }}
          onEquipSkin={(skin) => {
            playSoundEffect('click');
            setAppState((prev) => {
              const updatedProfile = { ...prev.profile };
              if (skin.avatarUrl) {
                updatedProfile.avatarUrl = skin.avatarUrl;
              }
              if (skin.titleName) {
                updatedProfile.title = skin.titleName;
              }
              return {
                ...prev,
                equippedSkinId: skin.id,
                profile: updatedProfile,
              };
            });
          }}
          onUnlockDesignCustomizer={handleUnlockDesignCustomizer}
          onBuyColor={handleBuyColor}
          onToggleDesignColor={handleToggleDesignColor}
          onBuyAnimation={handleBuyAnimation}
          onEquipAnimation={handleEquipAnimation}
          onClaimDailyWheel={async () => {
            const today = getTodayDateString();
            const result = await claimDailyWheel();
            playSoundEffect('levelup');
            setAppState((prev) => ({ ...prev, credits: result.balance, lastWheelSpinDate: today }));
            return result;
          }}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          currentAuth={appState.authAccount || null}
          onLoginSuccess={(account) => {
            playSoundEffect('levelup');
            setAppState((prev) => ({
              ...prev,
              authAccount: account,
            }));
          }}
          onLogout={() => {
            playSoundEffect('click');
            setAppState((prev) => ({
              ...prev,
              authAccount: null,
            }));
          }}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {/* Confirmation Modal for Creating New Character */}
      {isConfirmNewCharOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-mono animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-slate-900 border rounded-xl p-5 sm:p-6 shadow-2xl space-y-4"
            style={{
              borderColor: 'var(--theme-c1)',
              boxShadow: '0 0 30px var(--theme-glow1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-c1)' }} />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  {lang === 'en' ? 'Create new character?' : 'Neuen Charakter erstellen?'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isResettingCharacter) setIsConfirmNewCharOpen(false);
                }}
                disabled={isResettingCharacter}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Message */}
            <div className="space-y-3">
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {lang === 'en'
                  ? 'Your current character, progression, tasks, friends, clan and other character data will be permanently deleted.'
                  : 'Dein aktueller Charakter, Fortschritt, Aufgaben, Freunde, Clan und weitere Charakterdaten werden dauerhaft gelöscht.'}
              </p>

              <div
                className="p-3.5 rounded-lg border text-xs space-y-1.5 transition-all duration-300"
                style={{
                  backgroundColor: 'var(--theme-glow1)',
                  borderColor: 'var(--theme-c1)',
                }}
              >
                <div className="font-bold flex items-center space-x-2" style={{ color: 'var(--theme-c1)' }}>
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>{lang === 'en' ? 'Account Property Preserved' : 'Account-Eigentum bleibt erhalten'}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                  {lang === 'en'
                    ? 'Your credits and purchased shop items will be kept.'
                    : 'Deine Credits und gekauften Shop-Artikel bleiben erhalten.'}
                </p>
              </div>
              {characterResetError && (
                <p className="text-xs text-rose-300 border border-rose-500/40 bg-rose-950/30 rounded-lg p-3" role="alert">
                  {characterResetError}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsConfirmNewCharOpen(false)}
                disabled={isResettingCharacter}
                className="px-4 py-2 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-all"
              >
                {lang === 'en' ? 'Cancel' : 'Abbrechen'}
              </button>
              <button
                onClick={() => {
                  playSoundEffect('click');
                  void handleResetCharacter();
                }}
                disabled={isResettingCharacter}
                className="flex items-center space-x-1.5 font-bold px-4 py-2.5 rounded text-xs text-slate-950 uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                style={{
                  background: 'var(--theme-grad)',
                  boxShadow: '0 0 15px var(--theme-glow1)',
                }}
              >
                {isResettingCharacter ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <UserCheck className="w-4 h-4 shrink-0" />}
                <span>{isResettingCharacter
                  ? (lang === 'en' ? 'Resetting…' : 'Wird zurückgesetzt…')
                  : (lang === 'en' ? 'Delete Character & Continue' : 'Charakter löschen & fortfahren')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
