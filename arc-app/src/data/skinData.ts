export type SkinQualityTier = 'standard' | 'premium' | 'epic';
export type SkinCollection = 'entry' | 'standard' | 'premium' | 'epic';

export interface CyberSkin {
  id: string;
  name: string;
  category: 'avatar';
  price: number;
  description: string;
  avatarUrl: string;
  tier: SkinQualityTier;
  collection: SkinCollection;
  order: number;
}

export interface SkinCollectionDefinition {
  id: SkinCollection;
  tier: SkinQualityTier;
  labelDe: string;
  labelEn: string;
  subtitleDe?: string;
  subtitleEn?: string;
}

// Compatibility-only identity list used to safely neutralize a previously
// equipped retired avatar. These IDs are not exported as Shop products.
export const RETIRED_LEGACY_SKIN_IDS = new Set([
  'skin_sport_1', 'skin_sport_2', 'skin_sport_3', 'skin_sport_4', 'skin_sport_5',
  'skin_zen_1', 'skin_zen_2', 'skin_zen_3', 'skin_zen_4', 'skin_zen_5',
  'skin_biz_1', 'skin_biz_2', 'skin_biz_3', 'skin_biz_4', 'skin_biz_5',
  'skin_fokus_1', 'skin_fokus_2', 'skin_fokus_3', 'skin_fokus_4',
]);

export const SKIN_COLLECTIONS: SkinCollectionDefinition[] = [
  {
    id: 'entry',
    tier: 'standard',
    labelDe: 'Standard – Einstieg',
    labelEn: 'Standard – Entry',
    subtitleDe: 'Dein Einstieg in die ARC Kollektion',
    subtitleEn: 'Your entry into the ARC collection',
  },
  {
    id: 'standard',
    tier: 'standard',
    labelDe: 'Standard',
    labelEn: 'Standard',
  },
  {
    id: 'premium',
    tier: 'premium',
    labelDe: 'Hochwertig',
    labelEn: 'Premium',
  },
  {
    id: 'epic',
    tier: 'epic',
    labelDe: 'Extrem episch',
    labelEn: 'Extremely Epic',
  },
];

// One authoritative, globally ordered catalog. The four visible shelves are
// filtered presentation views over these same product objects.
const SKIN_CATALOG = [
  ['data-scholar', 'Data Scholar', 'Data Scholar.png', 100, 'standard', 'entry', 1],
  ['mind-seeker', 'Mind Seeker', 'Mind Seeker.png', 100, 'standard', 'entry', 2],
  ['kinetic-phantom-1', 'Kinetic Phantom 1', 'Kinetic Phantom1.png', 100, 'standard', 'entry', 3],
  ['iron-athlete-1', 'Iron Athlete 1', 'Iron Athlete1.png', 150, 'standard', 'standard', 4],
  ['iron-athlete-2', 'Iron Athlete 2', 'Iron Athlete2.png', 175, 'standard', 'standard', 5],
  ['kinetic-phantom-2', 'Kinetic Phantom 2', 'Kinetic Phantom2.png', 175, 'standard', 'standard', 6],
  ['urban-executive-2', 'Urban Executive 2', 'Urban Executive2.png', 225, 'standard', 'standard', 7],
  ['street-investor', 'Street Investor', 'Street Investor.png', 250, 'standard', 'standard', 8],
  ['neural-architect', 'Neural Architect', 'Neural Architect.png', 300, 'premium', 'premium', 9],
  ['titan-vanguard', 'Titan Vanguard', 'Titan Vanguard.png', 325, 'premium', 'premium', 10],
  ['astral-seer', 'Astral Seer', 'Astral Seer.png', 350, 'premium', 'premium', 11],
  ['urban-executive', 'Urban Executive', 'Urban Executive.png', 350, 'premium', 'premium', 12],
  ['urban-executive-1', 'Urban Executive 1', 'Urban Executive1.png', 375, 'premium', 'premium', 13],
  ['venture-director', 'Venture Director', 'Venture Director.png', 425, 'premium', 'premium', 14],
  ['emerald-magnate', 'Emerald Magnate', 'Emerald Magnate.png', 450, 'premium', 'premium', 15],
  ['eclipse-oracle', 'Eclipse Oracle', 'Eclipse Oracle.png', 500, 'epic', 'epic', 16],
  ['apex-colossus', 'Apex Colossus', 'Apex Colossus.png', 600, 'epic', 'epic', 17],
  ['quantum-sovereign', 'Quantum Sovereign', 'Quantum Sovereign.png', 700, 'epic', 'epic', 18],
  ['velocity-ascendant', 'Velocity Ascendant', 'Velocity Ascendant.png', 750, 'epic', 'epic', 19],
  ['empire-architect', 'Empire Architect', 'Empire Architect.png', 850, 'epic', 'epic', 20],
  ['fortune-sovereign-1', 'Fortune Sovereign 1', 'Fortune Sovereign1.png', 1000, 'epic', 'epic', 21],
  ['fortune-sovereign-2', 'Fortune Sovereign 2', 'Fortune Sovereign2.png', 1000, 'epic', 'epic', 22],
] as const satisfies ReadonlyArray<readonly [string, string, string, number, SkinQualityTier, SkinCollection, number]>;

export const AVAILABLE_SKINS: CyberSkin[] = SKIN_CATALOG.map(
  ([id, name, filename, price, tier, collection, order]) => ({
    id,
    name,
    category: 'avatar',
    price,
    description: '',
    avatarUrl: `/assets/skins/${filename}`,
    tier,
    collection,
    order,
  })
);

export const translateSkinName = (skin: CyberSkin, _lang: string = 'de'): string => skin.name;
export const translateSkinDesc = (skin: CyberSkin, _lang: string = 'de'): string => skin.description;
