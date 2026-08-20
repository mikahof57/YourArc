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
        .select('*')
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
            credits: profileData.credits ?? prev.profile.credits,
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
 * Asynchronous function that takes the current habits, stats, and profile state
 * from the store and upserts them into Supabase tables (habits, stats, profiles).
 */
export async function syncData(): Promise<void> {
  const state = useStore.getState();
  const userId = state.user?.id || state.userId || 'user_default';
  if (!userId || userId === 'user_default') return;

  try {
    // 1. Sync Habits
    if (state.habits && state.habits.length > 0) {
      const habitsToUpsert = state.habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        category: habit.category,
        completed: habit.completed,
        streak: habit.streak,
        xp_reward: habit.xpReward ?? 20,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }));

      const { error: habitsError } = await supabase
        .from('habits')
        .upsert(habitsToUpsert, { onConflict: 'id' });

      if (habitsError) {
        console.error('Supabase Sync Error [habits]:', habitsError.message);
      }
    }

    // 2. Sync Stats
    if (state.stats) {
      const statsObj = state.stats;
      const statsToUpsert = {
        user_id: userId,
        level: statsObj.level ?? 1,
        current_xp: statsObj.currentXp ?? 0,
        max_xp: statsObj.maxXp ?? 100,
        strength: statsObj.strength ?? 10,
        discipline: statsObj.discipline ?? 10,
        intellect: statsObj.intellect ?? 10,
        vitality: statsObj.vitality ?? 10,
        updated_at: new Date().toISOString(),
      };

      const { error: statsError } = await supabase
        .from('stats')
        .upsert([statsToUpsert], { onConflict: 'user_id' });

      if (statsError) {
        console.error('Supabase Sync Error [stats]:', statsError.message);
      }
    }

    // 3. Sync Profile
    if (state.profile) {
      const profileToUpsert = {
        user_id: userId,
        name: state.profile.name || 'Operative',
        avatar_url: state.profile.avatarUrl || '',
        gender: state.profile.gender || 'm',
        character_code: state.profile.characterCode || null,
        level: Number(state.profile.level || 1),
        standard_points: Number(state.profile.standardPoints || 0),
        credits: Number((state.profile as any).credits ?? 100),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileToUpsert], { onConflict: 'user_id' });

      if (profileError) {
        console.error('Supabase Sync Error [profiles]:', profileError.message);
      }
    }
  } catch (err) {
    console.error('Unexpected error during syncWithSupabase:', err);
  }
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

// Debounced auto-sync subscription on state changes (2 seconds debounce)
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

useStore.subscribe(() => {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  syncDebounceTimer = setTimeout(() => {
    syncData();
  }, 2000);
});

