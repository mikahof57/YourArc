import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { Habit, CharacterStats, UserProfile } from '../types';

export interface StoreState {
  user: User | null;
  userId: string;
  isAuthInitializing: boolean;
  profile: Partial<UserProfile> & { id?: string; name?: string; [key: string]: any };
  stats: CharacterStats | Record<string, any>;
  habits: Habit[];

  // Actions
  initializeAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setUserId: (id: string) => void;
  setProfile: (profile: Partial<UserProfile> | any) => void;
  setStats: (stats: CharacterStats | any) => void;
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  toggleHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  syncData: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  userId: 'user_default',
  isAuthInitializing: true,
  profile: {
    name: 'Cyber Operative',
    avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
    isCreated: true,
  },
  stats: {
    level: 1,
    currentXp: 0,
    maxXp: 100,
    strength: 10,
    discipline: 10,
    intellect: 10,
    vitality: 10,
  },
  habits: [
    {
      id: 'habit-1',
      title: 'Morgen-Workout (20 Min)',
      category: 'strength',
      completed: false,
      streak: 3,
      xpReward: 25,
    },
    {
      id: 'habit-2',
      title: 'Cold Shower Protocol',
      category: 'discipline',
      completed: false,
      streak: 5,
      xpReward: 30,
    },
    {
      id: 'habit-3',
      title: 'Cyberpunk Code Review',
      category: 'intellect',
      completed: false,
      streak: 2,
      xpReward: 20,
    },
  ],

  initializeAuth: async () => {
    set({ isAuthInitializing: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user, userId: session.user.id });
        await get().fetchUserData();
      } else {
        set({ user: null, userId: 'user_default' });
      }
    } catch (err) {
      console.error('Error initializing authentication:', err);
    } finally {
      set({ isAuthInitializing: false });
    }
  },

  setUser: (user) => set({ user, userId: user?.id || 'user_default' }),
  setUserId: (id) => set({ userId: id }),
  setProfile: (profile) =>
    set((state) => ({ profile: typeof profile === 'function' ? profile(state.profile) : { ...state.profile, ...profile } })),
  setStats: (stats) =>
    set((state) => ({ stats: typeof stats === 'function' ? stats(state.stats) : { ...state.stats, ...stats } })),
  setHabits: (habits) => set({ habits }),
  addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),
  toggleHabit: (id) =>
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)),
    })),
  deleteHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, userId: 'user_default' });
  },
  fetchUserData: async () => {
    const state = get();
    const userId = state.user?.id || state.userId;
    if (!userId || userId === 'user_default') return;

    try {
      // 1. Fetch Habits
      const { data: habitsData, error: habitsErr } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);

      if (habitsData && habitsData.length > 0 && !habitsErr) {
        const habits: Habit[] = habitsData.map((h: any) => ({
          id: h.id,
          title: h.title,
          category: h.category,
          completed: Boolean(h.completed),
          streak: h.streak ?? 0,
          xpReward: h.xp_reward ?? 20,
          user_id: h.user_id,
        }));
        set({ habits });
      }

      // 2. Fetch Stats
      const { data: statsData, error: statsErr } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsData && !statsErr) {
        set({
          stats: {
            level: statsData.level ?? 1,
            currentXp: statsData.current_xp ?? 0,
            maxXp: statsData.max_xp ?? 100,
            strength: statsData.strength ?? 10,
            discipline: statsData.discipline ?? 10,
            intellect: statsData.intellect ?? 10,
            vitality: statsData.vitality ?? 10,
            user_id: statsData.user_id,
          },
        });
      }

      // 3. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id,name,avatar_url,gender,character_code,level,standard_points,credits')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData && !profileErr) {
        set((prev) => ({
          profile: {
            ...prev.profile,
            name: profileData.name || prev.profile.name,
            avatarUrl: profileData.avatar_url || prev.profile.avatarUrl,
            gender: profileData.gender || prev.profile.gender,
            characterCode: profileData.character_code || prev.profile.characterCode,
            level: profileData.level ?? prev.profile.level,
            standardPoints: profileData.standard_points ?? prev.profile.standardPoints,
            credits: profileData.credits ?? 0,
          },
        }));
      }
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    }
  },
  syncData: async () => {
    await syncData();
  },
}));

/**
 * @deprecated Legacy compatibility entry point. Automatic persistence is frozen:
 * the active six-stat/task model lives in AppState, and profile edits use the
 * explicit narrow owner-profile update instead of this broad writer.
 */
export async function syncData(): Promise<void> {
  return;
}

// Initialize Supabase Auth Session and Listeners
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    useStore.getState().setUser(session.user);
    useStore.getState().fetchUserData();
  }
});

supabase.auth.onAuthStateChange((_event, session) => {
  const store = useStore.getState();
  const sessionUser = session?.user || null;

  if (sessionUser?.id !== store.user?.id) {
    store.setUser(sessionUser);
    if (sessionUser) {
      store.fetchUserData();
    }
  }
});
