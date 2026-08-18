/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppState, StatAttribute, TaskItem, BottomBarModuleConfig, UserAuthAccount } from './types';
import {
  loadAppState,
  saveAppState,
  getRandomQuote,
  getCurrentTaskForStat,
  getTodayDateString,
} from './utils/storage';
import { Language, getStoredLanguage, setStoredLanguage, t } from './utils/i18n';
import { ALL_EXTRA_MODULES } from './data/extraModules';

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

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [showRegisterScreen, setShowRegisterScreen] = useState<boolean>(true);

  // Store Auth state
  const user = useStore((state) => state.user);
  const isAuthInitializing = useStore((state) => state.isAuthInitializing);
  const initializeAuth = useStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user) {
      setShowRegisterScreen(false);
    }
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
  const [isCharacterCreationOpen, setIsCharacterCreationOpen] = useState<boolean>(false);
  const [isConfirmNewCharOpen, setIsConfirmNewCharOpen] = useState<boolean>(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isDeletedTasksOpen, setIsDeletedTasksOpen] = useState<boolean>(false);
  const [shopInitialTab, setShopInitialTab] = useState<'wheel' | 'exchange' | 'marketplace' | 'design' | 'animations'>('marketplace');

  // Design Customizer & Animations Handlers
  const handleUnlockDesignCustomizer = () => {
    playSoundEffect('levelup');
    let success = false;
    setAppState((prev) => {
      const credits = prev.credits || 100;
      if (credits < 100) return prev;
      success = true;
      return {
        ...prev,
        credits: credits - 100,
        hasUnlockedDesignCustomizer: true,
      };
    });
    return success;
  };

  const handleToggleDesignColor = (colorHex: string) => {
    playSoundEffect('click');
    setAppState((prev) => {
      if (colorHex === 'RESET_STANDARD') {
        return { ...prev, selectedDesignColors: ['#06b6d4'] };
      }
      const current = prev.selectedDesignColors || [];
      let updated: string[];
      if (current.includes(colorHex)) {
        updated = current.filter((c) => c !== colorHex);
        if (updated.length === 0) {
          updated = ['#06b6d4']; // Reset to standard cyan if all deselected
        }
      } else {
        if (current.length >= 3) {
          updated = [...current.slice(1), colorHex]; // Replace oldest selected color
        } else {
          updated = [...current, colorHex];
        }
      }
      return { ...prev, selectedDesignColors: updated };
    });
  };

  const handleBuyColor = (color: InterfaceColorOption) => {
    playSoundEffect('levelup');
    let success = false;
    setAppState((prev) => {
      const credits = prev.credits || 100;
      if (credits < color.price) return prev;
      success = true;
      const unlocked = [...(prev.unlockedDesignColors || ['#f59e0b']), color.hex];
      const currentSelected = prev.selectedDesignColors || [];
      let selected: string[];
      if (currentSelected.length < 3) {
        selected = [...currentSelected, color.hex];
      } else {
        selected = [...currentSelected.slice(1), color.hex];
      }
      return {
        ...prev,
        credits: credits - color.price,
        unlockedDesignColors: unlocked,
        selectedDesignColors: selected,
      };
    });
    return success;
  };

  const handleBuyAnimation = (anim: UIAnimationOption) => {
    playSoundEffect('levelup');
    let success = false;
    setAppState((prev) => {
      const credits = prev.credits || 100;
      if (credits < anim.price) return prev;
      success = true;
      const purchased = [...(prev.purchasedAnimationIds || []), anim.id];
      return {
        ...prev,
        credits: credits - anim.price,
        purchasedAnimationIds: purchased,
        equippedAnimationId: anim.id,
      };
    });
    return success;
  };

  const handleEquipAnimation = (animId: string) => {
    playSoundEffect('click');
    setAppState((prev) => ({
      ...prev,
      equippedAnimationId: prev.equippedAnimationId === animId ? '' : animId,
    }));
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
  const handleCharacterCreationComplete = (profile: any, selectedStats: StatAttribute[]) => {
    playSoundEffect('levelup');
    setAppState((prev) => ({
      ...prev,
      profile,
      stats: selectedStats,
    }));
    setIsCharacterCreationOpen(false);
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

  // Mark task completed (+2% stat boost)
  const handleMarkTaskDone = (statId: string) => {
    playSoundEffect('complete');

    setAppState((prev) => {
      if (prev.completedTasksToday.includes(statId)) return prev;

      const updatedStats = prev.stats.map((s) => {
        if (s.id === statId) {
          const newVal = Math.min(100, s.value + 2); // +2 points (+2%)
          return { ...s, value: newVal };
        }
        return s;
      });

      const today = getTodayDateString();
      const newCompleted = [...prev.completedTasksToday, statId];

      // Update history
      const historyCopy = [...prev.history];
      const todayHistIdx = historyCopy.findIndex((h) => h.date === today);
      const newStatMap = updatedStats.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {});

      if (todayHistIdx >= 0) {
        historyCopy[todayHistIdx] = { date: today, stats: newStatMap };
      } else {
        historyCopy.push({ date: today, stats: newStatMap });
      }

      return {
        ...prev,
        stats: updatedStats,
        completedTasksToday: newCompleted,
        history: historyCopy,
      };
    });
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

  // If character creation not done yet, show wizard first
  if (!appState.profile.isCreated || isCharacterCreationOpen) {
    return (
      <CharacterCreation
        initialProfile={appState.profile}
        initialStats={appState.stats}
        onComplete={handleCharacterCreationComplete}
        onClose={() => setIsCharacterCreationOpen(false)}
        isModalMode={appState.profile.isCreated}
      />
    );
  }

  if (showRegisterScreen) {
    return (
      <Register
        lang={lang}
        onSetLanguage={handleSetLanguage}
        onRegisterSuccess={(accountData) => {
          playSoundEffect('levelup');
          setAppState((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              name: accountData.username || prev.profile.name,
            },
            authAccount: {
              email: accountData.email,
              username: accountData.username,
              token: `tok_${Date.now()}`,
            },
          }));
          setShowRegisterScreen(false);
        }}
        onSkipGuest={() => {
          playSoundEffect('click');
          setShowRegisterScreen(false);
        }}
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
            credits={appState.credits || 100}
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
            onOpenShop={() => {
              playSoundEffect('click');
              setIsShopOpen(true);
            }}
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
      {selectedStatForTask && (
        <TaskModal
          stat={selectedStatForTask}
          task={getCurrentTaskForStat(selectedStatForTask, (appState.deletedTasks || []).map((t) => t.id), lang)}
          isCompleted={appState.completedTasksToday.includes(selectedStatForTask.id)}
          lang={lang}
          onClose={() => setSelectedStatForTask(null)}
          onMarkDone={handleMarkTaskDone}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          appState={appState}
          lang={lang}
          onSetLanguage={handleSetLanguage}
          onSaveProfile={(prof) => setAppState((prev) => ({ ...prev, profile: prof }))}
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
          currentCredits={appState.credits || 100}
          onPerformReload={(moduleId, newSeenIds) => {
            playSoundEffect('click');
            let success = false;
            setAppState((prev) => {
              const currentCredits = prev.credits || 100;
              if (currentCredits < 1) return prev;
              success = true;
              return {
                ...prev,
                credits: currentCredits - 1,
                seenModuleItemIds: {
                  ...(prev.seenModuleItemIds || {}),
                  [moduleId]: newSeenIds,
                },
              };
            });
            return success;
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
          lang={lang}
          onUpdateAppState={(updated) => setAppState((prev) => ({ ...prev, ...updated }))}
          onClose={() => setIsCommunityOpen(false)}
        />
      )}

      {/* Shop Modal */}
      {isShopOpen && (
        <ShopModal
          lang={lang}
          currentCredits={appState.credits || 100}
          ownedSkinIds={appState.ownedSkinIds || []}
          equippedSkinId={appState.equippedSkinId || ''}
          lastWheelSpinDate={appState.lastWheelSpinDate || ''}
          hasUnlockedDesignCustomizer={appState.hasUnlockedDesignCustomizer || false}
          unlockedDesignColors={appState.unlockedDesignColors || ['#f59e0b']}
          selectedDesignColors={appState.selectedDesignColors || []}
          purchasedAnimationIds={appState.purchasedAnimationIds || []}
          equippedAnimationId={appState.equippedAnimationId || ''}
          initialTab={shopInitialTab}
          onAddCredits={(amount) => {
            playSoundEffect('levelup');
            setAppState((prev) => ({
              ...prev,
              credits: (prev.credits || 100) + amount,
            }));
          }}
          onBuySkin={(skin) => {
            playSoundEffect('levelup');
            let success = false;
            setAppState((prev) => {
              const currentCredits = prev.credits || 100;
              if (currentCredits < skin.price) return prev;
              success = true;

              const updatedOwnedSkins = [...(prev.ownedSkinIds || []), skin.id];
              const updatedProfile = { ...prev.profile };

              if (skin.avatarUrl) {
                updatedProfile.avatarUrl = skin.avatarUrl;
              }

              return {
                ...prev,
                credits: currentCredits - skin.price,
                ownedSkinIds: updatedOwnedSkins,
                equippedSkinId: skin.id,
                profile: updatedProfile,
              };
            });
            return success;
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
          onSpinWheelSuccess={(creditsWon) => {
            playSoundEffect('levelup');
            const today = getTodayDateString();
            setAppState((prev) => ({
              ...prev,
              credits: (prev.credits || 100) + creditsWon,
              lastWheelSpinDate: today,
            }));
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
                onClick={() => setIsConfirmNewCharOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Message */}
            <div className="space-y-3">
              <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {lang === 'en'
                  ? 'Are you sure? You can also adjust your profile anytime in Settings.'
                  : 'Bist du sicher? Du kannst dein Profil auch in den Einstellungen anpassen.'}
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
                  <span>{lang === 'en' ? 'Purchases & Progress Secured' : 'Käufe & Fortschritt gesichert'}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
                  {lang === 'en'
                    ? 'All purchases (Credits, interface themes, animations, skins) remain saved across characters and linked to your profile.'
                    : 'Sämtliche Käufe (Credits, Interface-Farbschemas, Animationen, Skins) bleiben übergreifend gespeichert und mit deinem Profil gekoppelt.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsConfirmNewCharOpen(false)}
                className="px-4 py-2 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-all"
              >
                {lang === 'en' ? 'Cancel' : 'Abbrechen'}
              </button>
              <button
                onClick={() => {
                  playSoundEffect('click');
                  setIsConfirmNewCharOpen(false);
                  setIsCharacterCreationOpen(true);
                }}
                className="flex items-center space-x-1.5 font-bold px-4 py-2.5 rounded text-xs text-slate-950 uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                style={{
                  background: 'var(--theme-grad)',
                  boxShadow: '0 0 15px var(--theme-glow1)',
                }}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Yes, Create New Character' : 'Ja, neuen Charakter erstellen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
