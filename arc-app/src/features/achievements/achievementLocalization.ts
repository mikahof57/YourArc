import type { Language } from '../../utils/i18n';
import { ARC_TITLE_CATALOG } from './achievementCatalog';
import type { AchievementDefinition, AchievementRarity, AchievementSection, UserTitle } from './achievementTypes';

const sectionLabels: Record<AchievementSection, Record<Language, string>> = {
  career: { de: 'Karriere', en: 'Career' },
  body_mind: { de: 'Körper & Geist', en: 'Body & Mind' },
  money_business: { de: 'Geld & Business', en: 'Finance & Business' },
  versatility: { de: 'Vielseitigkeit', en: 'Versatility' },
  consistency: { de: 'Beständigkeit', en: 'Consistency' },
  missions: { de: 'Missionen', en: 'Missions' },
  shop: { de: 'Shop', en: 'Shop' },
  gameplay_credits: { de: 'Erspielte Credits', en: 'Gameplay Credits' },
  community: { de: 'Community', en: 'Community' },
  meta_ranking: { de: 'Meta & Rangliste', en: 'Meta & Ranking' },
};

const rarityLabels: Record<AchievementRarity, Record<Language, string>> = {
  common: { de: 'Gewöhnlich', en: 'Common' },
  rare: { de: 'Selten', en: 'Rare' },
  epic: { de: 'Episch', en: 'Epic' },
  legendary: { de: 'Legendär', en: 'Legendary' },
};

export function localizeAchievement(definition: AchievementDefinition, language: Language) {
  return {
    title: language === 'en' ? definition.title_en : definition.title_de,
    description: language === 'en' ? definition.condition_en : definition.condition_de,
  };
}

export function localizeAchievementSection(section: AchievementSection, language: Language): string {
  return sectionLabels[section][language];
}

export function localizeAchievementRarity(rarity: AchievementRarity, language: Language): string {
  return rarityLabels[rarity][language];
}

export function localizeAchievementState(unlocked: boolean, language: Language): string {
  if (unlocked) return language === 'en' ? 'Unlocked' : 'Freigeschaltet';
  return language === 'en' ? 'Locked' : 'Gesperrt';
}

export function localizeAchievementProgress(completed: boolean, language: Language): string {
  if (completed) return language === 'en' ? 'Complete' : 'Abgeschlossen';
  return language === 'en' ? 'Progress' : 'Fortschritt';
}

export function localizeAchievementReward(language: Language): string {
  return language === 'en' ? 'Reward' : 'Belohnung';
}

export function getLocalizedTitleName(
  titleId: string,
  language: Language,
  storedTitle?: Pick<UserTitle, 'name_de' | 'name_en'>,
): string {
  const catalogTitle = ARC_TITLE_CATALOG.find(([id]) => id === titleId);
  if (catalogTitle) return language === 'en' ? catalogTitle[2] : catalogTitle[1];
  return language === 'en' ? (storedTitle?.name_en ?? titleId) : (storedTitle?.name_de ?? titleId);
}
