import { AppState, Quote, WeeklyRoutineState } from '../types';
import { DEFAULT_STATS } from '../data/defaultStats';
import { QUOTES_DATABASE } from '../data/quotes';
import { generateCharacterCode } from '../data/communityData';

const STORAGE_KEY = 'arc_app_system_state_v1';

export const DEFAULT_WEEKLY_ROUTINE: WeeklyRoutineState = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getInitialState(): AppState {
  const today = getTodayDateString();
  return {
    profile: {
      name: '',
      gender: 'm',
      avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
      avatarCategory: 'anime',
      isCreated: false,
      createdAt: today,
      characterCode: generateCharacterCode(),
    },
    stats: DEFAULT_STATS,
    quoteSettings: {
      selectedCategories: ['alle'],
    },
    activeBottomModules: ['motivation', 'business_ideas', 'books'],
    lastActiveDate: today,
    completedTasksToday: [],
    history: [
      {
        date: today,
        stats: DEFAULT_STATS.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {}),
      },
    ],
    moduleReloadsCountToday: 0,
    seenModuleItemIds: {},
    credits: 0, // Temporary local cache until the server balance is hydrated
    consecutiveLoginDays: 1,
    lastDailyBonusDate: today,
    authAccount: null,
    ownedSkinIds: [],
    equippedSkinId: '',
    lastWheelSpinDate: '',
    calendarState: {
      privateEvents: [
        {
          id: 'evt-init-1',
          title: 'Tages-Briefing & Workout',
          titleEn: 'Daily Briefing & Workout',
          description: 'Cyber-Training & Tägliches Impuls-Review',
          descriptionEn: 'Cyber training & daily protocol review',
          date: today,
          time: '15:00',
          type: 'appointment',
          isCompleted: false,
        },
        {
          id: 'evt-init-2',
          title: 'Monatsziel: 100km Laufen',
          titleEn: 'Monthly Goal: 100km Run',
          description: 'Ausdauer-Meilenstein erreichen',
          descriptionEn: 'Reach endurance milestone',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'goal',
          isCompleted: false,
        },
      ],
      groupCalendars: [],
      activeCalendarId: 'private',
    },
    weeklyRoutine: DEFAULT_WEEKLY_ROUTINE,
    collapsedWindows: {},
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed: AppState = JSON.parse(raw);

    if (!parsed.profile || !parsed.profile.characterCode) {
      if (!parsed.profile) {
        parsed.profile = getInitialState().profile;
      } else {
        parsed.profile.characterCode = generateCharacterCode();
      }
      saveAppState(parsed);
    }

    // Missing legacy local balances must not create synthetic credits.
    if (parsed.credits === undefined || parsed.credits === null) {
      parsed.credits = 0;
    }

    if (!parsed.consecutiveLoginDays) {
      parsed.consecutiveLoginDays = 1;
    }

    if (!parsed.ownedSkinIds) {
      parsed.ownedSkinIds = [];
    }
    if (parsed.equippedSkinId === undefined) {
      parsed.equippedSkinId = '';
    }
    if (!parsed.lastWheelSpinDate) {
      parsed.lastWheelSpinDate = '';
    }
    if (!parsed.unlockedDesignColors) {
      parsed.unlockedDesignColors = ['#06b6d4', '#f59e0b'];
    } else if (!parsed.unlockedDesignColors.includes('#06b6d4')) {
      parsed.unlockedDesignColors.push('#06b6d4');
    }
    if (!parsed.selectedDesignColors || parsed.selectedDesignColors.length === 0) {
      parsed.selectedDesignColors = ['#06b6d4'];
    }
    if (!parsed.calendarState) {
      const todayStr = getTodayDateString();
      parsed.calendarState = {
        privateEvents: [
          {
            id: 'evt-init-1',
            title: 'Tages-Briefing & Workout',
            titleEn: 'Daily Briefing & Workout',
            description: 'Cyber-Training & Tägliches Impuls-Review',
            descriptionEn: 'Cyber training & daily protocol review',
            date: todayStr,
            time: '15:00',
            type: 'appointment',
            isCompleted: false,
          },
          {
            id: 'evt-init-2',
            title: 'Monatsziel: 100km Laufen',
            titleEn: 'Monthly Goal: 100km Run',
            description: 'Ausdauer-Meilenstein erreichen',
            descriptionEn: 'Reach endurance milestone',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: 'goal',
            isCompleted: false,
          },
        ],
        groupCalendars: [],
        activeCalendarId: 'private',
      };
    }

    if (!parsed.weeklyRoutine) {
      parsed.weeklyRoutine = DEFAULT_WEEKLY_ROUTINE;
    } else {
      // Clear out any old default preset tasks starting with 'w-'
      Object.keys(parsed.weeklyRoutine).forEach((key) => {
        const dayIdx = Number(key);
        if (Array.isArray(parsed.weeklyRoutine[dayIdx])) {
          parsed.weeklyRoutine[dayIdx] = parsed.weeklyRoutine[dayIdx].filter(
            (t: any) => !t.id.startsWith('w-')
          );
        }
      });
    }
    if (!parsed.collapsedWindows) {
      parsed.collapsedWindows = {};
    }

    // localStorage is only a cache. Server hydration owns ARC progression/day state.
    const today = getTodayDateString();
    if (parsed.lastActiveDate !== today) {
      // Use the date only to prevent repeated UI-cache resets before server hydration.
      parsed.lastActiveDate = today;
      parsed.moduleReloadsCountToday = 0;

      saveAppState(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load AppState from localStorage:', err);
    return getInitialState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save AppState:', err);
  }
}

export function getRandomQuote(state: AppState): Quote {
  const { selectedCategories, selectedReligion } = state.quoteSettings;

  let filtered = QUOTES_DATABASE;

  const categories = selectedCategories as string[];

  if (categories.length > 0 && !categories.includes('alle')) {
    filtered = filtered.filter((q) => categories.includes(q.category));
  }

  if (selectedReligion && categories.includes('religion')) {
    filtered = filtered.filter(
      (q) => q.category !== 'religion' || q.subCategory === selectedReligion
    );
  }

  if (filtered.length === 0) {
    filtered = QUOTES_DATABASE;
  }

  // Deterministic daily index based on today's date string, or random fallback
  const dateStr = getTodayDateString();
  let num = 0;
  for (let i = 0; i < dateStr.length; i++) {
    num += dateStr.charCodeAt(i);
  }
  const index = num % filtered.length;

  return filtered[index];
}
