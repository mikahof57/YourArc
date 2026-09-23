/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, StatAttribute, TaskItem, BottomBarModuleConfig, UserProfile } from './types';
import {
  getInitialState,
  getRandomQuote,
  getTodayDateString,
} from './utils/storage';
import { Language, getStoredLanguage } from './utils/i18n';
import { ALL_EXTRA_MODULES } from './data/extraModules';
import { getLocalizedModuleConfig } from './data/extraModulesTranslations';
import { DEFAULT_STATS } from './data/defaultStats';
import { DEFAULT_AVATAR_URL } from './data/avatars';

import { CyberHeader } from './components/CyberHeader';
import { CharacterCreation } from './components/Onboarding/CharacterCreation';
import { ProfileSection } from './components/HUD/ProfileSection';
import { StatIconsGrid } from './components/HUD/StatIconsGrid';
import { TaskModal } from './components/HUD/TaskModal';
import { DailyQuoteCard } from './components/HUD/DailyQuoteCard';
import { WeeklyRoutineWidget } from './components/HUD/WeeklyRoutineWidget';
import { CalendarWidget } from './components/HUD/CalendarWidget';
import { BottomBar } from './components/HUD/BottomBar';

import { AppIntroduction } from './components/Onboarding/AppIntroduction';
import { shouldShowIntroduction, dismissIntroduction } from './features/introduction/introductionPolicy';
import { SettingsModal } from './components/Modals/SettingsModal';
import { StatsGraphModal } from './components/Modals/StatsGraphModal';
import { ExtraModuleModal } from './components/Modals/ExtraModuleModal';
import { ShopModal } from './components/Modals/ShopModal';
import { ArcMenuModal } from './components/Modals/ArcMenuModal';
import { HomeProgressDeck } from './components/HUD/HomeProgressDeck';
import { MissionsPage } from './components/Pages/MissionsPage';
import { initializeLocalSaveFoundation, localEconomyService, localGameService, localObjectivesService, localProfileService, localProgressionService } from './services/localSaveService';
import { AppHubPage } from './components/Pages/AppHubPage';
import { BackgroundAnimations } from './components/Effects/BackgroundAnimations';
import { UserCheck, Shield, X, Loader2 } from 'lucide-react';
import { getLocalRestdayOptions, mapLocalAssignmentToTaskItem, projectSaveToAppState } from './features/runtime/localGameService';
import { ARC_CANONICAL_STAT_IDS, type ArcCanonicalStatId } from './features/savegame/arcSaveGame';
import { getLocalizedTitleName } from './features/achievements/achievementLocalization';
import { nativeRuntimeService } from './services/nativeRuntimeService';
import { localIapService } from './services/localIapService';
import { importLocalArcBackup, shareOrDownloadArcBackup } from './services/localBackupService';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error !== null && typeof error === 'object') {
    const message = Reflect.get(error, 'message');
    if (typeof message === 'string') return message;
  }
  return String(error ?? '');
}

function createFirstTimeProfileDraft(localProfile: UserProfile | null): UserProfile {
  const localGender = localProfile?.gender;
  return {
    name: localProfile?.name ?? '',
    gender: localGender === 'f' || localGender === 'd' ? localGender : 'm',
    avatarUrl: localProfile?.avatarUrl && !/^https?:\/\//i.test(localProfile.avatarUrl)
      ? localProfile.avatarUrl : DEFAULT_AVATAR_URL,
    isCreated: false,
    createdAt: getTodayDateString(),
    characterCode: undefined,
  };
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => getInitialState());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [arcInitializationStatus, setArcInitializationStatus] = useState<'idle' | 'loading' | 'initialized' | 'missing' | 'error'>('idle');
  const [firstTimeProfileDraft, setFirstTimeProfileDraft] = useState<UserProfile | null>(null);
  const [equippedAchievementTitle, setEquippedAchievementTitle] = useState<string | null>(null);
  const [selectedStatForTask, setSelectedStatForTask] = useState<StatAttribute | null>(null);
  const [introductionMode, setIntroductionMode] = useState<'automatic' | 'replay' | null>(null);
  const finishIntroduction = useCallback(async () => {
    if (!introductionMode) return;
    await dismissIntroduction(introductionMode, () => localProfileService.updateSettings({ introductionState: 'completed' }));
    setIntroductionMode(null);
  }, [introductionMode]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGraphOpen, setIsGraphOpen] = useState<boolean>(false);
  const [activeExtraModule, setActiveExtraModule] = useState<BottomBarModuleConfig | null>(null);
  const [isConfirmNewCharOpen, setIsConfirmNewCharOpen] = useState<boolean>(false);
  const [isResettingCharacter, setIsResettingCharacter] = useState<boolean>(false);
  const [characterResetError, setCharacterResetError] = useState<string | null>(null);
  const [activeDestination, setActiveDestination] = useState<'home' | 'missions' | 'appHub' | 'shop'>('home');
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activeDestination]);
  const [objectiveInitialView, setObjectiveInitialView] = useState<'missions' | 'achievements'>('missions');
  const [isArcMenuOpen, setIsArcMenuOpen] = useState(false);
  const [homeDetailSurface, setHomeDetailSurface] = useState<'routine' | 'calendar' | null>(null);
  const handleMissionCreditBalance = useCallback((balance: number) => {
    setAppState((previous) => previous.credits === balance ? previous : { ...previous, credits: balance });
  }, []);
  const loadIapProducts = useCallback(() => localIapService.loadProducts(lang), [lang]);
  const purchaseIapProduct = useCallback(async (productId: string) => {
    const outcome = await localIapService.purchase(productId);
    if (outcome.state === 'success') setAppState((previous) => projectSaveToAppState(outcome.save, previous));
    return outcome;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setArcInitializationStatus('loading');
    void (async () => {
      try {
        const initialized = await initializeLocalSaveFoundation(lang);
        if (initialized.warnings.length) console.warn('ARC local save recovery warnings:', initialized.warnings);
        const save = initialized.save.progression.initializedAt
          ? await localGameService.initializeDay()
          : initialized.save;
        if (cancelled) return;
        const saveLanguage = save.settings.language;
        setLang(saveLanguage);
        setAppState((previous) => projectSaveToAppState(save, previous));
        setFirstTimeProfileDraft(save.progression.initializedAt ? null : createFirstTimeProfileDraft(save.profile));
        setArcInitializationStatus(save.progression.initializedAt ? 'initialized' : 'missing');
        if (shouldShowIntroduction(save)) setIntroductionMode('automatic');
        const title = save.titles.owned.find((item) => item.title_id === save.titles.equippedTitleId);
        setEquippedAchievementTitle(title ? getLocalizedTitleName(title.title_id, saveLanguage, title) : null);
      } catch (error) {
        if (cancelled) return;
        console.error('ARC local save could not be loaded or recovered:', error);
        setArcInitializationStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (arcInitializationStatus !== 'initialized') return;
    let cancelled = false;
    let stop = () => undefined;
    const reconcilePurchases = async () => {
      const outcomes = await localIapService.reconcile();
      const latest = outcomes.filter((outcome) => outcome.state === 'success').at(-1);
      if (latest?.state === 'success' && !cancelled) setAppState((previous) => projectSaveToAppState(latest.save, previous));
    };
    void reconcilePurchases().catch((error) => console.warn('ARC purchase reconciliation unavailable:', error));
    void nativeRuntimeService.start(async (save) => {
      if (cancelled) return;
      if (save && !cancelled) setAppState((previous) => projectSaveToAppState(save, previous));
      await reconcilePurchases().catch((error) => console.warn('ARC purchase reconciliation unavailable:', error));
    }).then((cleanup) => { if (cancelled) cleanup(); else stop = cleanup; });
    return () => { cancelled = true; stop(); };
  }, [arcInitializationStatus]);

  const handleSetLanguage = (newLang: Language) => {
    void localProfileService.updateSettings({ language: newLang }).then((save) => {
      setLang(newLang);
      setAppState((previous) => projectSaveToAppState(save, previous));
    }).catch((error) => console.warn('ARC local language update failed:', error));
  };

  useEffect(() => {
    const hydrateAchievements = async () => {
      const save = await localObjectivesService.load();
      if (!save) return;
      const equipped = save.titles.owned.find((title) => title.title_id === save.titles.equippedTitleId);
      setEquippedAchievementTitle(equipped ? getLocalizedTitleName(equipped.title_id, lang, equipped) : null);
      handleMissionCreditBalance(save.economy.credits);
    };
    void hydrateAchievements().catch(() => undefined);
    window.addEventListener('arc-title-changed', hydrateAchievements);
    return () => window.removeEventListener('arc-title-changed', hydrateAchievements);
  }, [lang, handleMissionCreditBalance]);

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
    let confirmed: Awaited<ReturnType<typeof localGameService.initializeCharacter>>;
    const isNewCharacter = arcInitializationStatus === 'missing';
    if (arcInitializationStatus === 'missing') {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      confirmed = await localGameService.initializeCharacter({
        profile: {
          name: profile.name, avatarUrl: profile.avatarUrl, gender: profile.gender,
          age: profile.age, weight: profile.weight, height: profile.height,
          avatarCategory: profile.avatarCategory, showAvatarFrame: profile.showAvatarFrame,
        },
        stats: selectedStats
          .filter((stat): stat is StatAttribute & { id: ArcCanonicalStatId } =>
            ARC_CANONICAL_STAT_IDS.includes(stat.id as ArcCanonicalStatId))
          .map((stat) => ({ statId: stat.id, startValue: stat.startValue ?? stat.value })),
        timezone,
      });
    } else if (arcInitializationStatus === 'initialized') {
      confirmed = await localGameService.updateProfile(profile);
    } else {
      throw new Error('ARC progression initialization state is not ready.');
    }
    setAppState((previous) => projectSaveToAppState(confirmed, previous));
    setArcInitializationStatus('initialized');
    setActiveDestination('home');
    if (isNewCharacter && shouldShowIntroduction(confirmed)) setIntroductionMode('automatic');
    playSoundEffect('levelup');
  };

  const handleResetCharacter = async () => {
    setIsResettingCharacter(true);
    setCharacterResetError(null);
    try {
      const reset = await localGameService.resetCharacter();
      const cleanProfile = createFirstTimeProfileDraft(null);
      setFirstTimeProfileDraft(cleanProfile);
      setAppState((previous) => projectSaveToAppState(reset, previous));
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
      const collapsedWindows = {
        ...current,
        [windowKey]: !current[windowKey],
      };
      void localProfileService.updateUiPreferences({ collapsedWindows });
      return {
        ...prev,
        collapsedWindows,
      };
    });
  };

  const completionInFlightRef = useRef<Set<string>>(new Set());

  const handleMarkTaskDone = async (statId: string, choiceKey: string | null = null) => {
    const assignment = appState.arcAssignments?.find((item) => item.stat_id === statId);
    if (!assignment) throw new Error('No local daily assignment is available for this stat.');
    if (assignment.completed_at !== null) return;
    if (completionInFlightRef.current.has(assignment.assignment_id)) return;

    completionInFlightRef.current.add(assignment.assignment_id);
    try {
      const completed = await localGameService.completeAssignment(assignment.assignment_id, choiceKey);
      if (!completed.completion.confirmed) throw new Error('The local assignment was not completed.');
      setAppState((previous) => projectSaveToAppState(completed.save, previous));
      playSoundEffect('complete');
    } finally {
      completionInFlightRef.current.delete(assignment.assignment_id);
    }
  };

  // Active custom bottom bar modules list
  const activeBottomModulesConfigs = ALL_EXTRA_MODULES
    .filter((module) => appState.activeBottomModules.includes(module.id))
    .map((module) => getLocalizedModuleConfig(module, lang));

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

  if (arcInitializationStatus === 'idle' || arcInitializationStatus === 'loading') {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-cyan-400 flex items-center justify-center font-mono">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span>LOADING LOCAL ARC SAVE...</span>
      </div>
    );
  }

  if (arcInitializationStatus === 'error') {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-rose-300 flex items-center justify-center p-6 font-mono text-center">
        ARC local data could not be loaded safely. Reload the application to retry recovery.
      </div>
    );
  }

  // A local save without initialized progression always requires the complete three-step flow.
  if (arcInitializationStatus === 'missing') {
    return (
      <CharacterCreation
        initialProfile={firstTimeProfileDraft ?? createFirstTimeProfileDraft(null)}
        initialStats={DEFAULT_STATS}
        lang={lang}
        onComplete={handleCharacterCreationComplete}
      />
    );
  }

  return (
    <div
      className="arc-shell min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans transition-all duration-500"
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
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <div className="arc-app-frame relative z-10 flex flex-col" inert={introductionMode !== null}>
        {/* Cyber Header */}
        <CyberHeader
          dateStr={appState.lastActiveDate}
          soundEnabled={soundEnabled}
          lang={lang}
          onSetLanguage={handleSetLanguage}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenCharacterCreation={() => setIsConfirmNewCharOpen(true)}
        />

        <div className="arc-route-content">
        {/* Main Interface HUD Container */}
        {activeDestination === 'home' && <main className="arc-main flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 my-auto">
          {/* Top Profile Section */}
          <ProfileSection
            profile={appState.profile}
            stats={appState.stats}
            credits={appState.credits ?? 0}
            level={appState.level}
            currentLevelXp={appState.currentLevelXp}
            requiredLevelXp={appState.requiredLevelXp}
            lang={lang}
            equippedTitle={equippedAchievementTitle}
            onOpenAppHub={() => {
              playSoundEffect('click');
              setActiveDestination('appHub');
            }}
            onOpenShop={() => {
              playSoundEffect('click');
              setActiveDestination('shop');
            }}
          />

          {/* Reference-order quote/date band between identity and daily action. */}
          <DailyQuoteCard quote={currentQuote} lang={lang} isMinimized={!!appState.collapsedWindows?.motivation} onToggleMinimize={() => handleToggleWindowCollapse('motivation')} />

          {/* Daily Protocols are daily assignments, not the separate Missions domain. */}
          <StatIconsGrid
            stats={appState.stats}
            completedTasksToday={appState.completedTasksToday}
            dailyTaskTitles={Object.fromEntries((appState.arcAssignments || []).map((assignment) => [assignment.stat_id, mapLocalAssignmentToTaskItem(assignment, lang).title]))}
            lang={lang}
            isMinimized={!!appState.collapsedWindows?.dailyTasks}
            onToggleMinimize={() => handleToggleWindowCollapse('dailyTasks')}
            onSelectStatIcon={(stat) => {
              playSoundEffect('click');
              setSelectedStatForTask(stat);
            }}
          />

          <HomeProgressDeck
            appState={appState}
            lang={lang}
            modules={activeBottomModulesConfigs}
            onOpenRoutine={() => setHomeDetailSurface('routine')}
            onOpenCalendar={() => setHomeDetailSurface('calendar')}
            onOpenStats={() => setIsGraphOpen(true)}
            onOpenMissions={() => {
              setObjectiveInitialView('missions');
              setActiveDestination('missions');
            }}
            onOpenModule={setActiveExtraModule}
            onCustomize={() => setIsSettingsOpen(true)}
          />
        </main>}

        {activeDestination === 'missions' && (
          <MissionsPage
            key={objectiveInitialView}
            lang={lang}
            level={appState.level || 1}
            currentXp={appState.currentLevelXp || 0}
            requiredXp={appState.requiredLevelXp || 0}
            initialView={objectiveInitialView}
            onCreditBalanceChange={handleMissionCreditBalance}
          />
        )}

        {activeDestination === 'appHub' && (
          <AppHubPage lang={lang} />
        )}

      {/* Shop is a first-class destination. Home is removed from the active canvas while this renders. */}
      {activeDestination === 'shop' && (
        <ShopModal
          embedded
          playerName={appState.profile.name}
          playerAvatarUrl={appState.profile.avatarUrl}
          playerLevel={appState.level || 1}
          playerCurrentXp={appState.currentLevelXp || 0}
          playerRequiredXp={appState.requiredLevelXp || 0}
          lang={lang}
          currentCredits={appState.credits ?? 0}
          ownedSkinIds={appState.ownedSkinIds || []}
          equippedSkinId={appState.equippedSkinId || ''}
          lastWheelSpinDate={appState.lastWheelSpinDate || ''}
          onBuySkin={async (skin) => {
            const save = await localGameService.purchaseAndEquip(skin.id);
            playSoundEffect('levelup');
            setAppState((previous) => projectSaveToAppState(save, previous));
            return true;
          }}
          onEquipSkin={async (skin) => {
            if (!appState.ownedSkinIds?.includes(skin.id)) return;
            const save = await localEconomyService.equipItem(skin.id);
            playSoundEffect('click');
            setAppState((previous) => projectSaveToAppState(save, previous));
          }}
          onClaimDailyWheel={async () => {
            const today = getTodayDateString();
            const claimed = await localGameService.claimWheel(today);
            playSoundEffect('levelup');
            setAppState((previous) => projectSaveToAppState(claimed.save, previous));
            return { reward: claimed.result.reward, balance: claimed.result.balance };
          }}
          iapAvailable={localIapService.isAvailable()}
          nativePlatform={nativeRuntimeService.platform()}
          onLoadCreditProducts={loadIapProducts}
          onPurchaseCredits={purchaseIapProduct}
          onClose={() => setActiveDestination('home')}
        />
      )}

        </div>

        {/* Bottom Navigation Bar */}
        <BottomBar
          lang={lang}
          onGoHome={() => { setActiveDestination('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onOpenMissions={() => { playSoundEffect('click'); setObjectiveInitialView('missions'); setActiveDestination('missions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onOpenAppHub={() => { playSoundEffect('click'); setActiveDestination('appHub'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onOpenShop={() => {
            playSoundEffect('click');
            setActiveDestination('shop');
          }}
          onOpenMenu={() => setIsArcMenuOpen(true)}
          activeDestination={activeDestination}
        />
      </div>

      {introductionMode && <AppIntroduction lang={lang} onDismiss={finishIntroduction} />}

      {/* MODALS */}

      {isArcMenuOpen && <ArcMenuModal lang={lang} onClose={() => setIsArcMenuOpen(false)} onOpenAchievements={() => { setIsArcMenuOpen(false); setObjectiveInitialView('achievements'); setActiveDestination('missions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onOpenStats={() => { setIsArcMenuOpen(false); setIsGraphOpen(true); }} onOpenSettings={() => { setIsArcMenuOpen(false); setIsSettingsOpen(true); }} onOpenRoutine={() => { setIsArcMenuOpen(false); setHomeDetailSurface('routine'); }} onOpenCalendar={() => { setIsArcMenuOpen(false); setHomeDetailSurface('calendar'); }} onCreateCharacter={() => { setIsArcMenuOpen(false); setIsConfirmNewCharOpen(true); }} />}

      {homeDetailSurface && <div className="arc-modal-overlay arc-detail-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"><section className="arc-detail-surface"><button className="arc-detail-close" onClick={() => setHomeDetailSurface(null)}>×</button>{homeDetailSurface === 'routine' ? <WeeklyRoutineWidget appState={appState} lang={lang} onToggleMinimize={() => setHomeDetailSurface(null)} onUpdateAppState={(updated) => { setAppState((prev) => ({ ...prev, ...updated })); if (updated.weeklyRoutine) void localProfileService.updateWeeklyRoutine(updated.weeklyRoutine); }} playSoundEffect={playSoundEffect} /> : <CalendarWidget appState={appState} lang={lang} onToggleMinimize={() => setHomeDetailSurface(null)} onUpdateAppState={(updated) => { setAppState((prev) => ({ ...prev, ...updated })); if (updated.calendarState) void localProfileService.updateCalendar(updated.calendarState); }} playSoundEffect={playSoundEffect} />}</section></div>}

      {/* Daily Task Detail Modal */}
      {selectedStatForTask && (() => {
        const selectedAssignment = appState.arcAssignments?.find(
          (assignment) => assignment.stat_id === selectedStatForTask.id,
        );
        if (!selectedAssignment) return null;
        return (
        <TaskModal
          stat={selectedStatForTask}
          task={mapLocalAssignmentToTaskItem(selectedAssignment, lang)}
          isCompleted={selectedAssignment.completed_at !== null}
          assignmentKind={selectedAssignment.assignment_kind}
          restdayOptions={getLocalRestdayOptions(selectedAssignment)}
          lang={lang}
          onClose={() => setSelectedStatForTask(null)}
          onMarkDone={handleMarkTaskDone}
        />
        );
      })()}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onReplayIntroduction={() => { setIsSettingsOpen(false); setActiveDestination('home'); setIntroductionMode('replay'); }}
          appState={appState}
          lang={lang}
          onSetLanguage={handleSetLanguage}
          onSaveProfile={async (prof) => {
            const save = await localGameService.updateProfile(prof);
            setAppState((previous) => projectSaveToAppState(save, previous));
          }}
          onSaveStats={async (stats) => {
            const save = await localProgressionService.syncCustomAttributes(stats);
            setAppState((previous) => projectSaveToAppState(save, previous));
          }}
          onSaveQuoteSettings={(qs) => {
            setAppState((prev) => ({ ...prev, quoteSettings: qs }));
            void localProfileService.updateSettings({ quotes: qs }).catch((error) => console.warn('ARC local quote-settings update failed:', error));
          }}
          onSaveBottomModules={(mods) =>
            {
              setAppState((prev) => ({ ...prev, activeBottomModules: mods }));
              void localProfileService.updateSettings({ activeBottomModules: mods }).catch((error) => console.warn('ARC local module-settings update failed:', error));
            }
          }
          onClose={() => setIsSettingsOpen(false)}
          onExportBackup={shareOrDownloadArcBackup}
          onImportBackup={async (file) => {
            const imported = await importLocalArcBackup(await file.text());
            setLang(imported.settings.language);
            setAppState((previous) => projectSaveToAppState(imported, previous));
            const title = imported.titles.owned.find((item) => item.title_id === imported.titles.equippedTitleId);
            setEquippedAchievementTitle(title ? getLocalizedTitleName(title.title_id, imported.settings.language, title) : null);
            setArcInitializationStatus(imported.progression.initializedAt ? 'initialized' : 'missing');
          }}
          onRequestReset={() => { setIsSettingsOpen(false); setIsConfirmNewCharOpen(true); }}
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
              const operationId = `${getTodayDateString()}:${moduleId}:${appState.moduleReloadsCountToday ?? 0}`;
              const save = await localGameService.spendForModuleReload(moduleId, operationId, newSeenIds);
              setAppState((previous) => projectSaveToAppState(save, previous));
              return true;
            } catch (error) {
              console.error('Module reload credit charge failed:', error);
              return false;
            }
          }}
          onOpenShop={() => {
            setActiveExtraModule(null);
            setActiveDestination('shop');
          }}
          onClose={() => setActiveExtraModule(null)}
        />
      )}

      {/* Confirmation Modal for Creating New Character */}
      {isConfirmNewCharOpen && (
        <div className="arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-mono animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="arc-reset-title"
            className="arc-modal relative w-full max-w-md bg-slate-900 border rounded-xl p-5 sm:p-6 shadow-2xl space-y-4"
            style={{
              borderColor: 'var(--theme-c1)',
              boxShadow: '0 0 30px var(--theme-glow1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-c1)' }} />
                <h3 id="arc-reset-title" className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  {lang === 'en' ? 'Create new character?' : 'Neuen Charakter erstellen?'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isResettingCharacter) setIsConfirmNewCharOpen(false);
                }}
                disabled={isResettingCharacter}
                aria-label={lang === 'en' ? 'Close reset confirmation' : 'Zurücksetzen-Dialog schließen'}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Message */}
            <div className="space-y-3">
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {lang === 'en'
                  ? 'Your current character, progression, tasks, missions and achievements will be permanently deleted.'
                  : 'Dein aktueller Charakter, Fortschritt, Aufgaben, Missionen und Erfolge werden dauerhaft gelöscht.'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'en' ? 'Progress is stored only on this device. Export a backup before resetting if you may need it later.' : 'Fortschritt wird nur auf diesem Gerät gespeichert. Exportiere vor dem Zurücksetzen ein Backup, falls du ihn später noch benötigst.'}
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
                  <span>{lang === 'en' ? 'Local Collection Preserved' : 'Lokale Sammlung bleibt erhalten'}</span>
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
