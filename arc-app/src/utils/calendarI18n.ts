import { CalendarEvent } from '../types';
import { Language } from './i18n';

export const translateEventTitle = (
  evt: CalendarEvent | { title: string; titleEn?: string },
  lang: Language | string = 'en'
): string => {
  if (lang === 'en') {
    if (evt.titleEn) return evt.titleEn;
    const title = evt.title;
    const map: Record<string, string> = {
      'Tages-Briefing & Workout': 'Daily Briefing & Workout',
      'Tages-Briefing': 'Daily Briefing',
      'Monatsziel: 100km Laufen': 'Monthly Goal: 100km Run',
      '10km Laufen': '10km Run',
      'Projekt-Sprint Ziel': 'Project Sprint Goal',
      'Team Sync': 'Team Sync',
      'Zahnarzt': 'Dentist',
      'Workout': 'Workout',
      'Gym Training': 'Gym Workout',
      'Cardio & Laufen': 'Cardio & Running',
      'Projekt-Abgabe': 'Project Deadline',
      'Prüfungs-Ziel': 'Exam Goal',
      'Quartals-Review': 'Quarterly Review',
      'Strategie-Meeting': 'Strategy Meeting',
      'Code Review': 'Code Review',
      'Meditation & Stretching': 'Meditation & Stretching',
    };
    if (map[title]) return map[title];
    if (title.startsWith('Willkommen im Gruppenkalender: ')) {
      return title.replace('Willkommen im Gruppenkalender: ', 'Welcome to Group Calendar: ');
    }
    return title;
  } else {
    const title = evt.title;
    const map: Record<string, string> = {
      'Daily Briefing & Workout': 'Tages-Briefing & Workout',
      'Daily Briefing': 'Tages-Briefing',
      'Monthly Goal: 100km Run': 'Monatsziel: 100km Laufen',
      '10km Run': '10km Laufen',
      'Project Sprint Goal': 'Projekt-Sprint Ziel',
      'Dentist': 'Zahnarzt',
      'Gym Workout': 'Gym Training',
      'Cardio & Running': 'Cardio & Laufen',
      'Project Deadline': 'Projekt-Abgabe',
      'Exam Goal': 'Prüfungs-Ziel',
      'Quarterly Review': 'Quartals-Review',
    };
    if (map[title]) return map[title];
    if (title.startsWith('Welcome to Group Calendar: ')) {
      return title.replace('Welcome to Group Calendar: ', 'Willkommen im Gruppenkalender: ');
    }
    return title;
  }
};

export const translateEventDesc = (
  evt: CalendarEvent | { description?: string; descriptionEn?: string },
  lang: Language | string = 'en'
): string | undefined => {
  if (!evt.description && !evt.descriptionEn) return undefined;
  if (lang === 'en') {
    if (evt.descriptionEn) return evt.descriptionEn;
    const desc = evt.description || '';
    const map: Record<string, string> = {
      'Cyber-Training & Tägliches Impuls-Review': 'Cyber training & daily protocol review',
      'Ausdauer-Meilenstein erreichen': 'Reach endurance milestone',
      'Gemeinsame Termine & Zieldaten eintragen': 'Schedule shared events & target countdowns',
    };
    if (map[desc]) return map[desc];
    return desc;
  } else {
    const desc = evt.description || '';
    const map: Record<string, string> = {
      'Cyber training & daily protocol review': 'Cyber-Training & Tägliches Impuls-Review',
      'Reach endurance milestone': 'Ausdauer-Meilenstein erreichen',
      'Schedule shared events & target countdowns': 'Gemeinsame Termine & Zieldaten eintragen',
    };
    if (map[desc]) return map[desc];
    return desc;
  }
};

export const formatCountdownLabel = (daysDiff: number, lang: Language | string = 'en'): string => {
  if (lang === 'en') {
    if (daysDiff < 0) return `⚠️ Overdue (${Math.abs(daysDiff)}d)`;
    if (daysDiff === 0) return '🎯 Due today!';
    return `⏳ In ${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`;
  } else {
    if (daysDiff < 0) return `⚠️ Überfällig (${Math.abs(daysDiff)}d)`;
    if (daysDiff === 0) return '🎯 Heute fällig!';
    return `⏳ In ${daysDiff} ${daysDiff === 1 ? 'Tag' : 'Tagen'}`;
  }
};
