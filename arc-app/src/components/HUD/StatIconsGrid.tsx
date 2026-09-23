import React from 'react';
import { StatAttribute } from '../../types';
import { Check, ChevronRight, Minus, Target, Maximize2 } from 'lucide-react';
import { Language, t, translateStatName } from '../../utils/i18n';

interface StatIconsGridProps {
  stats: StatAttribute[]; completedTasksToday: string[]; lang?: Language; isMinimized?: boolean;
  dailyTaskTitles?: Record<string, string>;
  onToggleMinimize?: () => void; onSelectStatIcon: (stat: StatAttribute) => void;
}

export const StatIconsGrid: React.FC<StatIconsGridProps> = ({ stats, completedTasksToday, dailyTaskTitles = {}, lang = 'en', isMinimized = false, onToggleMinimize, onSelectStatIcon }) => {
  const completedCount = stats.filter((stat) => completedTasksToday.includes(stat.id)).length;
  const completion = stats.length ? (completedCount / stats.length) * 100 : 0;
  if (isMinimized) return (
    <section className="arc-missions arc-v10-missions arc-missions--minimized">
      <div><Target /><strong>{t('dailyProtocols', lang)}</strong><span>{completedCount}/{stats.length}</span></div>
      {onToggleMinimize && <button onClick={onToggleMinimize}><Maximize2 />{lang === 'en' ? 'Open' : 'Öffnen'}</button>}
    </section>
  );

  return (
    <section className="arc-missions arc-v10-missions">
      <header className="arc-missions-header">
        <div><span className="arc-kicker">TODAY // ACTIVE PROTOCOL</span><h2 className="arc-display">{lang === 'en' ? 'Daily Protocols' : 'Tägliche Protokolle'}</h2><p>{lang === 'en' ? 'Complete your daily assignments.' : 'Schließe deine Tagesaufgaben ab.'}</p></div>
        <div className="arc-mission-summary"><strong>{completedCount}<small> / {stats.length}</small></strong><span>{lang === 'en' ? 'completed' : 'erledigt'}</span></div>
        {onToggleMinimize && <button className="arc-section-control" onClick={onToggleMinimize} title={lang === 'en' ? 'Minimize' : 'Minimieren'}><Minus /></button>}
      </header>
      <div className="arc-mission-total"><span style={{ width: `${completion}%` }} /></div>
      <div className="arc-mission-list">
        {stats.map((stat, index) => {
          const isDone = completedTasksToday.includes(stat.id);
          return (
            <button key={stat.id} onClick={() => onSelectStatIcon(stat)} className={`arc-mission-card ${isDone ? 'is-complete' : ''}`} style={{ '--arc-mission-index': index } as React.CSSProperties}>
              <span className="arc-mission-icon">{stat.emoji}</span>
              <span className="arc-mission-content"><span className="arc-mission-stat">{translateStatName(stat.name, lang)}</span><strong>{dailyTaskTitles[stat.id] || (lang === 'en' ? 'Daily assignment' : 'Tagesaufgabe')}</strong><span className="arc-mission-status-line"><i className={isDone ? 'is-full' : ''} /></span></span>
              <span className="arc-mission-state">{isDone ? <Check /> : <Target />}<small>{isDone ? t('statusDone', lang) : t('statusOpen', lang)}</small></span>
              <ChevronRight className="arc-mission-chevron" />
            </button>
          );
        })}
      </div>
    </section>
  );
};
