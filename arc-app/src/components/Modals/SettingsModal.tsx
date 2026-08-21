import React, { useState, useRef } from 'react';
import {
  AppState,
  StatAttribute,
  UserProfile,
  QuoteSettings,
  QuoteCategory,
  ReligionSubCategory,
  TaskItem,
  BottomBarModuleId,
  DeletedTaskItem,
} from '../../types';
import { ALL_EXTRA_MODULES } from '../../data/extraModules';
import { AVATAR_PRESETS } from '../../data/avatars';
import { AVAILABLE_SKINS, translateSkinName } from '../../data/skinData';
import { getTierIndex, getTierInfo, get365PresetTasksForStat } from '../../data/taskDatabase';
import { INTERFACE_COLOR_PALETTE, UI_ANIMATION_OPTIONS } from '../../data/shopData';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  User,
  Flame,
  LayoutGrid,
  Check,
  GripVertical,
  Upload,
  ChevronDown,
  Sparkles,
  Lock,
  RotateCcw,
  Palette,
  Film,
  Zap,
  Globe,
} from 'lucide-react';
import { Language, t, translateStatName } from '../../utils/i18n';

interface SettingsModalProps {
  appState: AppState;
  lang?: Language;
  onSetLanguage?: (lang: Language) => void;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onSaveStats: (stats: StatAttribute[]) => void;
  onSaveQuoteSettings: (settings: QuoteSettings) => void;
  onSaveBottomModules: (modules: BottomBarModuleId[]) => void;
  onSaveDeletedTasks?: (deletedTasks: DeletedTaskItem[]) => void;
  onOpenDeletedTasksModal?: () => void;
  onToggleDesignColor?: (colorHex: string) => void;
  onEquipAnimation?: (animId: string) => void;
  onOpenShopWithTab?: (tab: 'design' | 'animations') => void;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['📚', '💪', '🧘‍♂️', '⚡', '💼', '💎', '🔥', '🧠', '🛡️', '🎯', '👑', '🚀', '🥊', '🏛️'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  appState,
  lang: rawLang = 'de',
  onSetLanguage,
  onSaveProfile,
  onSaveStats,
  onSaveQuoteSettings,
  onSaveBottomModules,
  onSaveDeletedTasks,
  onOpenDeletedTasksModal,
  onToggleDesignColor,
  onEquipAnimation,
  onOpenShopWithTab,
  onClose,
}) => {
  const lang: Language = (rawLang === 'en' ? 'en' : 'de');
  const [activeTab, setActiveTab] = useState<'stats' | 'profile' | 'motivation' | 'bottom_bar' | 'design' | 'language'>('stats');

  // --- STATS TAB STATE ---
  const [stats, setStats] = useState<StatAttribute[]>(appState.stats);
  const [selectedStatId, setSelectedStatId] = useState<string>(appState.stats[0]?.id || '');
  const [isAddingTaskModalOpen, setIsAddingTaskModalOpen] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [showEmojiPickerForStatId, setShowEmojiPickerForStatId] = useState<string | null>(null);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTaskItem[]>(appState.deletedTasks || []);

  // New Stat Form State
  const [isAddingNewStat, setIsAddingNewStat] = useState<boolean>(false);
  const [newStatName, setNewStatName] = useState<string>('');
  const [newStatEmoji, setNewStatEmoji] = useState<string>('⭐');

  // Drag & Drop / Reorder & Delete task state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isOverTrashZone, setIsOverTrashZone] = useState<boolean>(false);
  const [draggedOverTaskIndex, setDraggedOverTaskIndex] = useState<number | null>(null);
  const [taskTierFilter, setTaskTierFilter] = useState<'unlocked' | 'current' | 'all'>('unlocked');
  const trashZoneRef = useRef<HTMLDivElement | null>(null);

  // --- PROFILE TAB STATE ---
  const [profile, setProfile] = useState<UserProfile>(appState.profile);
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- MOTIVATION TAB STATE ---
  const [quoteCategories, setQuoteCategories] = useState<QuoteCategory[] | ['alle']>(
    appState.quoteSettings.selectedCategories
  );
  const [religionSub, setReligionSub] = useState<ReligionSubCategory | undefined>(
    appState.quoteSettings.selectedReligion
  );
  const [isChangingQuotesModalOpen, setIsChangingQuotesModalOpen] = useState<boolean>(false);

  // --- BOTTOM BAR MODULES STATE ---
  const [selectedModules, setSelectedModules] = useState<BottomBarModuleId[]>(
    appState.activeBottomModules
  );

  const currentActiveStat = (stats && stats.length > 0)
    ? (stats.find((s) => s.id === selectedStatId) || stats[0])
    : undefined;

  // Stat Handlers
  const handleUpdateStatName = (id: string, name: string) => {
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleUpdateStatEmoji = (id: string, emoji: string) => {
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, emoji } : s)));
    setShowEmojiPickerForStatId(null);
  };

  const handleToggleTaskSelectionMode = (id: string) => {
    setStats((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, taskSelectionMode: s.taskSelectionMode === 'random' ? 'sequential' : 'random' }
          : s
      )
    );
  };

  const handleCreateNewStat = () => {
    if (!newStatName.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newStatObj: StatAttribute = {
      id: newId,
      name: newStatName.trim(),
      emoji: newStatEmoji,
      value: 1,
      taskSelectionMode: 'random',
      tasks: [
        {
          id: `t-${Date.now()}`,
          title: `${newStatName.trim()} Aufgabe`,
          description: `Tägliche Gewohnheit für ${newStatName.trim()} ausführen.`,
          order: 1,
        },
      ],
    };
    const updated = [...stats, newStatObj];
    setStats(updated);
    setSelectedStatId(newId);
    setNewStatName('');
    setIsAddingNewStat(false);
  };

  const handleDeleteStat = (id: string) => {
    if (stats.length <= 1) return;
    const updated = stats.filter((s) => s.id !== id);
    setStats(updated);
    if (selectedStatId === id) {
      setSelectedStatId(updated[0].id);
    }
  };

  // Task Handlers
  const handleAddTaskToCurrentStat = () => {
    if (!newTaskTitle.trim()) return;
    if (!currentActiveStat) return;

    const currentTierIndex = getTierIndex(currentActiveStat.value);

    const newTaskObj: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || newTaskTitle.trim(),
      order: currentActiveStat.tasks.length + 1,
      tier: currentTierIndex,
      isCustom: true, // Marked as custom user task -> exempt from tier rules!
    };

    const updatedTasks = [...currentActiveStat.tasks, newTaskObj];
    setStats((prev) =>
      prev.map((s) => (s.id === currentActiveStat.id ? { ...s, tasks: updatedTasks } : s))
    );

    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAddingTaskModalOpen(false);
  };

  const handleDeleteTaskFromCurrentStat = (taskId: string) => {
    if (!currentActiveStat) return;
    const taskToDelete = currentActiveStat.tasks.find((t) => t.id === taskId);
    const updatedTasks = currentActiveStat.tasks.filter((t) => t.id !== taskId);

    setStats((prev) =>
      prev.map((s) => (s.id === currentActiveStat.id ? { ...s, tasks: updatedTasks } : s))
    );

    if (taskToDelete) {
      const deletedItem: DeletedTaskItem = {
        id: taskToDelete.id,
        statId: currentActiveStat.id,
        statName: currentActiveStat.name,
        statEmoji: currentActiveStat.emoji,
        title: taskToDelete.title,
        description: taskToDelete.description,
        tier: taskToDelete.tier,
        isCustom: taskToDelete.isCustom,
        deletedAt: new Date().toISOString(),
      };
      const updatedDeleted = [deletedItem, ...deletedTasks];
      setDeletedTasks(updatedDeleted);
      if (onSaveDeletedTasks) {
        onSaveDeletedTasks(updatedDeleted);
      }
    }

    setDraggedTaskId(null);
    setIsOverTrashZone(false);
  };

  const handleReorderTasks = (sourceId: string, targetIndex: number) => {
    if (!currentActiveStat) return;

    const currentTierIndex = getTierIndex(currentActiveStat.value);
    const tasks = [...currentActiveStat.tasks];
    const sourceIndex = tasks.findIndex((t) => t.id === sourceId);
    if (sourceIndex === -1 || sourceIndex === targetIndex) return;

    const sourceTask = tasks[sourceIndex];
    const targetTask = tasks[targetIndex];

    // Check if source and target are reorderable (unlocked: tier <= currentTierIndex OR custom)
    const isSourceReorderable =
      sourceTask.isCustom || sourceTask.tier === undefined || sourceTask.tier <= currentTierIndex;
    const isTargetReorderable =
      targetTask.isCustom || targetTask.tier === undefined || targetTask.tier <= currentTierIndex;

    if (!isSourceReorderable || !isTargetReorderable) {
      alert(
        lang === 'en'
          ? 'Only unlocked tasks up to your current percentage level and custom tasks can be reordered.'
          : 'Nur freigeschaltete Aufgaben bis zu deinem aktuellen Prozentwert sowie eigene Aufgaben können in der Reihenfolge verschoben werden.'
      );
      return;
    }

    const [movedTask] = tasks.splice(sourceIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);

    const reorderedTasks = tasks.map((t, idx) => ({ ...t, order: idx + 1 }));

    setStats((prev) =>
      prev.map((s) => (s.id === currentActiveStat.id ? { ...s, tasks: reorderedTasks } : s))
    );
  };

  // Touch Drag Handlers (for mobile/tablet touch screens)
  const handleTouchStartTask = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleTouchMoveTask = (e: React.TouchEvent) => {
    if (!draggedTaskId) return;
    const touch = e.touches[0];
    if (!touch) return;

    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elementUnderTouch && trashZoneRef.current && trashZoneRef.current.contains(elementUnderTouch)) {
      setIsOverTrashZone(true);
    } else {
      setIsOverTrashZone(false);
    }
  };

  const handleTouchEndTask = () => {
    if (draggedTaskId && isOverTrashZone) {
      handleDeleteTaskFromCurrentStat(draggedTaskId);
    }
    setDraggedTaskId(null);
    setIsOverTrashZone(false);
    setDraggedOverTaskIndex(null);
  };

  // Profile Save
  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      await onSaveProfile(profile);
      onSaveStats(stats);
      onSaveQuoteSettings({
        selectedCategories: quoteCategories,
        selectedReligion: religionSub,
      });
      onSaveBottomModules(selectedModules);
      onClose();
    } catch (error) {
      console.error('Profile save failed:', error);
      setSaveError(
        lang === 'en'
          ? 'Could not save profile changes. Please try again.'
          : 'Profiländerungen konnten nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Quote Category
  const handleToggleCategory = (cat: QuoteCategory | 'alle') => {
    if (cat === 'alle') {
      setQuoteCategories(['alle']);
    } else {
      let filtered = quoteCategories.filter((c) => c !== 'alle') as QuoteCategory[];
      if (filtered.includes(cat)) {
        filtered = filtered.filter((c) => c !== cat);
      } else {
        filtered.push(cat);
      }
      setQuoteCategories(filtered.length === 0 ? ['alle'] : filtered);
    }
  };

  // Toggle Bottom Module
  const handleToggleModule = (modId: BottomBarModuleId) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter((m) => m !== modId));
    } else {
      if (selectedModules.length >= 3) {
        alert(
          lang === 'en'
            ? 'Maximum of 3 extra modules in the bottom bar allowed at once.'
            : 'Maximal 3 Zusatz-Felder in der unteren Leiste gleichzeitig erlaubt.'
        );
        return;
      }
      setSelectedModules([...selectedModules, modId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-xl p-4 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[90vh] flex flex-col">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="border-b border-slate-800 pb-3 mb-4 pr-10">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide mb-3 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'en' ? 'SYSTEM SETTINGS' : 'SYSTEM EINSTELLUNGEN'}</span>
          </h2>

          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'stats'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Attributes & Tasks' : 'Statuswerte & Aufgaben'}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'profile'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Profile' : 'Profil'}</span>
            </button>

            <button
              onClick={() => setActiveTab('motivation')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'motivation'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Motivation</span>
            </button>

            <button
              onClick={() => setActiveTab('bottom_bar')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'bottom_bar'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Bottom Bar' : 'Untere Leiste'}</span>
            </button>

            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'design'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Design & FX</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'language'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('tabLanguage', lang)}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: STATUSWERTE & AUFGABEN */}
        {activeTab === 'stats' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 font-bold">{lang === 'en' ? 'Manage Attributes' : 'Statuswerte verwalten'}</span>
              <button
                onClick={() => setIsAddingNewStat(true)}
                className="flex items-center space-x-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded text-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'New Attribute' : 'Neuer Statuswert'}</span>
              </button>
            </div>

            {/* Create New Stat Form */}
            {isAddingNewStat && (
              <div className="bg-slate-950 p-3 rounded-lg border border-cyan-500/30 space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-cyan-400">{lang === 'en' ? 'Create new custom attribute' : 'Neuen eigenen Statuswert anlegen'}</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStatName}
                    onChange={(e) => setNewStatName(e.target.value)}
                    placeholder={lang === 'en' ? 'Attribute Name e.g. Discipline' : 'Stat Name z.B. Disziplin'}
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-1.5 outline-none focus:border-cyan-400"
                  />
                  <select
                    value={newStatEmoji}
                    onChange={(e) => setNewStatEmoji(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-sm text-cyan-200 rounded px-2 outline-none"
                  >
                    {EMOJI_OPTIONS.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreateNewStat}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded text-xs"
                  >
                    {lang === 'en' ? 'Add' : 'Hinzufügen'}
                  </button>
                </div>
              </div>
            )}

            {/* Stats Pills Selector */}
            <div className="flex flex-wrap gap-2">
              {stats.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatId(st.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedStatId === st.id
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{st.emoji}</span>
                  <span>{lang === 'en' ? translateStatName(st.name, 'en') : st.name}</span>
                </button>
              ))}
            </div>

            {/* Current Selected Stat Config Box */}
            {currentActiveStat && (
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    {/* Square Emoji Picker Button */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowEmojiPickerForStatId(
                            showEmojiPickerForStatId === currentActiveStat.id ? null : currentActiveStat.id
                          )
                        }
                        title={lang === 'en' ? 'Select emoji as icon' : 'Emoji als Icon auswählen'}
                        className="w-9 h-9 rounded bg-slate-900 border border-cyan-500/40 text-xl flex items-center justify-center hover:border-cyan-400 transition-all"
                      >
                        {currentActiveStat.emoji}
                      </button>

                      {/* Emoji Picker Dropdown */}
                      {showEmojiPickerForStatId === currentActiveStat.id && (
                        <div className="absolute top-11 left-0 z-30 bg-slate-900 border border-cyan-500/40 rounded-lg p-2 grid grid-cols-5 gap-1.5 shadow-xl w-48">
                          {EMOJI_OPTIONS.map((em) => (
                            <button
                              key={em}
                              onClick={() => handleUpdateStatEmoji(currentActiveStat.id, em)}
                              className="text-lg hover:bg-slate-800 p-1 rounded transition-colors text-center"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stat Name Text Field Input */}
                    <input
                      type="text"
                      value={lang === 'en' && !currentActiveStat.isCustom ? translateStatName(currentActiveStat.name, 'en') : currentActiveStat.name}
                      onChange={(e) => handleUpdateStatName(currentActiveStat.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-sm font-bold text-cyan-200 rounded px-3 py-1.5 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Random vs Sequential toggle */}
                    <button
                      onClick={() => handleToggleTaskSelectionMode(currentActiveStat.id)}
                      className="text-[11px] bg-slate-900 border border-slate-700 hover:border-cyan-500/40 px-2.5 py-1 rounded text-slate-300"
                    >
                      {lang === 'en'
                        ? `Mode: ${currentActiveStat.taskSelectionMode === 'random' ? '🎲 Random' : '🔢 Sequential'}`
                        : `Modus: ${currentActiveStat.taskSelectionMode === 'random' ? '🎲 Zufällig' : '🔢 Reihenfolge'}`}
                    </button>

                    {/* Delete stat button */}
                    {stats.length > 1 && (
                      <button
                        onClick={() => handleDeleteStat(currentActiveStat.id)}
                        title={lang === 'en' ? 'Delete attribute' : 'Statuswert löschen'}
                        className="p-1.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-400 hover:bg-rose-900 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Difficulty Tier Info Box */}
                {(() => {
                  const currentTier = getTierIndex(currentActiveStat.value);
                  const tierInfo = getTierInfo(currentTier, lang);
                  return (
                    <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold">
                          {tierInfo.label}
                        </span>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                            {lang === 'en' ? `Difficulty Level (${currentActiveStat.value}%)` : `Schwierigkeits-Grad (${currentActiveStat.value}%)`}
                          </span>
                          <span className="text-slate-200 font-bold">
                            {lang === 'en'
                              ? `All tasks up to Level ${tierInfo.levelNumber} (${tierInfo.maxPercent}%) unlocked`
                              : `Alle Aufgaben bis Stufe ${tierInfo.levelNumber} (${tierInfo.maxPercent}%) freigeschaltet`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-cyan-400/80 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/20">
                        {lang === 'en' ? '8% Staggering' : '8% Staffelung'}
                      </span>
                    </div>
                  );
                })()}

                {/* Starting Percentage Setting Box */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {lang === 'en' ? 'Start Percentage / Status Value (%)' : 'Start-Prozentwert / Statuswert (%)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {lang === 'en'
                        ? 'Setting your percentage unlocks all tasks and daily protocols up to that level (e.g. 70%).'
                        : 'Das Anpassen des Prozentwerts schaltet alle Aufgaben und Protokolle bis zu diesem Wert frei (z.B. 70%).'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={1}
                      value={currentActiveStat.startValue ?? currentActiveStat.value ?? 0}
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value, 10) || 0;
                        setStats((prev) =>
                          prev.map((s) => {
                            if (s.id === currentActiveStat.id) {
                              return { ...s, startValue: newVal, value: newVal };
                            }
                            return s;
                          })
                        );
                      }}
                      className="w-24 accent-cyan-400 cursor-pointer"
                    />
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={currentActiveStat.startValue ?? currentActiveStat.value ?? 0}
                      onChange={(e) => {
                        const newVal = Math.min(99, Math.max(0, parseInt(e.target.value, 10) || 0));
                        setStats((prev) =>
                          prev.map((s) => {
                            if (s.id === currentActiveStat.id) {
                              return { ...s, startValue: newVal, value: newVal };
                            }
                            return s;
                          })
                        );
                      }}
                      className="w-16 bg-slate-950 border border-cyan-500/40 font-bold text-cyan-300 rounded px-2 py-1 text-center outline-none focus:border-cyan-400"
                    />
                    <span className="text-cyan-400 font-bold">%</span>
                  </div>
                </div>

                {/* Tasks List Header & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800">
                  <span className="font-bold flex items-center space-x-1">
                    <span>{lang === 'en' ? 'Daily Tasks' : 'Tages-Aufgaben'}</span>
                    <span className="text-[10px] text-slate-500">
                      ({currentActiveStat.tasks.length})
                    </span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {/* Task Tier Filter Tabs */}
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800 text-[10px]">
                      <button
                        onClick={() => setTaskTierFilter('unlocked')}
                        className={`px-2 py-0.5 rounded transition-all font-bold ${
                          taskTierFilter === 'unlocked'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang === 'en' ? 'Unlocked' : 'Freigeschaltet'}
                      </button>
                      <button
                        onClick={() => setTaskTierFilter('current')}
                        className={`px-2 py-0.5 rounded transition-all font-bold ${
                          taskTierFilter === 'current'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang === 'en' ? 'Current Tier' : 'Aktuelle Stufe'}
                      </button>
                      <button
                        onClick={() => setTaskTierFilter('all')}
                        className={`px-2 py-0.5 rounded transition-all font-bold ${
                          taskTierFilter === 'all'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang === 'en' ? 'All Tiers' : 'Alle Stufen'}
                      </button>
                    </div>

                    <button
                      onClick={() => setIsAddingTaskModalOpen(true)}
                      className="flex items-center space-x-1 text-xs bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Add Custom Task' : 'Eigene Aufgabe'}</span>
                    </button>
                  </div>
                </div>

                {/* Instruction for drag and drop */}
                <p className="text-[10px] text-slate-400 italic flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Drag & drop unlocked tasks to reorder or into the trash below to delete. Raising your % unlocks higher tiers.'
                      : 'Ziehe freigeschaltete Aufgaben zum Umsortieren oder in den Mülleimer unten zum Löschen. Höhere Prozentwerte schalten mehr Stufen frei.'}
                  </span>
                </p>

                {/* Task List */}
                <div className="space-y-2 relative">
                  {(() => {
                    const activeTier = getTierIndex(currentActiveStat.value);
                    const filteredTasks = currentActiveStat.tasks.filter((tk) => {
                      if (taskTierFilter === 'unlocked') {
                        return tk.isCustom || tk.tier === undefined || tk.tier <= activeTier;
                      }
                      if (taskTierFilter === 'current') {
                        return tk.isCustom || tk.tier === activeTier;
                      }
                      return true; // 'all'
                    });

                    if (filteredTasks.length === 0) {
                      return (
                        <div className="text-center py-6 border border-slate-800 rounded-lg bg-slate-900/50 text-slate-500 text-xs">
                          {lang === 'en'
                            ? 'No tasks found for this filter. Click "Add Custom Task" above or adjust your filter.'
                            : 'Keine Aufgaben für diesen Filter gefunden. Klicke oben auf "Eigene Aufgabe" oder passe den Filter an.'}
                        </div>
                      );
                    }

                    return filteredTasks.map((tk, idx) => {
                      const isDraggingThis = draggedTaskId === tk.id;
                      const isDraggedOver = draggedOverTaskIndex === idx;
                      const isUnlocked = tk.isCustom || tk.tier === undefined || tk.tier <= activeTier;
                      const isReorderable = isUnlocked;
                      const taskTierInfo = tk.tier !== undefined ? getTierInfo(tk.tier, lang) : null;

                      const preset365En = lang === 'en' && !tk.isCustom ? get365PresetTasksForStat(currentActiveStat.id, currentActiveStat.name, 'en') : [];
                      const matchedEn = preset365En.find((t) => t.id === tk.id) || (tk.tier !== undefined ? preset365En.find((t) => t.tier === tk.tier && t.order === tk.order) : null);

                      const displayTitle = matchedEn ? matchedEn.title : tk.title;
                      const displayDesc = matchedEn ? matchedEn.description : tk.description;

                      return (
                        <div
                          key={tk.id}
                          draggable={isReorderable}
                          onDragStart={(e) => {
                            if (!isReorderable) return;
                            e.dataTransfer.setData('text/plain', tk.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedTaskId(tk.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setIsOverTrashZone(false);
                            setDraggedOverTaskIndex(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (isReorderable) {
                              e.dataTransfer.dropEffect = 'move';
                              if (draggedTaskId && draggedTaskId !== tk.id) {
                                setDraggedOverTaskIndex(idx);
                              }
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                            if (sourceId && sourceId !== tk.id) {
                              handleReorderTasks(sourceId, idx);
                            }
                            setDraggedTaskId(null);
                            setDraggedOverTaskIndex(null);
                          }}
                          onTouchStart={() => isReorderable && handleTouchStartTask(tk.id)}
                          onTouchMove={handleTouchMoveTask}
                          onTouchEnd={handleTouchEndTask}
                          className={`p-3 rounded-lg border transition-all duration-200 flex items-start justify-between gap-2 select-none ${
                            !isUnlocked
                              ? 'bg-slate-950/80 border-slate-800/80 opacity-50 cursor-not-allowed'
                              : isDraggingThis
                              ? 'opacity-40 bg-slate-800 border-cyan-500 border-dashed scale-95'
                              : isDraggedOver
                              ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-[1.02]'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-grab active:cursor-grabbing'
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            {isReorderable ? (
                              <GripVertical className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" title={lang === 'en' ? `Locked. Unlocks at ${taskTierInfo?.minPercent}%` : `Gesperrt. Freischaltung ab ${taskTierInfo?.minPercent}%`} />
                            )}
                            <div>
                              <div className="text-xs font-bold text-slate-100 flex items-center space-x-2 flex-wrap gap-y-1">
                                <span>
                                  {idx + 1}. {displayTitle}
                                </span>
                                {tk.isCustom ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-normal">
                                    {lang === 'en' ? 'Custom Task' : 'Eigene Aufgabe'}
                                  </span>
                                ) : taskTierInfo ? (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                                      tk.tier === activeTier
                                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                                        : isUnlocked
                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}
                                  >
                                    {taskTierInfo.label} {isUnlocked && tk.tier !== activeTier ? '✓' : ''}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{displayDesc}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTaskFromCurrentStat(tk.id);
                            }}
                            title={lang === 'en' ? 'Delete task' : 'Aufgabe löschen'}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Mülleimer / Trash Drop Zone for Drag & Delete */}
                <div
                  ref={trashZoneRef}
                  id="trash-drop-zone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setIsOverTrashZone(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsOverTrashZone(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsOverTrashZone(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                    if (taskId) {
                      handleDeleteTaskFromCurrentStat(taskId);
                    }
                    setDraggedTaskId(null);
                    setIsOverTrashZone(false);
                  }}
                  className={`mt-3 p-4 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${
                    isOverTrashZone
                      ? 'bg-rose-950 border-rose-500 text-rose-200 scale-[1.02] shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse'
                      : draggedTaskId
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-300 animate-bounce shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-rose-500/40 hover:text-rose-400'
                  }`}
                >
                  <Trash2 className={`w-5 h-5 transition-transform ${isOverTrashZone ? 'scale-125 text-rose-400' : ''}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-center">
                    {isOverTrashZone
                      ? (lang === 'en' ? '🔥 RELEASE TASK NOW TO DELETE!' : '🔥 AUFGABE JETZT LOSLASSEN ZUM LÖSCHEN!')
                      : draggedTaskId
                      ? (lang === 'en' ? '🎯 DROP HERE TO DELETE' : '🎯 HIERHIN ZIEHEN ZUM LÖSCHEN')
                      : (lang === 'en' ? 'Trash: Drag tasks here to delete' : 'Mülleimer: Ziehe Aufgaben hierhin zum Löschen')}
                  </span>
                </div>

                {/* Gelöschte Aufgaben Wiederherstellen Button */}
                {onOpenDeletedTasksModal && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onOpenDeletedTasksModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/50 text-rose-300 border border-rose-500/30 hover:border-rose-500/60 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <span>{lang === 'en' ? `Restore deleted tasks (${deletedTasks.length})` : `Gelöschte Aufgaben wiederherstellen (${deletedTasks.length})`}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                {lang === 'en' ? 'Customize Profile & Character Data' : 'Profil & Charakter Daten Anpassen'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">{lang === 'en' ? 'Name / Codename' : 'Name / Codename'}</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">{lang === 'en' ? 'Gender' : 'Geschlecht'}</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, gender: 'm' })}
                      className={`flex-1 py-1.5 rounded text-xs border ${
                        profile.gender === 'm'
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'en' ? '♂ Male' : '♂ Männlich'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, gender: 'f' })}
                      className={`flex-1 py-1.5 rounded text-xs border ${
                        profile.gender === 'f'
                          ? 'bg-pink-950 border-pink-400 text-pink-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'en' ? '♀ Female' : '♀ Weiblich'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">{lang === 'en' ? 'Weight (kg)' : 'Gewicht (kg)'}</label>
                  <input
                    type="number"
                    value={profile.weight || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        weight: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">{lang === 'en' ? 'Height (cm)' : 'Größe (cm)'}</label>
                  <input
                    type="number"
                    value={profile.height || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        height: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Avatar Choose: Premium Purchased Skins (Golden Border) & Standard Avatars */}
              {(() => {
                const ownedSkins = AVAILABLE_SKINS.filter(
                  (s) => appState.ownedSkinIds?.includes(s.id) && s.avatarUrl
                );
                return (
                  <div className="pt-3 border-t border-slate-800 space-y-4">
                    {/* Premium Skins Section with Gold Frame */}
                    {ownedSkins.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span>{lang === 'en' ? 'Unlocked Premium Skins (Purchased)' : 'Freigeschaltete Premium-Skins (Gekauft)'}</span>
                          </label>
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/60 px-2 py-0.5 rounded font-black uppercase tracking-wider shadow">
                            {lang === 'en' ? '★ Golden Frame' : '★ Goldener Rahmen'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-52 overflow-y-auto p-2 bg-gradient-to-b from-amber-950/20 via-slate-950 to-slate-950 rounded-xl border border-amber-500/40">
                          {ownedSkins.map((skin) => {
                            const isSelected = profile.avatarUrl === skin.avatarUrl;
                            return (
                              <div
                                key={skin.id}
                                onClick={() =>
                                  setProfile({ ...profile, avatarUrl: skin.avatarUrl || profile.avatarUrl })
                                }
                                className={`cursor-pointer rounded-xl overflow-hidden relative transition-all border-2 p-1 ${
                                  isSelected
                                    ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-105 bg-amber-500/30 ring-2 ring-amber-400/60'
                                    : 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.35)] bg-slate-900 hover:border-amber-300 hover:scale-105'
                                }`}
                                title={`${translateSkinName(skin, lang)} (${skin.skinCategory})`}
                              >
                                <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-950 relative border border-amber-500/40">
                                  <img
                                    src={skin.avatarUrl}
                                    alt={translateSkinName(skin, lang)}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded shadow">
                                    ★
                                  </div>
                                </div>
                                <div className="p-1 text-center bg-slate-950 rounded-b-lg mt-1">
                                  <span className="text-[9px] font-extrabold text-amber-300 block truncate">
                                    {translateSkinName(skin, lang)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Standard Free Avatars */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        {lang === 'en' ? 'Free Standard Avatars' : 'Kostenlose Standard-Profilbilder'}
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                        {AVATAR_PRESETS.map((av) => (
                          <div
                            key={av.id}
                            onClick={() => setProfile({ ...profile, avatarUrl: av.url })}
                            className={`cursor-pointer rounded-xl overflow-hidden border transition-all ${
                              profile.avatarUrl === av.url
                                ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                                : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-700'
                            }`}
                          >
                            <img
                              src={av.url}
                              alt={av.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-14 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Avatar Ranking Frame Toggle */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-200">
                    {lang === 'en' ? 'Show Ranking Profile Frame' : 'Ranking-Profilrahmen Anzeigen'}
                  </label>
                  <p className="text-[10px] text-slate-400">
                    {lang === 'en'
                      ? 'Enables special reward frames (Rank 1 = Purple + Flame, Top 10% = Gold, Top 20% = Silver).'
                      : 'Aktiviert die speziellen Belohnungsrahmen (Platz 1 = Lila + Flamme, Top 10% = Gold, Top 20% = Silber).'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProfile({ ...profile, showAvatarFrame: profile.showAvatarFrame === false ? true : false })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border shrink-0 ${
                    profile.showAvatarFrame !== false
                      ? 'bg-cyan-600 border-cyan-400'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.showAvatarFrame !== false ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MOTIVATION */}
        {activeTab === 'motivation' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                    {lang === 'en' ? 'Configure Quote Sources' : 'Zitate-Quelle Konfigurieren'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'en'
                      ? 'Choose which media or philosophies your daily quotes come from.'
                      : 'Wähle aus welchen Medien oder Philosophien deine täglichen Zitate stammen.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsChangingQuotesModalOpen(!isChangingQuotesModalOpen)}
                  className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded text-xs transition-all flex items-center space-x-1"
                >
                  <span>{lang === 'en' ? 'Change' : 'Ändern'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quotes Selection Modal Window */}
              {isChangingQuotesModalOpen && (
                <div className="bg-slate-900 p-4 rounded-lg border border-cyan-500/40 space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-cyan-300 border-b border-slate-800 pb-2">
                    {lang === 'en' ? 'Select Categories' : 'Kategorien Auswählen'}
                  </div>

                  {/* Alle option */}
                  <button
                    onClick={() => handleToggleCategory('alle')}
                    className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border ${
                      quoteCategories.includes('alle')
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{lang === 'en' ? '🌟 All Sources (Random)' : '🌟 Alle Quellen (Zufällig)'}</span>
                    {quoteCategories.includes('alle') && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(['filme', 'anime', 'spiele', 'religion', 'philosophie'] as const).map((cat) => {
                      const isSel = quoteCategories.includes(cat);
                      const catNameMap: Record<string, { en: string; de: string }> = {
                        filme: { en: 'Movies', de: 'Filme' },
                        anime: { en: 'Anime', de: 'Anime' },
                        spiele: { en: 'Games', de: 'Spiele' },
                        religion: { en: 'Religion', de: 'Religion' },
                        philosophie: { en: 'Philosophy', de: 'Philosophie' },
                      };
                      const label = catNameMap[cat]?.[lang === 'en' ? 'en' : 'de'] || cat;

                      return (
                        <button
                          key={cat}
                          onClick={() => handleToggleCategory(cat)}
                          className={`text-left p-2.5 rounded text-xs flex items-center justify-between border capitalize ${
                            isSel
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>{label}</span>
                          {isSel && <Check className="w-4 h-4 text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Religion Sub-Categories if religion is selected */}
                  {quoteCategories.includes('religion') && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="block text-xs font-bold text-slate-300">
                        {lang === 'en' ? 'Select specific religion:' : 'Spezifische Religion wählen:'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {(['christentum', 'islam', 'judentum', 'buddhismus', 'hinduismus'] as const).map(
                          (sub) => {
                            const subMap: Record<string, { en: string; de: string }> = {
                              christentum: { en: 'Christianity', de: 'Christentum' },
                              islam: { en: 'Islam', de: 'Islam' },
                              judentum: { en: 'Judaism', de: 'Judentum' },
                              buddhismus: { en: 'Buddhism', de: 'Buddhismus' },
                              hinduismus: { en: 'Hinduism', de: 'Hinduismus' },
                            };
                            const subLabel = subMap[sub]?.[lang === 'en' ? 'en' : 'de'] || sub;

                            return (
                              <button
                                key={sub}
                                onClick={() => setReligionSub(religionSub === sub ? undefined : sub)}
                                className={`py-1.5 px-2 rounded text-[11px] capitalize border ${
                                  religionSub === sub
                                    ? 'bg-amber-950 border-amber-400 text-amber-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                {subLabel}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 block text-[10px]">{lang === 'en' ? 'CURRENT SELECTION:' : 'AKTUELLE AUSWAHL:'}</span>
                <span className="font-bold text-cyan-400 capitalize">
                  {quoteCategories.join(', ')}
                  {religionSub ? ` (${religionSub})` : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UNTERE LEISTE */}
        {activeTab === 'bottom_bar' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">
                {lang === 'en' ? 'Extra Modules for Bottom Bar (Max 3)' : 'Zusatz-Felder für die untere Leiste (Max 3)'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'en'
                  ? 'Choose up to 3 extra modules for quick access on the bottom bar.'
                  : 'Wähle bis zu 3 Zusatz-Module für schnellen Zugriff auf der unteren Leiste aus.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_EXTRA_MODULES.map((mod) => {
                  const isSel = selectedModules.includes(mod.id);
                  const moduleTitleMap: Record<string, { en: string; de: string }> = {
                    motivation: { en: 'Motivational Quotes', de: 'Motivationssprüche' },
                    business_ideas: { en: 'Business Ideas', de: 'Business-Ideen' },
                    books: { en: 'Book Recommendations', de: 'Bücher Empfehlungen' },
                    biohacking: { en: 'Biohacking Protocols', de: 'Biohacking Protocols' },
                    stoic_rules: { en: 'Stoic Rules', de: 'Stoische Regeln' },
                  };
                  const moduleDescMap: Record<string, { en: string; de: string }> = {
                    motivation: {
                      en: 'Daily dose of unwavering discipline & mindset protocols.',
                      de: 'Tägliche Dosis unerschütterliche Disziplin & Mindset-Protokolle.',
                    },
                    business_ideas: {
                      en: 'Scalable business models, SaaS concepts & high-income skills.',
                      de: 'Skalierbare Geschäftsmodelle, SaaS-Konzepte & High-Income-Skills.',
                    },
                    books: {
                      en: 'The 150 most important works for entrepreneurship, mindset, finance & strength.',
                      de: 'Die 150 wichtigsten Werke für Unternehmertum, Mindset, Finanzen & Stärke.',
                    },
                    biohacking: {
                      en: 'Sleep optimization, light exposure, dopamine fasting & recovery.',
                      de: 'Schlafoptimierung, Lichtexposition, Dopamin-Fasten & Erholung.',
                    },
                    stoic_rules: {
                      en: 'Iron maxims for emotional control & resilience.',
                      de: 'Eiserne Maximen zur emotionalen Kontrolle & Resilienz.',
                    },
                  };

                  const titleText = moduleTitleMap[mod.id]?.[lang === 'en' ? 'en' : 'de'] || mod.title;
                  const descText = moduleDescMap[mod.id]?.[lang === 'en' ? 'en' : 'de'] || mod.description;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(mod.id)}
                      className={`cursor-pointer p-3 rounded-lg border transition-all flex items-start justify-between ${
                        isSel
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <span className="text-xl mt-0.5">{mod.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-100">{titleText}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {descText}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isSel ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DESIGN & ANIMATIONEN */}
        {activeTab === 'design' && (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Section 1: Color Customizer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    {lang === 'en' ? 'Interface Color Customizer (Design Palette)' : 'Interface Farbveränderungen (Design Palette)'}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                    {lang === 'en' ? 'Max. 3 Colors' : 'Max. 3 Farben'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleDesignColor && onToggleDesignColor('RESET_STANDARD')}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    title={lang === 'en' ? 'Reset to default design (Neon Cyan)' : 'Zurück zum ursprünglichen Standard-Design (Neon Cyan)'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{lang === 'en' ? 'Select Default Design' : 'Standard-Design wählen'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'Choose your unlocked interface colors (up to 3 simultaneously). The original default design (Neon Cyan) is always free and can be reactivated at any time.'
                    : 'Wähle deine freigeschalteten Interface-Farben aus (bis zu 3 gleichzeitig). Das ursprüngliche Standard-Design (Neon Cyan) ist immer gratis verfügbar und lässt sich jederzeit wieder aktivieren.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {INTERFACE_COLOR_PALETTE.map((col) => {
                    const isUnlocked = col.hex === '#06b6d4' || col.price === 0 || (appState.unlockedDesignColors || []).includes(col.hex);
                    const isSelected = (appState.selectedDesignColors || []).includes(col.hex);
                    const selectedIdx = (appState.selectedDesignColors || []).indexOf(col.hex);

                    return (
                      <div
                        key={col.id}
                        onClick={() => {
                          if (isUnlocked) {
                            if (onToggleDesignColor) onToggleDesignColor(col.hex);
                          } else {
                            if (onOpenShopWithTab) onOpenShopWithTab('design');
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all bg-slate-950 relative flex flex-col items-center justify-center space-y-1.5 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : isUnlocked
                            ? 'border-slate-800 hover:border-cyan-500/50'
                            : 'border-slate-800 opacity-60 hover:opacity-80'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                            #{selectedIdx + 1}
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-900 border border-slate-700 text-amber-400">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}

                        <div
                          className="w-9 h-9 rounded-lg border border-slate-700 shadow"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
                          {lang === 'en' && (col as any).nameEn ? (col as any).nameEn : col.name}
                        </span>
                        {col.hex === '#06b6d4' ? (
                          <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {lang === 'en' ? 'Default' : 'Standard'}
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-[9px] text-emerald-400 font-bold">
                            {lang === 'en' ? 'Unlocked' : 'Freigeschaltet'}
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-400 font-bold">100 Cr (Shop)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 2: Animations */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Film className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    {lang === 'en' ? 'Interface Background Animations' : 'Interface Hintergrund-Animationen'}
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {UI_ANIMATION_OPTIONS.map((anim) => {
                  const isPurchased = (appState.purchasedAnimationIds || []).includes(anim.id);
                  const isEquipped = appState.equippedAnimationId === anim.id;

                  const animName = lang === 'en' && (anim as any).nameEn ? (anim as any).nameEn : anim.name;
                  const animComplexity = lang === 'en' && (anim as any).complexityEn ? (anim as any).complexityEn : anim.complexity;
                  const animDesc = lang === 'en' && (anim as any).descriptionEn ? (anim as any).descriptionEn : anim.description;

                  return (
                    <div
                      key={anim.id}
                      className={`p-3 rounded-xl border transition-all bg-slate-950 flex items-center justify-between ${
                        isEquipped
                          ? 'border-purple-400 bg-purple-950/20 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                          : isPurchased
                          ? 'border-emerald-500/50 bg-emerald-950/10'
                          : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-100">{animName}</span>
                          <span className="text-[9px] text-purple-300 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-500/30">
                            {animComplexity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{animDesc}</p>
                      </div>

                      <div className="shrink-0 ml-3">
                        {isPurchased ? (
                          <button
                            onClick={() => onEquipAnimation && onEquipAnimation(anim.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase transition-all ${
                              isEquipped
                                ? 'bg-purple-500 text-slate-950 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'bg-slate-800 text-slate-200 hover:bg-purple-950 hover:text-purple-300'
                            }`}
                          >
                            {isEquipped ? (lang === 'en' ? 'Active' : 'Aktiv') : (lang === 'en' ? 'Activate' : 'Aktivieren')}
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenShopWithTab && onOpenShopWithTab('animations')}
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold uppercase tracking-wider"
                          >
                            {anim.price} Cr (Shop)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'language' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>{t('languageSettingLabel', lang)}</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onSetLanguage && onSetLanguage('de')}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                    lang === 'de'
                      ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">🇩🇪</span>
                  <span>{t('german', lang)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSetLanguage && onSetLanguage('en')}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                    lang === 'en'
                      ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">🇬🇧</span>
                  <span>{t('english', lang)}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-5 flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          {saveError && <p className="mr-auto text-xs text-red-400">{saveError}</p>}
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-all"
          >
            {lang === 'en' ? 'Cancel' : 'Abbrechen'}
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold px-6 py-2.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>
              {isSaving
                ? (lang === 'en' ? 'SAVING...' : 'WIRD GESPEICHERT...')
                : (lang === 'en' ? 'SAVE CHANGES' : 'ÄNDERUNGEN SPEICHERN')}
            </span>
          </button>
        </div>

        {/* Task Creation Modal Popup */}
        {isAddingTaskModalOpen && currentActiveStat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-400 uppercase">
                  {lang === 'en' ? `New Task for ${translateStatName(currentActiveStat.name, 'en')}` : `Neue Aufgabe für ${currentActiveStat.name}`}
                </span>
                <button
                  onClick={() => setIsAddingTaskModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">{lang === 'en' ? 'Task Title' : 'Titel der Aufgabe'}</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g., 15 min intense stretching' : 'z.B. 15 Min intensives Dehnen'}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">{lang === 'en' ? 'Description / Details' : 'Beschreibung / Details'}</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder={lang === 'en' ? 'Specific description of the task...' : 'Konkrete Beschreibung der Aufgabe...'}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-cyan-200 rounded px-3 py-2 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsAddingTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  {lang === 'en' ? 'Cancel' : 'Abbrechen'}
                </button>
                <button
                  onClick={handleAddTaskToCurrentStat}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded text-xs"
                >
                  {lang === 'en' ? 'Add' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
