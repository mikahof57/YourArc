import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ACHIEVEMENT_CATALOG, ARC_TITLE_CATALOG } from '../../src/features/achievements/achievementCatalog';
import {
  getLocalizedTitleName,
  localizeAchievement,
  localizeAchievementProgress,
  localizeAchievementRarity,
  localizeAchievementReward,
  localizeAchievementSection,
  localizeAchievementState,
} from '../../src/features/achievements/achievementLocalization';
import { sha256Hex, stableStringify } from '../../src/features/content/contentHash';

assert.equal(ACHIEVEMENT_CATALOG.length, 78);
assert.deepEqual(ACHIEVEMENT_CATALOG.map((item) => item.achievement_id), Array.from({ length: 78 }, (_, index) => index + 1));
assert.equal(new Set(ACHIEVEMENT_CATALOG.map((item) => item.achievement_id)).size, 78);

for (const achievement of ACHIEVEMENT_CATALOG) {
  assert.ok(achievement.title_de.trim(), `Achievement ${achievement.achievement_id} is missing a DE title`);
  assert.ok(achievement.title_en.trim(), `Achievement ${achievement.achievement_id} is missing an EN title`);
  assert.ok(achievement.condition_de.trim(), `Achievement ${achievement.achievement_id} is missing a DE description`);
  assert.ok(achievement.condition_en.trim(), `Achievement ${achievement.achievement_id} is missing an EN description`);
  assert.notEqual(achievement.title_en, achievement.title_de, `Achievement ${achievement.achievement_id} title falls back to DE`);
  assert.notEqual(achievement.condition_en, achievement.condition_de, `Achievement ${achievement.achievement_id} description falls back to DE`);
  assert.equal(localizeAchievement(achievement, 'de').title, achievement.title_de);
  assert.equal(localizeAchievement(achievement, 'en').title, achievement.title_en);
  assert.equal(localizeAchievement(achievement, 'de').description, achievement.condition_de);
  assert.equal(localizeAchievement(achievement, 'en').description, achievement.condition_en);
}

const expectedTitleIds = [
  'arc_veteran','titan','master_of_mind','financial_strategist','tycoon','all_master','year_veteran',
  'mission_veteran','elite','icon','number_one','vice_world','clan_champion',
];
assert.deepEqual(ARC_TITLE_CATALOG.map(([id]) => id), expectedTitleIds);
assert.equal(new Set(ARC_TITLE_CATALOG.map(([id]) => id)).size, 13);
for (const [id, nameDe, nameEn] of ARC_TITLE_CATALOG) {
  assert.ok(nameDe.trim() && nameEn.trim(), `Title ${id} localization missing`);
  assert.equal(getLocalizedTitleName(id, 'de'), nameDe);
  assert.equal(getLocalizedTitleName(id, 'en'), nameEn);
}

const staleStoredTitle = { name_de: 'Meister des Geistes', name_en: 'Meister des Geistes' };
assert.equal(getLocalizedTitleName('master_of_mind', 'en', staleStoredTitle), 'Master of Mind', 'catalog localization overrides stale saved EN title text');
assert.equal(getLocalizedTitleName('master_of_mind', 'de', staleStoredTitle), 'Meister des Geistes');

assert.equal(localizeAchievementSection('body_mind', 'de'), 'Körper & Geist');
assert.equal(localizeAchievementSection('body_mind', 'en'), 'Body & Mind');
assert.equal(localizeAchievementRarity('legendary', 'de'), 'Legendär');
assert.equal(localizeAchievementRarity('legendary', 'en'), 'Legendary');
assert.equal(localizeAchievementState(true, 'de'), 'Freigeschaltet');
assert.equal(localizeAchievementState(false, 'en'), 'Locked');
assert.equal(localizeAchievementProgress(false, 'de'), 'Fortschritt');
assert.equal(localizeAchievementProgress(true, 'en'), 'Complete');
assert.equal(localizeAchievementReward('de'), 'Belohnung');
assert.equal(localizeAchievementReward('en'), 'Reward');

const invariantHash = await sha256Hex(stableStringify(ACHIEVEMENT_CATALOG.map((item) => ({
  achievement_id: item.achievement_id,
  catalog_version: item.catalog_version,
  section: item.section,
  rarity: item.rarity,
  reward_credits: item.reward_credits,
  title_id: item.title_id,
  rule: item.rule,
  sort_order: item.sort_order,
}))));
assert.equal(invariantHash, '5722c26e802981d024f925b81c8a11ab38b83a09fa0722e34de5366b33f3e4cb', 'Achievement IDs, rules, rewards or unlock relationships changed');

const missionsPageSource = await readFile(new URL('../../src/components/Pages/MissionsPage.tsx', import.meta.url), 'utf8');
assert.match(missionsPageSource, /localizeAchievement\(def,language\)/, 'Achievement cards must use central localization');
assert.match(missionsPageSource, /getLocalizedTitleName\(title\.title_id,language,title\)/, 'Title selector must use central localization');
assert.doesNotMatch(missionsPageSource, /isEn\?def\.title_en:def\.title_de/, 'Achievement cards must not bypass central localization');

const appSource = await readFile(new URL('../../src/App.tsx', import.meta.url), 'utf8');
assert.match(appSource, /getLocalizedTitleName\(title\.title_id, saveLanguage, title\)/, 'Persisted startup language must localize equipped title');
assert.match(appSource, /getLocalizedTitleName\(equipped\.title_id, lang, equipped\)/, 'Language changes must immediately relocalize equipped title');

console.log('ARC Achievement localization tests passed: 78 DE/EN achievements, 13 stable title IDs, dynamic copy, UI switching, reload localization, invariant rules/rewards.');
