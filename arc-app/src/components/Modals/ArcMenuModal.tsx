import React from 'react';
import { Award, BarChart3, CalendarDays, RotateCcw, Settings, X } from 'lucide-react';
import { Language } from '../../utils/i18n';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface ArcMenuModalProps {
  lang: Language; onClose: () => void; onOpenAchievements: () => void; onOpenStats: () => void;
  onOpenSettings: () => void; onOpenRoutine: () => void; onOpenCalendar: () => void; onCreateCharacter: () => void;
}

export const ArcMenuModal: React.FC<ArcMenuModalProps> = ({ lang, onClose, onOpenAchievements, onOpenStats, onOpenSettings, onOpenRoutine, onOpenCalendar, onCreateCharacter }) => {
  const isEn = lang === 'en';
  const dialogRef = useModalAccessibility<HTMLElement>(onClose);
  const items = [
    [Award, isEn ? 'Achievements' : 'Erfolge', onOpenAchievements], [BarChart3, isEn ? 'Statistics' : 'Statistik', onOpenStats],
    [CalendarDays, isEn ? 'Weekly Routine' : 'Wochenplan', onOpenRoutine],
    [CalendarDays, isEn ? 'Calendar' : 'Kalender', onOpenCalendar], [Settings, isEn ? 'Settings' : 'Einstellungen', onOpenSettings],
    [RotateCcw, isEn ? 'Create new character' : 'Neuen Charakter erstellen', onCreateCharacter],
  ] as const;
  return <div className="arc-modal-overlay fixed inset-0 z-50 flex items-center justify-center"><section ref={dialogRef} tabIndex={-1} className="arc-menu-sheet" role="dialog" aria-modal="true" aria-labelledby="arc-menu-title"><header><div><span>ARC // SYSTEM MENU</span><h2 id="arc-menu-title">{isEn ? 'Menu' : 'Menü'}</h2></div><button onClick={onClose} aria-label={isEn ? 'Close menu' : 'Menü schließen'}><X /></button></header><div className="arc-menu-grid">{items.map(([Icon, label, action]) => <button key={label} onClick={() => { onClose(); action(); }}><Icon /><span>{label}</span><small>OPEN</small></button>)}</div></section></div>;
};
