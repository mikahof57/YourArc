import type { ArcCanonicalStatId } from '../savegame/arcSaveGame';
import type { Language } from '../../utils/i18n';
import type { ArcCompanionAppState } from '../companion/companionTypes';

export const ARC_APP_HUB_CATALOG_SCHEMA_VERSION = 1 as const;
export type ArcCompanionLifecycleStatus = 'coming_soon' | 'available' | 'installed' | 'connected';

export interface ArcCompanionAppDefinition {
  slotId: string;
  appId: string;
  internalLabel: string;
  displayName: Record<Language, string>;
  shortDescription: Record<Language, string>;
  icon: 'placeholder';
  associatedStat: ArcCanonicalStatId;
  status: ArcCompanionLifecycleStatus;
  available: boolean;
  installed: boolean;
  connected: boolean;
  deepLink: null | { urlScheme: string };
  platformIdentifiers: null | { apple?: string; google?: string };
  sortOrder: number;
  schemaVersion: typeof ARC_APP_HUB_CATALOG_SCHEMA_VERSION;
}

const statDescriptions: Record<ArcCanonicalStatId, Record<Language, string>> = {
  wissen: { de: 'Künftige lokale Aktivitäten für Wissen und Lernen.', en: 'Future local activities for knowledge and learning.' },
  muskeln: { de: 'Künftige lokale Aktivitäten für Kraft und Training.', en: 'Future local activities for strength and training.' },
  geist: { de: 'Künftige lokale Aktivitäten für Fokus und mentale Stärke.', en: 'Future local activities for focus and mental strength.' },
  beweglichkeit: { de: 'Künftige lokale Aktivitäten für Mobilität und Bewegung.', en: 'Future local activities for mobility and movement.' },
  business: { de: 'Künftige lokale Aktivitäten für Business und Umsetzung.', en: 'Future local activities for business and execution.' },
  geld: { de: 'Künftige lokale Aktivitäten für Finanzen und Vermögen.', en: 'Future local activities for finance and wealth.' },
};

const stats: ArcCanonicalStatId[] = ['wissen', 'muskeln', 'geist', 'beweglichkeit', 'business', 'geld'];

export const ARC_COMPANION_APP_CATALOG: readonly ArcCompanionAppDefinition[] = Object.freeze(
  stats.map((associatedStat, index) => Object.freeze({
    slotId: `arc-companion-slot-${String(index + 1).padStart(2, '0')}`,
    appId: `arc-companion-${associatedStat}`,
    internalLabel: `ARC Companion ${associatedStat}`,
    displayName: {
      de: `Begleit-App Slot ${String(index + 1).padStart(2, '0')}`,
      en: `Companion App Slot ${String(index + 1).padStart(2, '0')}`,
    },
    shortDescription: statDescriptions[associatedStat],
    icon: 'placeholder' as const,
    associatedStat,
    status: 'coming_soon' as const,
    available: false,
    installed: false,
    connected: false,
    deepLink: null,
    platformIdentifiers: null,
    sortOrder: index + 1,
    schemaVersion: ARC_APP_HUB_CATALOG_SCHEMA_VERSION,
  })),
);

export function validateAppHubCatalog(catalog: readonly ArcCompanionAppDefinition[]): void {
  if (catalog.length !== 6) throw new Error('arc_app_hub_requires_six_slots');
  if (new Set(catalog.map((app) => app.slotId)).size !== catalog.length) throw new Error('arc_app_hub_duplicate_slot');
  if (new Set(catalog.map((app) => app.appId)).size !== catalog.length) throw new Error('arc_app_hub_duplicate_app');
  if (new Set(catalog.map((app) => app.associatedStat)).size !== stats.length
    || stats.some((stat) => !catalog.some((app) => app.associatedStat === stat))) throw new Error('arc_app_hub_stat_mapping_invalid');
  catalog.forEach((app, index) => {
    if (app.sortOrder !== index + 1 || !app.slotId || !app.appId) throw new Error('arc_app_hub_order_invalid');
    if (!['coming_soon', 'available', 'installed', 'connected'].includes(app.status)) throw new Error('arc_app_hub_status_invalid');
  });
}

validateAppHubCatalog(ARC_COMPANION_APP_CATALOG);

export function localizeCompanionApp(app: ArcCompanionAppDefinition, language: Language) {
  return { ...app, displayName: app.displayName[language], shortDescription: app.shortDescription[language] };
}

export function applyCompanionRuntimeState(
  definition: ArcCompanionAppDefinition,
  state: ArcCompanionAppState | undefined,
): ArcCompanionAppDefinition {
  if (!definition.available || definition.status === 'coming_soon' || !state) return structuredClone(definition);
  const status: ArcCompanionLifecycleStatus = state.connected ? 'connected' : state.installed ? 'installed' : 'available';
  return { ...structuredClone(definition), status, installed: state.installed, connected: state.connected };
}
