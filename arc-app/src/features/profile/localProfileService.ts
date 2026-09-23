import type { CalendarState, WeeklyRoutineState } from '../../types';
import type { ArcSaveRepository } from '../savegame/arcSaveRepository';
import {
  mirrorConfirmedProfile, updateAvatar, updateCalendar, updateGender, updateLocalProfile, updateProfileField,
  updateSettings, updateUiPreferences, updateWeeklyRoutine,
  type ArcLocalProfilePatch, type ArcLocalSettingsPatch,
} from './localProfileDomain';

/** Transactional local authority for offline player and presentation state. */
export class LocalProfileService {
  constructor(private readonly saves: ArcSaveRepository) {}
  load() { return this.saves.load(); }
  updateLocalProfile(patch: ArcLocalProfilePatch) { return this.saves.transaction((save) => updateLocalProfile(save, patch)); }
  updateAvatar(url: string, category?: 'superheroes' | 'anime' | 'comic') { return this.saves.transaction((save) => updateAvatar(save, url, category)); }
  updateGender(gender: 'm' | 'f' | 'd') { return this.saves.transaction((save) => updateGender(save, gender)); }
  mirrorConfirmedProfile(profile: Parameters<typeof mirrorConfirmedProfile>[1]) { return this.saves.transaction((save) => mirrorConfirmedProfile(save, profile)); }
  updateProfileField<K extends keyof ArcLocalProfilePatch>(field: K, value: ArcLocalProfilePatch[K]) { return this.saves.transaction((save) => updateProfileField(save, field, value)); }
  updateSettings(patch: ArcLocalSettingsPatch) { return this.saves.transaction((save) => updateSettings(save, patch)); }
  updateCalendar(calendar: Pick<CalendarState, 'privateEvents'> & Partial<Pick<CalendarState, 'activeCalendarId'>>) { return this.saves.transaction((save) => updateCalendar(save, calendar)); }
  updateWeeklyRoutine(routine: WeeklyRoutineState) { return this.saves.transaction((save) => updateWeeklyRoutine(save, routine)); }
  updateUiPreferences(patch: Parameters<typeof updateUiPreferences>[1]) { return this.saves.transaction((save) => updateUiPreferences(save, patch)); }
}
