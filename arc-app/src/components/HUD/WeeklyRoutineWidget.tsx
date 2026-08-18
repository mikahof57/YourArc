import React, { useState } from 'react';
import { AppState, WeeklyDayTask, WeeklyRoutineState } from '../../types';
import { CalendarDays, Plus, Trash2, Check, Minus, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';
import { getTodayDateString } from '../../utils/storage';
import { Language } from '../../utils/i18n';

interface WeeklyRoutineWidgetProps {
  appState: AppState;
  lang?: Language;
  isMinimized?: boolean;
  onToggleMinimize: () => void;
  onUpdateAppState: (updated: Partial<AppState>) => void;
  playSoundEffect: (type: 'complete' | 'click' | 'levelup') => void;
}

const DAY_NAMES_DE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const DAY_NAMES_SHORT_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const DAY_NAMES_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyRoutineWidget: React.FC<WeeklyRoutineWidgetProps> = ({
  appState,
  lang = 'de',
  isMinimized = false,
  onToggleMinimize,
  onUpdateAppState,
  playSoundEffect,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date();
    return (today.getDay() + 6) % 7; // Monday = 0
  });

  const [newTaskInput, setNewTaskInput] = useState<string>('');

  const weeklyRoutine: WeeklyRoutineState = appState.weeklyRoutine || {};

  // Compute dates for current week starting from Monday
  const getCurrentWeekDates = () => {
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);

    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isToday = dateStr === todayStr;
      return {
        dayIndex: idx,
        dateStr,
        displayDate: `${dd}.${mm}.`,
        isToday,
      };
    });
  };

  const weekDays = getCurrentWeekDates();
  const currentTodayIndex = (new Date().getDay() + 6) % 7;

  // Add task to a specific day
  const handleAddTaskToDay = (dayIndex: number, textToAdd?: string) => {
    const text = (textToAdd || newTaskInput).trim();
    if (!text) return;

    playSoundEffect('click');

    const existingTasks = weeklyRoutine[dayIndex] || [];
    const newTask: WeeklyDayTask = {
      id: `wtask-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
    };

    const updatedRoutine: WeeklyRoutineState = {
      ...weeklyRoutine,
      [dayIndex]: [...existingTasks, newTask],
    };

    onUpdateAppState({
      weeklyRoutine: updatedRoutine,
    });

    if (!textToAdd) {
      setNewTaskInput('');
    }
  };

  // Toggle task completion for today
  const handleToggleTask = (dayIndex: number, taskId: string) => {
    const existingTasks = weeklyRoutine[dayIndex] || [];
    const updatedTasks = existingTasks.map((t) => {
      if (t.id === taskId) {
        const isDoneToday = t.completedDate === todayStr;
        if (!isDoneToday) {
          playSoundEffect('complete');
        } else {
          playSoundEffect('click');
        }
        return {
          ...t,
          completedDate: isDoneToday ? undefined : todayStr,
        };
      }
      return t;
    });

    onUpdateAppState({
      weeklyRoutine: {
        ...weeklyRoutine,
        [dayIndex]: updatedTasks,
      },
    });
  };

  // Delete task from day
  const handleDeleteTask = (dayIndex: number, taskId: string) => {
    playSoundEffect('click');
    const existingTasks = weeklyRoutine[dayIndex] || [];
    const updatedTasks = existingTasks.filter((t) => t.id !== taskId);

    onUpdateAppState({
      weeklyRoutine: {
        ...weeklyRoutine,
        [dayIndex]: updatedTasks,
      },
    });
  };

  const todayTasks = weeklyRoutine[currentTodayIndex] || [];
  const todayDoneCount = todayTasks.filter((t) => t.completedDate === todayStr).length;

  if (isMinimized) {
    return (
      <div
        className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md transition-all duration-300 flex items-center justify-between"
        style={{
          borderColor: 'var(--theme-c1)',
          boxShadow: '0 0 10px var(--theme-glow1)',
        }}
      >
        <div className="flex-1 h-[2px] bg-cyan-500/30 rounded-full mr-4" />
        {onToggleMinimize && (
          <button
            onClick={() => {
              playSoundEffect('click');
              onToggleMinimize();
            }}
            title={lang === 'en' ? 'Expand window' : 'Fenster vergrößern'}
            className="p-1 px-2 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 transition-all shrink-0 flex items-center space-x-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase hidden sm:inline">
              {lang === 'en' ? 'Expand' : 'Öffnen'}
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full bg-slate-900/90 border rounded-xl p-3.5 sm:p-5 backdrop-blur-md font-mono relative overflow-hidden transition-all duration-300 space-y-3"
      style={{
        borderColor: 'var(--theme-c1)',
        boxShadow: '0 0 25px var(--theme-glow1)',
      }}
    >
      {/* Top Border Accent Glow */}
      <div
        className="absolute top-0 inset-x-0 h-[1px] opacity-80"
        style={{
          background: 'var(--theme-grad)',
        }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-amber-950/70 border border-amber-500/30 text-amber-400 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {lang === 'en' ? '7-DAY WEEKLY ROUTINE' : 'SIEBEN TAGE WOCHENPLAN'}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold hidden sm:inline-block">
                {todayDoneCount}/{todayTasks.length} {lang === 'en' ? 'done today' : 'heute erledigt'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
              {lang === 'en'
                ? 'Plan daily routines for each day of the week (e.g. Gym, Reading, Cleaning).'
                : 'Feste Tagesaufgaben für jeden Tag der Woche eintragen (z.B. Gym, Buch lesen, Aufräumen).'}
            </p>
          </div>
        </div>

        {/* Top-Right Minimize Button */}
        <button
          onClick={() => {
            playSoundEffect('click');
            onToggleMinimize();
          }}
          title={lang === 'en' ? 'Minimize window' : 'Fenster minimieren'}
          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400/60 text-slate-300 hover:text-cyan-300 transition-all shrink-0 flex items-center space-x-1"
        >
          <Minus className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
            {lang === 'en' ? 'Minimize' : 'Minimieren'}
          </span>
        </button>
      </div>

      {/* EXPANDED VIEW: 7-Day Horizontal Row Layout */}
        <div className="space-y-3">
          {/* 7 Days Columns in 1 Row with Touching Borders */}
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-cols-7 gap-0 border border-slate-800/90 rounded-xl overflow-hidden divide-x divide-slate-800/90 bg-slate-950/80 min-w-[620px]">
              {weekDays.map((day) => {
                const dayTasks = weeklyRoutine[day.dayIndex] || [];
                const isSelected = selectedDayIndex === day.dayIndex;
                const isToday = day.isToday;
                const dayNameShort = (lang === 'en' ? DAY_NAMES_SHORT_EN : DAY_NAMES_SHORT_DE)[day.dayIndex];

                return (
                  <div
                    key={day.dayIndex}
                    onClick={() => setSelectedDayIndex(day.dayIndex)}
                    className={`p-2 sm:p-2.5 transition-all cursor-pointer flex flex-col justify-between space-y-2 min-h-[135px] relative ${
                      isToday
                        ? 'bg-amber-950/30'
                        : isSelected
                        ? 'bg-slate-900/90'
                        : 'bg-slate-950/50 hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Active/Today Top Accent Indicator */}
                    {isToday && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                    )}
                    {isSelected && !isToday && (
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-cyan-400" />
                    )}

                    {/* Day Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span
                          className={`text-[11px] font-bold uppercase ${
                            isToday ? 'text-amber-300 font-black' : 'text-slate-200'
                          }`}
                        >
                          {dayNameShort}
                        </span>
                        <span className="text-[9px] text-slate-500 font-sans hidden sm:inline">{day.displayDate}</span>
                      </div>
                      {isToday ? (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shrink-0">
                          {lang === 'en' ? 'TODAY' : 'HEUTE'}
                        </span>
                      ) : (
                        dayTasks.length > 0 && (
                          <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 font-mono shrink-0">
                            {dayTasks.length}
                          </span>
                        )
                      )}
                    </div>

                    {/* Tasks List */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-36 pr-0.5">
                      {dayTasks.length === 0 ? (
                        <div className="text-[9px] text-slate-600 text-center py-4 italic font-sans">
                          {lang === 'en' ? 'Empty' : 'Leer'}
                        </div>
                      ) : (
                        dayTasks.map((task) => {
                          const isDoneToday = task.completedDate === todayStr;
                          return (
                            <div
                              key={task.id}
                              className={`p-1 rounded border text-[10px] flex items-center justify-between gap-1 transition-all ${
                                isDoneToday
                                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 line-through opacity-80'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-1 min-w-0 flex-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTask(day.dayIndex, task.id);
                                  }}
                                  className={`p-0.5 rounded transition-all shrink-0 ${
                                    isDoneToday
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700'
                                  }`}
                                >
                                  <Check className="w-2.5 h-2.5" />
                                </button>
                                <span className="truncate font-sans font-medium text-[10px]">{task.text}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(day.dayIndex, task.id);
                                }}
                                className="text-slate-600 hover:text-rose-400 p-0.5 rounded shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                                title={lang === 'en' ? 'Delete task' : 'Aufgabe löschen'}
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected indicator / Quick Add button */}
                    <div className="pt-0.5 text-[9px] text-center border-t border-slate-800/60">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayIndex(day.dayIndex);
                        }}
                        className={`text-[9px] hover:underline font-mono ${
                          isSelected ? 'text-cyan-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {isSelected
                          ? (lang === 'en' ? '• Active •' : '• Aktiv •')
                          : (lang === 'en' ? '+ Add' : '+ Planen')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Input Bar for Selected Day */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {lang === 'en' ? 'Add Task to ' : 'Aufgabe hinzufügen zu: '}
                  <strong className="text-amber-300">
                    {(lang === 'en' ? DAY_NAMES_EN : DAY_NAMES_DE)[selectedDayIndex]}
                  </strong>
                </span>
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTaskToDay(selectedDayIndex);
                  }
                }}
                placeholder={
                  lang === 'en'
                    ? 'Enter task title (e.g. Gym, Read 20 pages)...'
                    : 'Aufgaben-Titel eingeben...'
                }
                className="flex-1 bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-sans"
              />
              <button
                onClick={() => handleAddTaskToDay(selectedDayIndex)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1 shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'en' ? 'Add' : 'Hinzufügen'}</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};
