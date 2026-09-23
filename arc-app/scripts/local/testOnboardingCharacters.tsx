import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CharacterCreation } from '../../src/components/Onboarding/CharacterCreation';
import { ONBOARDING_CHARACTERS } from '../../src/data/onboardingCharacters';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { initializeCharacter } from '../../src/features/progression/localProgressionDomain';

assert.deepEqual(ONBOARDING_CHARACTERS.map(c => c.gender), ['m', 'f']);
for (const lang of ['de', 'en'] as const) {
  for (const character of ONBOARDING_CHARACTERS) {
    const save = createNewArcSaveGame(lang);
    const markup = renderToStaticMarkup(<CharacterCreation initialProfile={{ ...save.profile, gender: character.gender }} initialStats={[]} lang={lang} onComplete={() => {}} />);
    assert.equal((markup.match(/type="radio"/g) ?? []).length, 2);
    assert.equal((markup.match(/checked=""/g) ?? []).length, 1);
    assert.match(markup, new RegExp(`<input(?=[^>]*value="${character.gender}")(?=[^>]*checked="")[^>]*>`));
    for (const choice of ONBOARDING_CHARACTERS) {
      assert.ok(markup.includes(choice.labels[lang]));
      assert.ok(markup.includes(choice.url));
    }
    assert.doesNotMatch(markup, /anime|superheroes|comic|Shadow Monarch|Kitsune|category/i);
    const economyBefore = structuredClone(save.economy);
    initializeCharacter(save, { profile: { name: 'Operator', gender: character.gender, avatarUrl: character.url }, stats: [{ statId: 'wissen', startValue: 0 }], timezone: 'UTC' });
    const storage = new MemoryArcSaveStorage();
    await new ArcSaveRepository(storage).save(save);
    const reloaded = await new ArcSaveRepository(storage).load();
    assert.equal(reloaded?.profile.gender, character.gender);
    assert.equal(reloaded?.profile.avatarUrl, character.url);
    assert.deepEqual(reloaded?.economy, economyBefore);
  }
}
for (const character of ONBOARDING_CHARACTERS) {
  const asset = await readFile(new URL(`../../public${character.url}`, import.meta.url), 'utf8');
  assert.match(asset, /viewBox="0 0 240 280"/);
  assert.doesNotMatch(asset, /<image|<script|href=/);
}
const legacy = createNewArcSaveGame('de');
initializeCharacter(legacy, { profile: { name: 'Legacy', gender: 'd', avatarUrl: '/assets/anime_male_avatar_1786203723233.jpg' }, stats: [{ statId: 'wissen', startValue: 20 }], timezone: 'UTC' });
legacy.economy.inventoryItemIds = ['skin-local'];
legacy.economy.inventory = [{ itemId: 'skin-local', itemType: 'skin', acquiredAt: new Date().toISOString(), source: 'test', referenceId: 'inventory:test', metadata: {} }];
const storage = new MemoryArcSaveStorage();
await new ArcSaveRepository(storage).save(legacy);
const loaded = await new ArcSaveRepository(storage).load();
assert.deepEqual(loaded?.profile, legacy.profile);
assert.deepEqual(loaded?.economy, legacy.economy);
console.log('Onboarding characters passed: two localized cards, selected gender, offline assets, persisted profiles, legacy saves and inventory.');
