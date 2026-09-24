import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALL_EXTRA_MODULES } from '../../src/data/extraModules';
import { getLocalizedModuleConfig } from '../../src/data/extraModulesTranslations';

const settingsSource = readFileSync(resolve('src/components/Modals/SettingsModal.tsx'), 'utf8');
const homeSource = readFileSync(resolve('src/components/HUD/HomeProgressDeck.tsx'), 'utf8');
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8');
const gameSource = readFileSync(resolve('src/features/runtime/localGameService.ts'), 'utf8');
const shopSource = readFileSync(resolve('src/components/Modals/ShopModal.tsx'), 'utf8');
const missionSource = readFileSync(resolve('src/components/Pages/MissionsPage.tsx'), 'utf8');

assert.doesNotMatch(settingsSource, /Design & FX|activeTab === 'design'|setActiveTab\('design'\)|INTERFACE_COLOR_PALETTE|UI_ANIMATION_OPTIONS/);
assert.doesNotMatch(appSource, /onToggleDesignColor|onEquipAnimation/);
assert.match(homeSource, /localObjectivesService\.getMissions/);
assert.doesNotMatch(`${homeSource}\n${missionSource}`, /not connected|authoritative progression|server connection|Serververbindung|follow on reconnect/i);
assert.match(appSource, /getLocalizedModuleConfig\(module, lang\)/);

const expected = {
  motivation: ['Motivationssprüche', 'Motivational Quotes'],
  business_ideas: ['Business-Ideen', 'Business Ideas'],
  books: ['Bücher Empfehlungen', 'Book Recommendations'],
  biohacking: ['Biohacking Protocols', 'Biohacking Protocols'],
  stoic_rules: ['Stoische Regeln', 'Stoic Rules'],
} as const;
for (const module of ALL_EXTRA_MODULES) {
  const [de, en] = expected[module.id as keyof typeof expected];
  assert.equal(getLocalizedModuleConfig(module, 'de').title, de);
  assert.equal(getLocalizedModuleConfig(module, 'en').title, en);
  assert.notEqual(getLocalizedModuleConfig(module, 'de').description.length, 0);
  assert.notEqual(getLocalizedModuleConfig(module, 'en').description.length, 0);
}

console.log('ARC Phase 6 manual-QA static/localization tests passed.');

assert.doesNotMatch(shopSource + gameSource, /wheel|glücksrad/i);
