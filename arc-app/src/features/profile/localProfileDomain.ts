import type { CalendarState, CollapsedWindowsState, WeeklyRoutineState } from '../../types';
import type { ArcLocalPlayerProfile, ArcSaveGame } from '../savegame/arcSaveGame';

export type ArcLocalProfilePatch = Partial<Pick<ArcLocalPlayerProfile,
  'name' | 'avatarUrl' | 'avatarCategory' | 'gender' | 'age' | 'weight' | 'height' | 'showAvatarFrame'>>;
export type ArcLocalSettingsPatch = Partial<ArcSaveGame['settings']>;

const nowIso = () => new Date().toISOString();
const clone = <T>(value: T): T => structuredClone(value);

function validateProfile(profile: ArcLocalPlayerProfile): void {
  if (typeof profile.name !== 'string' || profile.name.length > 60) throw new Error('arc_local_profile_name_invalid');
  if (!['m', 'f', 'd'].includes(profile.gender)) throw new Error('arc_local_profile_gender_invalid');
  if (typeof profile.avatarUrl !== 'string' || profile.avatarUrl.length > 2048) throw new Error('arc_local_profile_avatar_invalid');
  for (const field of ['age', 'weight', 'height'] as const) {
    const value = profile[field];
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error(`arc_local_profile_${field}_invalid`);
  }
}

export function updateLocalProfile(save: ArcSaveGame, patch: ArcLocalProfilePatch): void {
  const next = { ...save.profile, ...clone(patch) };
  validateProfile(next);
  save.profile = next;
  save.localStateMeta.profileUpdatedAt = nowIso();
}

export function updateAvatar(save: ArcSaveGame, avatarUrl: string, avatarCategory?: ArcLocalPlayerProfile['avatarCategory']): void {
  updateLocalProfile(save, { avatarUrl, ...(avatarCategory ? { avatarCategory } : {}) });
}

export function updateGender(save: ArcSaveGame, gender: ArcLocalPlayerProfile['gender']): void {
  updateLocalProfile(save, { gender });
}

/** Accepts only already-confirmed production presentation data; characterCode is never local identity. */
export function mirrorConfirmedProfile(save: ArcSaveGame, profile: Pick<ArcLocalPlayerProfile, 'name' | 'avatarUrl' | 'gender' | 'characterCode'>): void {
  updateLocalProfile(save, { name: profile.name, avatarUrl: profile.avatarUrl, gender: profile.gender });
  if (profile.characterCode !== undefined) {
    save.profile.characterCode = profile.characterCode;
    save.character.characterCode = profile.characterCode;
  }
}

export function updateProfileField<K extends keyof ArcLocalProfilePatch>(save: ArcSaveGame, field: K, value: ArcLocalProfilePatch[K]): void {
  updateLocalProfile(save, { [field]: value } as ArcLocalProfilePatch);
}

export function updateSettings(save: ArcSaveGame, patch: ArcLocalSettingsPatch): void {
  const next = { ...save.settings, ...clone(patch) };
  if (!['de', 'en'].includes(next.language)) throw new Error('arc_local_settings_language_invalid');
  if (!Array.isArray(next.activeBottomModules) || !next.activeBottomModules.every((value) => typeof value === 'string')) throw new Error('arc_local_settings_modules_invalid');
  if (!Array.isArray(next.selectedDesignColors) || next.selectedDesignColors.length > 3
    || !next.selectedDesignColors.every((value) => typeof value === 'string')) throw new Error('arc_local_settings_colors_invalid');
  if (!next.quotes || !Array.isArray(next.quotes.selectedCategories)) throw new Error('arc_local_settings_quotes_invalid');
  save.settings = next;
  save.localStateMeta.settingsUpdatedAt = nowIso();
}

/** Personal calendar only. Existing social/group calendar data is preserved, not adopted. */
export function updateCalendar(save: ArcSaveGame, calendar: Pick<CalendarState, 'privateEvents'> & Partial<Pick<CalendarState, 'activeCalendarId'>>): void {
  if (!Array.isArray(calendar.privateEvents)) throw new Error('arc_local_calendar_invalid');
  save.calendar = {
    ...save.calendar,
    privateEvents: clone(calendar.privateEvents),
    activeCalendarId: calendar.activeCalendarId === 'private' ? 'private' : save.calendar.activeCalendarId,
  };
  save.localStateMeta.calendarUpdatedAt = nowIso();
}

export function updateWeeklyRoutine(save: ArcSaveGame, routine: WeeklyRoutineState): void {
  if (!routine || typeof routine !== 'object' || Array.isArray(routine)) throw new Error('arc_local_weekly_routine_invalid');
  for (let day = 0; day <= 6; day += 1) if (!Array.isArray(routine[day] ?? [])) throw new Error('arc_local_weekly_routine_day_invalid');
  save.weeklyRoutine = clone(routine);
  save.localStateMeta.weeklyRoutineUpdatedAt = nowIso();
}

export function updateUiPreferences(save: ArcSaveGame, patch: Partial<{
  collapsedWindows: CollapsedWindowsState;
  seenModuleItemIds: Record<string, string[]>;
  moduleReloadsCountToday: number;
}>): void {
  if (patch.moduleReloadsCountToday !== undefined
    && (!Number.isSafeInteger(patch.moduleReloadsCountToday) || patch.moduleReloadsCountToday < 0)) throw new Error('arc_local_ui_reload_count_invalid');
  if (patch.collapsedWindows) save.ui.collapsedWindows = clone(patch.collapsedWindows);
  if (patch.seenModuleItemIds) save.ui.seenModuleItemIds = clone(patch.seenModuleItemIds);
  if (patch.moduleReloadsCountToday !== undefined) save.ui.moduleReloadsCountToday = patch.moduleReloadsCountToday;
}
