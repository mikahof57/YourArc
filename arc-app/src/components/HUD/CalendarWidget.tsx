import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AppState,
  CalendarEvent,
  CalendarEventType,
  CalendarState,
  GroupCalendar,
  GroupCalendarMember,
} from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  Target,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  UserPlus,
  Lock,
  Coins,
  X,
  Shield,
  AlertCircle,
  Minus,
  Maximize2,
} from 'lucide-react';
import { getTodayDateString } from '../../utils/storage';
import { Language } from '../../utils/i18n';
import {
  translateEventTitle,
  translateEventDesc,
  formatCountdownLabel,
} from '../../utils/calendarI18n';

interface CalendarWidgetProps {
  appState: AppState;
  lang?: Language;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onUpdateAppState: (updated: Partial<AppState>) => void;
  onOpenShop: () => void;
  playSoundEffect: (type: 'complete' | 'click' | 'levelup') => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  appState,
  lang = 'en',
  isMinimized = false,
  onToggleMinimize,
  onUpdateAppState,
  onOpenShop,
  playSoundEffect,
}) => {
  const todayStr = getTodayDateString();
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Modals & Forms State
  const [isAddEventOpen, setIsAddEventOpen] = useState<boolean>(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);
  const [isManageGroupOpen, setIsManageGroupOpen] = useState<boolean>(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newType, setNewType] = useState<CalendarEventType>('appointment');
  const [newTime, setNewTime] = useState<string>('12:00');
  const [newDate, setNewDate] = useState<string>(todayStr);

  // New Group Calendar Form State
  const [groupName, setGroupName] = useState<string>('');
  const [groupCodeInput, setGroupCodeInput] = useState<string>('');
  const [codeAddSuccessMsg, setCodeAddSuccessMsg] = useState<string>('');
  const [codeAddErrorMsg, setCodeAddErrorMsg] = useState<string>('');
  const [addedMembersList, setAddedMembersList] = useState<GroupCalendarMember[]>([]);

  // Manage Group State
  const [manageCodeInput, setManageCodeInput] = useState<string>('');
  const [manageSuccessMsg, setManageSuccessMsg] = useState<string>('');
  const [manageErrorMsg, setManageErrorMsg] = useState<string>('');

  // Extract calendar state safely
  const calendarState: CalendarState = appState.calendarState || {
    privateEvents: [],
    groupCalendars: [],
    activeCalendarId: 'private',
  };

  const activeCalendarId = calendarState.activeCalendarId || 'private';
  const groupCalendars = calendarState.groupCalendars || [];
  const privateEvents = calendarState.privateEvents || [];

  const activeGroupCalendar = groupCalendars.find((g) => g.id === activeCalendarId);

  // Events for current calendar
  const currentEvents: CalendarEvent[] = activeGroupCalendar
    ? activeGroupCalendar.events || []
    : privateEvents;

  // Group limit check: 1 free, up to 2 additional (10 credits each) => max 3 group calendars
  const existingGroupsCount = groupCalendars.length;
  const nextGroupCost = existingGroupsCount === 0 ? 0 : 10;
  const canCreateMoreGroups = existingGroupsCount < 3;

  // Month navigation helpers
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth(); // 0-indexed

  const monthNamesGerman = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const monthNamesEnglish = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNames = lang === 'de' ? monthNamesGerman : monthNamesEnglish;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const handlePrevMonth = () => {
    playSoundEffect('click');
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    playSoundEffect('click');
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    playSoundEffect('click');
    setCurrentViewDate(new Date());
    setSelectedDateStr(todayStr);
  };

  // Helper date string generator
  const getDateStr = (dayNum: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Date diff calculation for countdowns
  const getDaysDiff = (targetStr: string) => {
    const target = new Date(targetStr + 'T00:00:00');
    const current = new Date(todayStr + 'T00:00:00');
    const diffTime = target.getTime() - current.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Switch Active Calendar
  const handleSelectCalendar = (calId: string) => {
    playSoundEffect('click');
    if (calId === 'CREATE_NEW') {
      openCreateGroupModal();
      return;
    }
    onUpdateAppState({
      calendarState: {
        ...calendarState,
        activeCalendarId: calId,
      },
    });
  };

  // Open Create Group Modal
  const openCreateGroupModal = () => {
    setGroupName('');
    setGroupCodeInput('');
    setCodeAddSuccessMsg('');
    setCodeAddErrorMsg('');
    // Always include self as owner
    setAddedMembersList([
      {
        code: appState.profile.characterCode || 'PLAYER-1',
        name: appState.profile.name || (lang === 'en' ? 'You (Operator)' : 'Du (Operator)'),
        avatarUrl: appState.profile.avatarUrl,
        role: 'owner',
      },
    ]);
    setIsCreateGroupOpen(true);
  };

  // Add Member by Code in Creation Modal
  const handleAddMemberByCode = () => {
    const code = groupCodeInput.trim().toUpperCase();
    if (!code) return;

    if (addedMembersList.some((m) => m.code === code)) {
      setCodeAddErrorMsg(
        lang === 'en'
          ? 'Player with this code is already on the list.'
          : 'Spieler mit diesem Code ist bereits in der Liste.'
      );
      setCodeAddSuccessMsg('');
      return;
    }

    // Try finding in friends
    const friend = (appState.friends || []).find((f) => f.characterCode?.toUpperCase() === code);
    const memberName = friend ? friend.name : `${lang === 'en' ? 'Player' : 'Spieler'} ${code.slice(-4)}`;
    const avatarUrl = friend?.avatarUrl || 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150';

    setAddedMembersList((prev) => [
      ...prev,
      { code, name: memberName, avatarUrl, role: 'member' },
    ]);
    setGroupCodeInput('');
    setCodeAddSuccessMsg(
      lang === 'en' ? `Player [${code}] added!` : `Spieler [${code}] hinzugefügt!`
    );
    setCodeAddErrorMsg('');
  };

  // Toggle Friend Selection in Creation Modal
  const handleToggleFriendForGroup = (friendCode: string, friendName: string, avatarUrl?: string) => {
    if (addedMembersList.some((m) => m.code === friendCode)) {
      // Remove
      setAddedMembersList((prev) => prev.filter((m) => m.code !== friendCode));
    } else {
      // Add
      setAddedMembersList((prev) => [
        ...prev,
        { code: friendCode, name: friendName, avatarUrl, role: 'member' },
      ]);
    }
  };

  // Submit Create Group Calendar
  const handleConfirmCreateGroup = () => {
    const trimmedName = groupName.trim() || (lang === 'en' ? 'Group Calendar' : 'Gruppenkalender');
    const credits = appState.credits || 0;

    if (nextGroupCost > 0 && credits < nextGroupCost) {
      playSoundEffect('click');
      return;
    }

    playSoundEffect('levelup');

    const newGroup: GroupCalendar = {
      id: `group-cal-${Date.now()}`,
      name: trimmedName,
      createdDate: todayStr,
      members: addedMembersList,
      events: [
        {
          id: `evt-grp-welcome-${Date.now()}`,
          title: `Willkommen im Gruppenkalender: ${trimmedName}`,
          titleEn: `Welcome to Group Calendar: ${trimmedName}`,
          description: 'Gemeinsame Termine & Zieldaten eintragen',
          descriptionEn: 'Schedule shared events & target countdowns',
          date: todayStr,
          type: 'appointment',
          isCompleted: false,
          createdByName: appState.profile.name || 'Operator',
          createdByCode: appState.profile.characterCode,
        },
      ],
    };

    const updatedGroups = [...groupCalendars, newGroup];
    const updatedCredits = nextGroupCost > 0 ? credits - nextGroupCost : credits;

    onUpdateAppState({
      credits: updatedCredits,
      calendarState: {
        ...calendarState,
        groupCalendars: updatedGroups,
        activeCalendarId: newGroup.id,
      },
    });

    setIsCreateGroupOpen(false);
  };

  // Add Member to existing Group Calendar
  const handleAddMemberToExistingGroup = () => {
    if (!activeGroupCalendar) return;
    const code = manageCodeInput.trim().toUpperCase();
    if (!code) return;

    if (activeGroupCalendar.members.some((m) => m.code === code)) {
      setManageErrorMsg(
        lang === 'en'
          ? 'Player is already in this group.'
          : 'Spieler ist bereits in dieser Gruppe.'
      );
      setManageSuccessMsg('');
      return;
    }

    const friend = (appState.friends || []).find((f) => f.characterCode?.toUpperCase() === code);
    const memberName = friend ? friend.name : `${lang === 'en' ? 'Player' : 'Spieler'} ${code.slice(-4)}`;
    const avatarUrl = friend?.avatarUrl || 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150';

    const updatedMembers = [
      ...activeGroupCalendar.members,
      { code, name: memberName, avatarUrl, role: 'member' as const },
    ];

    const updatedGroupCalendars = groupCalendars.map((g) =>
      g.id === activeGroupCalendar.id ? { ...g, members: updatedMembers } : g
    );

    onUpdateAppState({
      calendarState: {
        ...calendarState,
        groupCalendars: updatedGroupCalendars,
      },
    });

    setManageCodeInput('');
    setManageSuccessMsg(
      lang === 'en'
        ? `Player [${code}] successfully added!`
        : `Spieler [${code}] erfolgreich hinzugefügt!`
    );
    setManageErrorMsg('');
  };

  // Delete / Leave Group Calendar
  const handleDeleteGroupCalendar = (groupId: string) => {
    playSoundEffect('click');
    const updatedGroups = groupCalendars.filter((g) => g.id !== groupId);
    onUpdateAppState({
      calendarState: {
        ...calendarState,
        groupCalendars: updatedGroups,
        activeCalendarId: 'private',
      },
    });
    setIsManageGroupOpen(false);
  };

  // Add Event Form Submit
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playSoundEffect('complete');

    const newEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      date: newDate,
      time: newType === 'appointment' ? newTime : undefined,
      type: newType,
      isCompleted: false,
      createdByName: appState.profile.name || 'Operator',
      createdByCode: appState.profile.characterCode,
    };

    if (activeCalendarId === 'private') {
      onUpdateAppState({
        calendarState: {
          ...calendarState,
          privateEvents: [...privateEvents, newEvt],
        },
      });
    } else {
      const updatedGroups = groupCalendars.map((g) => {
        if (g.id === activeCalendarId) {
          return {
            ...g,
            events: [...(g.events || []), newEvt],
          };
        }
        return g;
      });

      onUpdateAppState({
        calendarState: {
          ...calendarState,
          groupCalendars: updatedGroups,
        },
      });
    }

    setIsAddEventOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  // Toggle Event Done
  const handleToggleEventDone = (eventId: string) => {
    playSoundEffect('complete');

    if (activeCalendarId === 'private') {
      const updated = privateEvents.map((e) =>
        e.id === eventId ? { ...e, isCompleted: !e.isCompleted } : e
      );
      onUpdateAppState({
        calendarState: {
          ...calendarState,
          privateEvents: updated,
        },
      });
    } else {
      const updatedGroups = groupCalendars.map((g) => {
        if (g.id === activeCalendarId) {
          return {
            ...g,
            events: g.events.map((e) =>
              e.id === eventId ? { ...e, isCompleted: !e.isCompleted } : e
            ),
          };
        }
        return g;
      });

      onUpdateAppState({
        calendarState: {
          ...calendarState,
          groupCalendars: updatedGroups,
        },
      });
    }
  };

  // Delete Event
  const handleDeleteEvent = (eventId: string) => {
    playSoundEffect('click');

    if (activeCalendarId === 'private') {
      const updated = privateEvents.filter((e) => e.id !== eventId);
      onUpdateAppState({
        calendarState: {
          ...calendarState,
          privateEvents: updated,
        },
      });
    } else {
      const updatedGroups = groupCalendars.map((g) => {
        if (g.id === activeCalendarId) {
          return {
            ...g,
            events: g.events.filter((e) => e.id !== eventId),
          };
        }
        return g;
      });

      onUpdateAppState({
        calendarState: {
          ...calendarState,
          groupCalendars: updatedGroups,
        },
      });
    }
  };

  // Filter events for selected date
  const selectedDateEvents = currentEvents.filter((e) => e.date === selectedDateStr);

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
      className="w-full bg-slate-900/90 border rounded-xl p-4 sm:p-5 backdrop-blur-md font-mono relative overflow-hidden transition-all duration-500 space-y-4"
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

      {/* Header Section with Title & Calendar Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {lang === 'en' ? 'CALENDAR & GOALS' : 'KALENDER & ZIELE'}
              </h2>
              {activeGroupCalendar && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{lang === 'en' ? 'Group' : 'Gruppe'} ({activeGroupCalendar.members.length})</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              {lang === 'en'
                ? 'Track events & set target count-down goals for personal or group achievements.'
                : 'Termine eintragen & Tage-Countdowns für persönliche oder Gruppen-Ziele verwalten.'}
            </p>
          </div>
        </div>

        {/* Top Right Selector & Minimize Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative inline-block text-left">
            <select
              value={activeCalendarId}
              onChange={(e) => handleSelectCalendar(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-700 hover:border-slate-500 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 transition-all font-mono font-bold cursor-pointer"
              style={{
                borderColor: activeGroupCalendar ? 'var(--theme-c1)' : undefined,
              }}
            >
              <option value="private">🔒 {lang === 'en' ? 'Private Calendar' : 'Privater Kalender'}</option>
              {groupCalendars.map((g) => (
                <option key={g.id} value={g.id}>
                  👥 {g.name} ({g.members.length} {lang === 'en' ? 'mem.' : 'Mitg.'})
                </option>
              ))}
              <option value="CREATE_NEW">
                + {lang === 'en' ? 'Create Group Calendar' : 'Gruppenkalender erstellen'} ({existingGroupsCount}/3)
              </option>
            </select>
          </div>

          {activeGroupCalendar && (
            <button
              onClick={() => {
                playSoundEffect('click');
                setIsManageGroupOpen(true);
              }}
              title={lang === 'en' ? 'Manage Group' : 'Gruppe & Mitglieder verwalten'}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs flex items-center space-x-1 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          {onToggleMinimize && (
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
          )}
        </div>
      </div>

      {/* EXPANDED VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Main Column: Month Calendar View (7 cols on lg) */}
        <div className="lg:col-span-7 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={handleJumpToToday}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all"
              >
                {lang === 'en' ? 'Today' : 'Heute'}
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-bold uppercase border-b border-slate-800/80 pb-1">
            {lang === 'en' ? (
              <>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </>
            ) : (
              <>
                <span>Mo</span>
                <span>Di</span>
                <span>Mi</span>
                <span>Do</span>
                <span>Fr</span>
                <span>Sa</span>
                <span>So</span>
              </>
            )}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs font-mono">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-9 opacity-20" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = getDateStr(dayNum);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;

              // Events on this date
              const dayEvts = currentEvents.filter((e) => e.date === dateStr);
              const hasAppointment = dayEvts.some((e) => e.type === 'appointment');
              const hasGoal = dayEvts.some((e) => e.type === 'goal');

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    playSoundEffect('click');
                    setSelectedDateStr(dateStr);
                  }}
                  className={`h-10 rounded-lg flex flex-col items-center justify-between py-1 transition-all relative border ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : isToday
                      ? 'bg-slate-900 text-amber-300 border-amber-500/60 font-bold'
                      : 'bg-slate-900/40 text-slate-300 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] leading-none">{dayNum}</span>

                  {/* Indicator Badges/Dots */}
                  <div className="flex items-center space-x-1">
                    {hasAppointment && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#06b6d4]" />
                    )}
                    {hasGoal && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{lang === 'en' ? 'Appointment' : 'Termin'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{lang === 'en' ? 'Goal (Countdown)' : 'Ziel (Countdown)'}</span>
              </span>
            </div>
            <span className="text-slate-500">
              {lang === 'en' ? 'Click day for details' : 'Klick auf Tag für Details'}
            </span>
          </div>
        </div>

        {/* Right Column: Events & Countdowns for Selected Date (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            {/* Day Header & Add Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {selectedDateStr === todayStr
                      ? (lang === 'en' ? 'Today, ' : 'Heute, ') + selectedDateStr
                      : selectedDateStr}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">
                  {selectedDateEvents.length}{' '}
                  {lang === 'en'
                    ? selectedDateEvents.length === 1
                      ? 'entry on this day'
                      : 'entries on this day'
                    : selectedDateEvents.length === 1
                    ? 'Eintrag an diesem Tag'
                    : 'Einträge an diesem Tag'}
                </span>
              </div>

              <button
                onClick={() => {
                  playSoundEffect('click');
                  setNewDate(selectedDateStr);
                  setIsAddEventOpen(true);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Entry' : 'Eintrag'}</span>
              </button>
            </div>

            {/* List of Events for Selected Day */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-sans space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-700 opacity-60" />
                  <p>
                    {lang === 'en'
                      ? 'No appointments or goals scheduled for this day.'
                      : 'Keine Termine oder Ziele für diesen Tag eingetragen.'}
                  </p>
                  <button
                    onClick={() => {
                      setNewDate(selectedDateStr);
                      setIsAddEventOpen(true);
                    }}
                    className="text-xs text-cyan-400 underline hover:text-cyan-300 font-mono"
                  >
                    {lang === 'en' ? '+ Add first entry' : '+ Ersten Eintrag hinzufügen'}
                  </button>
                </div>
              ) : (
                selectedDateEvents.map((evt) => {
                  const daysLeft = getDaysDiff(evt.date);
                  const isGoal = evt.type === 'goal';
                  const countdownLabel = formatCountdownLabel(daysLeft, lang);

                  const displayedTitle = translateEventTitle(evt, lang);
                  const displayedDesc = translateEventDesc(evt, lang);

                  return (
                    <div
                      key={evt.id}
                      className={`p-3 rounded-lg border transition-all space-y-1.5 relative ${
                        evt.isCompleted
                          ? 'bg-slate-900/40 border-slate-800 opacity-60 line-through'
                          : isGoal
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400/60'
                          : 'bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2">
                          <button
                            onClick={() => handleToggleEventDone(evt.id)}
                            className={`mt-0.5 p-1 rounded transition-all shrink-0 ${
                              evt.isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700'
                            }`}
                            title={
                              evt.isCompleted
                                ? (lang === 'en' ? 'Mark as incomplete' : 'Als unerledigt markieren')
                                : (lang === 'en' ? 'Mark as completed' : 'Als erledigt markieren')
                            }
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`text-xs font-bold ${
                                  evt.isCompleted
                                    ? 'text-slate-400'
                                    : isGoal
                                    ? 'text-amber-200'
                                    : 'text-slate-100'
                                }`}
                              >
                                {displayedTitle}
                              </span>
                            </div>

                            {displayedDesc && (
                              <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                                {displayedDesc}
                              </p>
                            )}

                            {/* Meta info / Creator / Time */}
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1">
                              {evt.time && (
                                <span className="flex items-center space-x-1 text-cyan-300">
                                  <Clock className="w-3 h-3" />
                                  <span>{evt.time}{lang === 'en' ? '' : ' Uhr'}</span>
                                </span>
                              )}
                              {evt.createdByName && activeGroupCalendar && (
                                <span className="text-slate-400">
                                  {lang === 'en' ? 'by ' : 'von '}{' '}
                                  <strong className="text-slate-300">{evt.createdByName}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Goal Countdown Pill */}
                          {isGoal && !evt.isCompleted && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                                daysLeft < 0
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
                                  : daysLeft === 0
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                              }`}
                            >
                              {countdownLabel}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-all"
                            title={lang === 'en' ? 'Delete' : 'Löschen'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Summary Banner at Bottom */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300 font-sans">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {lang === 'en' ? 'Active Calendar Profile: ' : 'Aktives Kalender-Profil: '}
                <strong className="text-cyan-300 font-mono">
                  {activeGroupCalendar ? activeGroupCalendar.name : (lang === 'en' ? 'Private' : 'Privat')}
                </strong>
              </span>
            </div>
            <button
              onClick={() => {
                playSoundEffect('click');
                setIsAddEventOpen(true);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-mono font-bold text-xs"
            >
              {lang === 'en' ? '+ New' : '+ Neu'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD EVENT / GOAL MODAL */}
      {isAddEventOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsAddEventOpen(false)}
          >
            <div
              className="relative w-full max-w-md bg-slate-900 border rounded-xl p-5 shadow-2xl space-y-4 font-mono"
              onClick={(e) => e.stopPropagation()}
              style={{
                borderColor: 'var(--theme-c1)',
                boxShadow: '0 0 30px var(--theme-glow1)',
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    {lang === 'en' ? 'Create New Entry' : 'Neuen Eintrag Erstellen'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
                {/* Type selector */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    {lang === 'en' ? 'Entry Type' : 'Eintrags-Typ'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('appointment')}
                      className={`py-2 px-3 rounded text-center font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                        newType === 'appointment'
                          ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === 'en' ? 'Appointment' : 'Termin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('goal')}
                      className={`py-2 px-3 rounded text-center font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                        newType === 'goal'
                          ? 'bg-amber-950/80 text-amber-200 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'en' ? 'Goal (Countdown)' : 'Ziel (Countdown)'}</span>
                    </button>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    {lang === 'en' ? 'Title / Label *' : 'Titel / Bezeichnung *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={
                      newType === 'appointment'
                        ? (lang === 'en' ? 'e.g. Team Sync, Dentist, Workout' : 'z.B. Team Sync, Zahnarzt, Workout')
                        : (lang === 'en' ? 'e.g. 10km Run, Project Deadline, Exam Goal' : 'z.B. 10km Laufen, Projekt-Abgabe, Prüfungs-Ziel')
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-100 outline-none focus:border-cyan-400 text-xs"
                  />
                </div>

                {/* Date & Time Input */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                      {newType === 'goal'
                        ? (lang === 'en' ? 'Target Date' : 'Ziel-Datum')
                        : (lang === 'en' ? 'Date' : 'Datum')}
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>

                  {newType === 'appointment' && (
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                        {lang === 'en' ? 'Time' : 'Uhrzeit'}
                      </label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 outline-none focus:border-cyan-400 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Optional Description */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                    {lang === 'en' ? 'Description (Optional)' : 'Beschreibung (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'Additional notes or goals...'
                        : 'Zusätzliche Notizen oder Ziele...'
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 outline-none focus:border-cyan-400 text-xs font-sans"
                  />
                </div>

                {/* Target Context */}
                <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center space-x-2 font-sans">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    {lang === 'en' ? 'Adding to: ' : 'Wird eingetragen in: '}
                    <strong className="text-cyan-300 font-mono">
                      {activeGroupCalendar
                        ? activeGroupCalendar.name
                        : (lang === 'en' ? 'Private Calendar' : 'Privater Kalender')}
                    </strong>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="px-3 py-2 rounded text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    {lang === 'en' ? 'Cancel' : 'Abbrechen'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider"
                  >
                    {lang === 'en' ? 'Save' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 2: CREATE GROUP CALENDAR MODAL */}
      {isCreateGroupOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsCreateGroupOpen(false)}
          >
            <div
              className="relative w-full max-w-lg bg-slate-900 border rounded-xl p-5 shadow-2xl space-y-4 font-mono max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                borderColor: 'var(--theme-c1)',
                boxShadow: '0 0 30px var(--theme-glow1)',
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    {lang === 'en' ? 'Create New Group Calendar' : 'Neuen Gruppenkalender Erstellen'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Credit Cost Badge / Limit Notice */}
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 font-sans ${
                  nextGroupCost === 0
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold font-mono">
                  <span className="flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>
                      {nextGroupCost === 0
                        ? (lang === 'en' ? '1st Group Calendar: FREE' : '1. Gruppenkalender: GRATIS')
                        : (lang === 'en' ? '2nd / 3rd Group Calendar: 10 Credits' : '2. / 3. Gruppenkalender: 10 Credits')}
                    </span>
                  </span>
                  <span className="text-slate-300">
                    {lang === 'en' ? 'Balance: ' : 'Guthaben: '}
                    <strong className="text-amber-400 font-bold">{appState.credits || 0} Credits</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {lang === 'en'
                    ? 'Each player can unlock up to 2 additional group calendars (max 3 in total).'
                    : 'Jeder Spieler kann bis zu 2 weitere Gruppenkalender (insgesamt max. 3) freischalten.'}
                </p>
              </div>

              {!canCreateMoreGroups ? (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center space-y-2 text-xs font-sans">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-slate-200 font-bold">
                    {lang === 'en'
                      ? 'Maximum reached (3/3 Group Calendars)'
                      : 'Maximal-Anzahl erreicht (3/3 Gruppenkalender)'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {lang === 'en'
                      ? 'You have already reached the limit of 3 group calendars.'
                      : 'Du hast bereits das Limit von 3 Gruppenkalendern erreicht.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Name Input */}
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">
                      {lang === 'en' ? 'Group Calendar Name *' : 'Name des Gruppenkalenders *'}
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'e.g. Cyber Operatives, Squad 2026, Gym Bros'
                          : 'z.B. Cyber Operatives, Squad 2026, Gym Bros'
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-100 outline-none focus:border-cyan-400 text-xs"
                    />
                  </div>

                  {/* Add Players via Code */}
                  <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <label className="block text-slate-300 font-bold uppercase text-[10px] flex items-center space-x-1">
                      <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {lang === 'en'
                          ? 'Add player via Character Code'
                          : 'Spieler per Spieler-Code hinzufügen'}
                      </span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={groupCodeInput}
                        onChange={(e) => setGroupCodeInput(e.target.value)}
                        placeholder={
                          lang === 'en'
                            ? 'Enter code (e.g. CYBER-X7K2-88)'
                            : 'Code eingeben (z.B. CYBER-X7K2-88)'
                        }
                        className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 text-xs uppercase outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddMemberByCode}
                        className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 text-xs"
                      >
                        {lang === 'en' ? 'Add' : 'Hinzufügen'}
                      </button>
                    </div>

                    {codeAddSuccessMsg && (
                      <p className="text-[11px] text-emerald-400 font-sans flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{codeAddSuccessMsg}</span>
                      </p>
                    )}
                    {codeAddErrorMsg && (
                      <p className="text-[11px] text-rose-400 font-sans flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{codeAddErrorMsg}</span>
                      </p>
                    )}
                  </div>

                  {/* Select from Friends List */}
                  {(appState.friends || []).length > 0 && (
                    <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <label className="block text-slate-300 font-bold uppercase text-[10px]">
                        {lang === 'en' ? 'Select from your friends list' : 'Aus deiner Freundesliste auswählen'}
                      </label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {(appState.friends || []).map((friend) => {
                          const isAdded = addedMembersList.some(
                            (m) => m.code === friend.characterCode
                          );
                          return (
                            <div
                              key={friend.id}
                              className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <img
                                  src={friend.avatarUrl}
                                  alt={friend.name}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-700"
                                />
                                <div>
                                  <span className="font-bold text-slate-200">{friend.name}</span>
                                  <span className="text-[10px] text-slate-500 block font-mono">
                                    {friend.characterCode}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleFriendForGroup(
                                    friend.characterCode || friend.id,
                                    friend.name,
                                    friend.avatarUrl
                                  )
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                  isAdded
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                }`}
                              >
                                {isAdded
                                  ? (lang === 'en' ? '✓ Added' : '✓ Hinzugefügt')
                                  : (lang === 'en' ? '+ Add' : '+ Hinzufügen')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Current Members Preview List */}
                  <div className="space-y-2">
                    <span className="block text-slate-400 font-bold uppercase text-[10px]">
                      {lang === 'en' ? 'Members in Calendar' : 'Mitglieder im Kalender'} ({addedMembersList.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {addedMembersList.map((m) => (
                        <span
                          key={m.code}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{m.name}</span>
                          {m.role === 'owner' && (
                            <span className="text-[9px] text-amber-400 font-bold">
                              ({lang === 'en' ? 'Owner' : 'Ersteller'})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    {nextGroupCost > 0 && (appState.credits || 0) < nextGroupCost ? (
                      <button
                        type="button"
                        onClick={onOpenShop}
                        className="px-3 py-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center space-x-1"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? 'Get Credits in Shop' : 'Credits im Shop holen'}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateGroupOpen(false)}
                        className="px-3 py-2 rounded text-slate-400 hover:text-slate-200 border border-slate-800"
                      >
                        {lang === 'en' ? 'Cancel' : 'Abbrechen'}
                      </button>
                      <button
                        type="button"
                        disabled={
                          !groupName.trim() ||
                          (nextGroupCost > 0 && (appState.credits || 0) < nextGroupCost)
                        }
                        onClick={handleConfirmCreateGroup}
                        className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold uppercase tracking-wider"
                      >
                        {nextGroupCost > 0
                          ? (lang === 'en' ? `Create (${nextGroupCost} Cr)` : `Erstellen (${nextGroupCost} Cr)`)
                          : (lang === 'en' ? 'Create for Free' : 'Kostenlos Erstellen')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 3: MANAGE GROUP CALENDAR & MEMBERS */}
      {isManageGroupOpen && activeGroupCalendar &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
            onClick={() => setIsManageGroupOpen(false)}
          >
            <div
              className="relative w-full max-w-md bg-slate-900 border rounded-xl p-5 shadow-2xl space-y-4 font-mono max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                borderColor: 'var(--theme-c1)',
                boxShadow: '0 0 30px var(--theme-glow1)',
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    {lang === 'en' ? `Manage ${activeGroupCalendar.name}` : `${activeGroupCalendar.name} verwalten`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManageGroupOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Add Member by Code */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold uppercase text-[10px]">
                    {lang === 'en' ? 'Add more players' : 'Weitere Spieler hinzufügen'}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={manageCodeInput}
                      onChange={(e) => setManageCodeInput(e.target.value)}
                      placeholder={lang === 'en' ? 'Enter player code' : 'Spieler-Code eingeben'}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 text-xs uppercase outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddMemberToExistingGroup}
                      className="px-3 py-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-bold"
                    >
                      {lang === 'en' ? 'Add' : 'Hinzufügen'}
                    </button>
                  </div>
                  {manageSuccessMsg && (
                    <p className="text-[11px] text-emerald-400 font-sans">{manageSuccessMsg}</p>
                  )}
                  {manageErrorMsg && (
                    <p className="text-[11px] text-rose-400 font-sans">{manageErrorMsg}</p>
                  )}
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  <span className="block text-slate-400 font-bold uppercase text-[10px]">
                    {lang === 'en' ? 'Current Members' : 'Aktuelle Mitglieder'} ({activeGroupCalendar.members.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeGroupCalendar.members.map((m) => (
                      <div
                        key={m.code}
                        className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center space-x-2">
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.name}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                              {m.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-100 block">{m.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{m.code}</span>
                          </div>
                        </div>

                        {m.role === 'owner' && (
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            {lang === 'en' ? 'Owner' : 'Ersteller'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete Group Calendar Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteGroupCalendar(activeGroupCalendar.id)}
                    className="px-3 py-2 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Delete Group Calendar' : 'Gruppenkalender löschen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsManageGroupOpen(false)}
                    className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    {lang === 'en' ? 'Done' : 'Fertig'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
