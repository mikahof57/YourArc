import React, { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, CalendarDays, ClipboardCheck, Flame, LockKeyhole, SlidersHorizontal } from 'lucide-react';
import { AppState, BottomBarModuleConfig, WeeklyRoutineState } from '../../types';
import { Language } from '../../utils/i18n';
import { getTodayDateString } from '../../utils/storage';
import { localObjectivesService } from '../../services/localSaveService';

interface HomeProgressDeckProps {
  appState: AppState;
  lang: Language;
  modules: BottomBarModuleConfig[];
  onOpenRoutine: () => void;
  onOpenCalendar: () => void;
  onOpenStats: () => void;
  onOpenMissions: () => void;
  onOpenModule: (module: BottomBarModuleConfig) => void;
  onCustomize: () => void;
}

export const HomeProgressDeck: React.FC<HomeProgressDeckProps> = ({ appState, lang, modules, onOpenRoutine, onOpenCalendar, onOpenStats, onOpenMissions, onOpenModule, onCustomize }) => {
  const isEn = lang === 'en';
  const [missionSummary, setMissionSummary] = useState<{ state: 'active' | 'available' | 'locked' | 'error'; title?: string } | null>(null);
  const weeklyRoutine: WeeklyRoutineState = appState.weeklyRoutine ?? {};
  const routineCount = Object.values(weeklyRoutine).reduce((sum, tasks) => sum + tasks.length, 0);
  const calendarCount = (appState.calendarState?.privateEvents || []).length;
  useEffect(() => {
    let cancelled = false;
    void localObjectivesService.getMissions(getTodayDateString()).then((payload) => {
      if (cancelled) return;
      const active = payload.active_runs.find((run) => run.state === 'active');
      if (active) setMissionSummary({ state: 'active', title: isEn ? active.mission.title_en : active.mission.title_de });
      else if (payload.available.length > 0) setMissionSummary({ state: 'available' });
      else setMissionSummary({ state: 'locked' });
    }).catch(() => { if (!cancelled) setMissionSummary({ state: 'error' }); });
    return () => { cancelled = true; };
  }, [isEn]);

  const missionTitle = missionSummary?.state === 'active'
    ? missionSummary.title
    : isEn ? 'Your next major objective' : 'Dein nächstes großes Ziel';
  const missionDescription = missionSummary?.state === 'active'
    ? (isEn ? 'Continue your active local Mission.' : 'Setze deine aktive lokale Mission fort.')
    : missionSummary?.state === 'available'
      ? (isEn ? 'New Missions are ready to activate.' : 'Neue Missionen können aktiviert werden.')
      : missionSummary?.state === 'locked'
        ? (isEn ? 'Complete more ARC activity to unlock additional Missions.' : 'Schließe weitere ARC-Aktivitäten ab, um zusätzliche Missionen freizuschalten.')
        : missionSummary?.state === 'error'
          ? (isEn ? 'Local Mission state is temporarily unavailable.' : 'Der lokale Missionsstatus ist vorübergehend nicht verfügbar.')
          : (isEn ? 'Loading local Mission state…' : 'Lokaler Missionsstatus wird geladen…');
  const missionAction = missionSummary?.state === 'active'
    ? (isEn ? 'CONTINUE' : 'FORTSETZEN')
    : missionSummary?.state === 'available'
      ? (isEn ? 'VIEW MISSIONS' : 'MISSIONEN ÖFFNEN')
      : missionSummary?.state === 'locked'
        ? (isEn ? 'LOCKED' : 'GESPERRT')
        : (isEn ? 'OPEN' : 'ÖFFNEN');
  return (
    <>
      <section className="arc-progress-summaries" aria-label={isEn ? 'Progress shortcuts' : 'Fortschritt Schnellzugriff'}>
        <button className="arc-summary-card arc-summary-card--streak" onClick={onOpenRoutine}><Flame /><span>{isEn ? 'Streak' : 'Serie'}</span><strong>{appState.consecutiveLoginDays || 0}</strong><small>{routineCount} {isEn ? 'routines' : 'Routinen'}</small></button>
        <button className="arc-summary-card arc-summary-card--calendar" onClick={onOpenCalendar}><CalendarDays /><span>{isEn ? 'Calendar' : 'Kalender'}</span><strong>{calendarCount}</strong><small>{isEn ? 'saved events' : 'Termine'}</small></button>
        <button className="arc-summary-card arc-summary-card--stats" onClick={onOpenStats}><BarChart3 /><span>{isEn ? 'Statistics' : 'Statistik'}</span><strong>{appState.level || 1}</strong><small>{isEn ? 'current level' : 'aktuelles Level'}</small></button>
      </section>

      <button className="arc-mission-teaser" onClick={onOpenMissions}>
        <div className="arc-mission-teaser-emblem">{missionSummary?.state === 'locked' ? <LockKeyhole /> : <ClipboardCheck />}</div>
        <div><span>{isEn ? 'MISSION SYSTEM' : 'MISSIONS-SYSTEM'}</span><h2>{missionTitle}</h2><p>{missionDescription}</p><i /></div>
        <strong>{missionAction}<ArrowRight /></strong>
      </button>

      <section className="arc-quick-access-section">
        <header><div><span>ARC // MODULES</span><h2>{isEn ? 'Your quick access' : 'Deine Schnellzugriffe'}</h2></div><button onClick={onCustomize}><SlidersHorizontal />{isEn ? 'Customize' : 'Anpassen'}</button></header>
        <div className="arc-quick-access-grid">
          {modules.map((module) => <button key={module.id} onClick={() => onOpenModule(module)}><span className="arc-quick-access-icon">{module.icon}</span><span><strong>{module.title}</strong><small>{module.description}</small></span><ArrowRight /></button>)}
        </div>
      </section>
    </>
  );
};
