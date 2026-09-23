import React, { useState, useRef, useEffect } from 'react';
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
import { getLocalizedModuleConfig } from '../../data/extraModulesTranslations';
import { AVAILABLE_SKINS, translateSkinName } from '../../data/skinData';
import { getTierIndex, getTierInfo, get365PresetTasksForStat } from '../../data/taskDatabase';
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
  Globe,
  Download,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { Language, t, translateStatName } from '../../utils/i18n';
import { ARC_RELEASE_LINKS } from '../../config/releaseLinks';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface SettingsModalProps {
  appState: AppState;
  lang?: Language;
  onSetLanguage?: (lang: Language) => void;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onSaveStats: (stats: StatAttribute[]) => Promise<void>;
  onSaveQuoteSettings: (settings: QuoteSettings) => void;
  onSaveBottomModules: (modules: BottomBarModuleId[]) => void;
  onSaveDeletedTasks?: (deletedTasks: DeletedTaskItem[]) => void;
  onOpenDeletedTasksModal?: () => void;
  onClose: () => void;
  onExportBackup: () => Promise<void>;
  onImportBackup: (file: File) => Promise<void>;
  onRequestReset: () => void;
  onReplayIntroduction?: () => void;
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
  onClose,
  onExportBackup,
  onImportBackup,
  onRequestReset,
  onReplayIntroduction,
}) => {
  const lang: Language = (rawLang === 'en' ? 'en' : 'de');
  const [activeTab, setActiveTab] = useState<'stats' | 'profile' | 'motivation' | 'bottom_bar' | 'language' | 'data'>('stats');
  const dialogRef = useModalAccessibility<HTMLDivElement>(onClose);
  const navigationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll only the strip, never the dialog or document.
    const strip = navigationRef.current;
    const selected = strip?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!strip || !selected) return;
    const stripBounds = strip.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    if (selectedBounds.left < stripBounds.left + 8) strip.scrollLeft -= stripBounds.left + 8 - selectedBounds.left;
    else if (selectedBounds.right > stripBounds.right - 8) strip.scrollLeft += selectedBounds.right - stripBounds.right + 8;
  }, [activeTab, lang]);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [dataAction, setDataAction] = useState<'export' | 'import' | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

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
      startValue: 1,
      taskSelectionMode: 'random',
      isCustom: true,
      tasks: [
        {
          id: `t-${Date.now()}`,
          title: `${newStatName.trim()} Aufgabe`,
          description: `Tägliche Gewohnheit für ${newStatName.trim()} ausführen.`,
          order: 1,
          isCustom: true,
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
      await onSaveStats(stats);
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

  const handleExportBackup = async () => {
    setDataAction('export'); setDataMessage(null);
    try {
      await onExportBackup();
      setDataMessage(lang === 'en' ? 'Backup exported successfully.' : 'Backup wurde erfolgreich exportiert.');
    } catch {
      setDataMessage(lang === 'en' ? 'Backup export failed.' : 'Backup-Export fehlgeschlagen.');
    } finally { setDataAction(null); }
  };

  const handleImportFile = async (file: File) => {
    const confirmed = window.confirm(lang === 'en'
      ? 'Replace the current local progress with this backup? ARC creates a safety backup first.'
      : 'Den aktuellen lokalen Fortschritt durch dieses Backup ersetzen? ARC erstellt vorher ein Sicherheits-Backup.');
    if (!confirmed) return;
    setDataAction('import'); setDataMessage(null);
    try {
      await onImportBackup(file);
      setDataMessage(lang === 'en' ? 'Backup imported successfully.' : 'Backup wurde erfolgreich importiert.');
    } catch {
      setDataMessage(lang === 'en' ? 'This backup is invalid, corrupted or unsupported.' : 'Dieses Backup ist ungültig, beschädigt oder nicht unterstützt.');
    } finally {
      setDataAction(null);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn font-mono">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="arc-settings-title" className="arc-modal arc-settings-console relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-xl p-4 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] my-auto max-h-[90vh] flex flex-col">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={lang === 'en' ? 'Close settings' : 'Einstellungen schließen'}
          className="arc-settings-close absolute top-4 right-4 p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {onReplayIntroduction && <button type="button" className="arc-intro-replay" onClick={onReplayIntroduction}><RotateCcw aria-hidden="true" />{t('introReplay', lang)}</button>}

        {/* Header Tabs */}
        <div className="arc-settings-header border-b border-slate-800 pb-3 mb-4 pr-10">
          <h2 id="arc-settings-title" className="text-lg font-bold text-slate-100 uppercase tracking-wide mb-3 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>{lang === 'en' ? 'SYSTEM SETTINGS' : 'SYSTEM EINSTELLUNGEN'}</span>
          </h2>

          <div ref={navigationRef} role="group" aria-label={lang === 'en' ? 'Settings categories' : 'Einstellungskategorien'} className="arc-settings-navigation flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              aria-pressed={activeTab === 'stats'}
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
              aria-pressed={activeTab === 'profile'}
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
              aria-pressed={activeTab === 'motivation'}
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
              aria-pressed={activeTab === 'bottom_bar'}
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
              aria-pressed={activeTab === 'language'}
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
            <button
              aria-pressed={activeTab === 'data'}
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'data' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Data & Storage' : 'Daten & Speicher'}</span>
            </button>
          </div>
        </div>

        <div className="arc-settings-body" key={activeTab}>
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
                <div className="arc-settings-new-stat flex gap-2">
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
                  <div className="arc-settings-stat-name flex items-center space-x-2">
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
                  <div className="arc-settings-percentage flex items-center space-x-2 shrink-0">
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

                  <div className="arc-settings-task-actions flex items-center space-x-2">
                    {/* Task Tier Filter Tabs */}
                    <div className="arc-settings-task-filter flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800 text-[11px]">
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
                          className={`arc-settings-task-card p-3 rounded-lg border transition-all duration-200 flex items-start justify-between gap-2 select-none ${
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

              {/* Purchased Premium Skins */}
              {(() => {
                const ownedSkins = AVAILABLE_SKINS.filter(
                  (s) => appState.ownedSkinIds?.includes(s.id) && s.avatarUrl
                );
                if (ownedSkins.length === 0) return null;
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
                                title={`${translateSkinName(skin, lang)} (${skin.tier})`}
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

                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* TAB 3: MOTIVATION */}
        {activeTab === 'motivation' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="arc-settings-quote-heading flex items-center justify-between">
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
                  const localizedModule = getLocalizedModuleConfig(mod, lang);

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
                          <div className="text-xs font-bold text-slate-100">{localizedModule.title}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {localizedModule.description}
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
        {activeTab === 'data' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
            <section className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-cyan-300">{lang === 'en' ? 'Device-only progress' : 'Fortschritt auf diesem Gerät'}</h3>
              <p className="text-slate-300 leading-relaxed">{lang === 'en'
                ? 'ARC stores your profile and gameplay progress only on this device. There is currently no cloud sync. Uninstalling ARC, clearing app data or losing the device can remove progress, so keep a current backup.'
                : 'ARC speichert dein Profil und deinen Spielfortschritt nur auf diesem Gerät. Es gibt derzeit keine Cloud-Synchronisierung. Beim Deinstallieren, Löschen der App-Daten oder Verlust des Geräts kann Fortschritt verloren gehen – bewahre daher ein aktuelles Backup auf.'}</p>
              <p className="text-slate-400 leading-relaxed">{lang === 'en'
                ? 'Consumed ARC Credit packs are recorded locally and may not be restorable after local data is lost.'
                : 'Verbrauchte ARC-Credit-Pakete werden lokal erfasst und können nach Verlust lokaler Daten möglicherweise nicht wiederhergestellt werden.'}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={dataAction !== null} onClick={() => void handleExportBackup()} className="min-h-11 px-4 py-2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-200 flex items-center gap-2"><Download className="w-4 h-4" />{lang === 'en' ? 'Export backup' : 'Backup exportieren'}</button>
                <button type="button" disabled={dataAction !== null} onClick={() => importInputRef.current?.click()} className="min-h-11 px-4 py-2 rounded bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2"><Upload className="w-4 h-4" />{lang === 'en' ? 'Import backup' : 'Backup importieren'}</button>
                <input ref={importInputRef} type="file" className="sr-only" accept=".arcbackup,application/json" onChange={(event) => { const file=event.target.files?.[0]; if(file) void handleImportFile(file); }} />
              </div>
              {dataMessage && <p role="status" className="text-cyan-200">{dataMessage}</p>}
            </section>
            <section className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-amber-300">{lang === 'en' ? 'Virtual currency & purchases' : 'Virtuelle Währung & Käufe'}</h3>
              <p className="text-slate-300 leading-relaxed">{lang === 'en'
                ? 'ARC Credits are virtual in-app currency with no cash value and cannot be transferred to other users or companion apps. Paid credit packs are consumable. Apple or Google provides the current store price and governs payment handling and applicable refunds. Restoration is limited once credits have been consumed locally.'
                : 'ARC Credits sind eine virtuelle In-App-Währung ohne Geldwert und können nicht an andere Personen oder Begleit-Apps übertragen werden. Bezahlte Credit-Pakete sind Verbrauchsgüter. Apple oder Google zeigt den aktuellen Store-Preis an und regelt Zahlungsabwicklung sowie anwendbare Erstattungen. Nach lokalem Verbrauch ist eine Wiederherstellung nur eingeschränkt möglich.'}</p>
            </section>
            <section className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-emerald-300">{lang === 'en' ? 'Privacy summary' : 'Datenschutz-Kurzinfo'}</h3>
              <p className="text-slate-300 leading-relaxed">{lang === 'en'
                ? 'ARC has no developer account or login and does not send profile or gameplay data to an ARC backend. Apple/Google billing contacts the platform store during purchases. This build contains no ads, analytics or tracking.'
                : 'ARC hat kein Entwicklerkonto und keinen Login und sendet Profil- oder Spieldaten nicht an ein ARC-Backend. Apple-/Google-Abrechnung kommuniziert bei Käufen mit dem Plattform-Store. Dieser Build enthält keine Werbung, Analysen oder Tracking.'}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                {([['privacy','Privacy Policy','Datenschutzerklärung'],['support','Support / Contact','Support / Kontakt'],['terms','Terms of Use','Nutzungsbedingungen'],['imprint','Legal Notice','Impressum']] as const).map(([key,en,de]) => ARC_RELEASE_LINKS[key] ? <a key={key} href={ARC_RELEASE_LINKS[key]!} target="_blank" rel="noreferrer" className="text-cyan-300 underline inline-flex items-center gap-1">{lang === 'en'?en:de}<ExternalLink className="w-3 h-3" /></a> : null)}
              </div>
            </section>
            <section className="bg-rose-950/20 p-4 rounded-xl border border-rose-500/30 space-y-2">
              <h3 className="text-sm font-bold text-rose-300">{lang === 'en' ? 'Reset local progress' : 'Lokalen Fortschritt zurücksetzen'}</h3>
              <p className="text-slate-300">{lang === 'en' ? 'This permanently replaces the current character and its local progress. Export a backup first.' : 'Dies ersetzt den aktuellen Charakter und seinen lokalen Fortschritt dauerhaft. Exportiere vorher ein Backup.'}</p>
              <button type="button" onClick={onRequestReset} className="min-h-11 px-4 py-2 rounded border border-rose-500/50 text-rose-200">{lang === 'en' ? 'Reset character…' : 'Charakter zurücksetzen…'}</button>
            </section>
          </div>
        )}
        </div>
        {activeTab !== 'data' && <div className="arc-settings-footer mt-5 flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
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
        </div>}

        {/* Task Creation Modal Popup */}
        {isAddingTaskModalOpen && currentActiveStat && (
          <div className="arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="arc-modal relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-xl p-5 shadow-2xl space-y-4">
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
