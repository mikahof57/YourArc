import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createNewArcSaveGame, ArcSaveRepository } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { initializeCharacter, resetCharacterProgression } from '../../src/features/progression/localProgressionDomain';
import { LocalProfileService } from '../../src/features/profile/localProfileService';
import { shouldShowIntroduction, dismissIntroduction } from '../../src/features/introduction/introductionPolicy';
import { AppIntroduction, IntroductionVisual, INTRODUCTION_STEPS } from '../../src/components/Onboarding/AppIntroduction';
import { TRANSLATIONS, t } from '../../src/utils/i18n';

const createCharacter = (save: ReturnType<typeof createNewArcSaveGame>) => initializeCharacter(save, {
  profile: { name: 'Operator', gender: 'f', avatarUrl: '/assets/characters/arc-female.svg' },
  stats: [{ statId: 'wissen', startValue: 0 }], timezone: 'UTC', now: new Date('2026-09-22T12:00:00Z'),
});
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

for (const action of ['finish', 'skip'] as const) {
  const save = createNewArcSaveGame('de');
  assert.equal(save.economy.credits, 100);
  assert.equal(save.settings.introductionState, 'eligible');
  assert.equal(shouldShowIntroduction(save), false, 'never before creation');
  createCharacter(save);
  assert.equal(shouldShowIntroduction(save), true, 'first character makes tutorial pending');
  save.economy.inventoryItemIds = ['skin-local'];
  save.economy.inventory = [{ itemId: 'skin-local', itemType: 'skin', acquiredAt: new Date().toISOString(), source: 'test', referenceId: 'intro:test', metadata: {} }];
  const storage = new MemoryArcSaveStorage();
  const repo = new ArcSaveRepository(storage);
  await repo.save(save);
  const restarted = await new ArcSaveRepository(storage).load();
  assert.ok(restarted && shouldShowIntroduction(restarted), 'unfinished tutorial survives restart');
  const before = structuredClone(restarted);
  const service = new LocalProfileService(repo);
  await dismissIntroduction('automatic', () => service.updateSettings({ introductionState: 'completed' }));
  const completed = await new ArcSaveRepository(storage).load();
  assert.ok(completed);
  assert.equal(shouldShowIntroduction(completed), false, `${action} persists across restart`);
  assert.equal(completed.settings.introductionState, 'completed');
  const expected = structuredClone(before);
  expected.settings.introductionState = 'completed';
  // Repository and settings timestamps may change; everything else must remain byte-for-byte equivalent.
  expected.updatedAt = completed.updatedAt;
  expected.localStateMeta.settingsUpdatedAt = completed.localStateMeta.settingsUpdatedAt;
  assert.deepEqual(completed, expected, `${action} does not change gameplay/economy/inventory`);
  const backup = await repo.export();
  const importedRepo = new ArcSaveRepository(new MemoryArcSaveStorage());
  await importedRepo.import(backup);
  assert.equal(shouldShowIntroduction((await importedRepo.load())!), false, 'backup retains completion');
  let writes = 0;
  await dismissIntroduction('replay', async () => { writes++; });
  assert.equal(writes, 0, 'manual replay never writes to save');
  assert.deepEqual(await repo.load(), completed);
  resetCharacterProgression(completed);
  assert.equal(shouldShowIntroduction(completed), false, 'reset alone never opens tutorial');
  createCharacter(completed);
  assert.equal(shouldShowIntroduction(completed), true, 'recreation arms tutorial again');
  await repo.save(completed);
  await service.updateSettings({ language: 'en' });
  assert.equal((await repo.load())?.settings.introductionState, 'pending');
  await dismissIntroduction('automatic', () => service.updateSettings({ introductionState: 'completed' }));
  await service.updateSettings({ language: 'de' });
  const later = (await repo.load())!;
  assert.equal(shouldShowIntroduction(later), false, 'language change cannot rearm completed tutorial');
  resetCharacterProgression(later); createCharacter(later);
  assert.equal(shouldShowIntroduction(later), true, 'another new character later rearms tutorial');
  await repo.save(later);
  await importedRepo.import(await repo.export());
  assert.equal(shouldShowIntroduction((await importedRepo.load())!), false, 'import cannot replay historical pending state');
}

const atomicRepo = new ArcSaveRepository(new MemoryArcSaveStorage());
await atomicRepo.save(createNewArcSaveGame());
const beforeFailure = await atomicRepo.load();
await assert.rejects(() => atomicRepo.transaction(save => {
  createCharacter(save);
  throw new Error('creation_failed');
}), /creation_failed/);
assert.deepEqual(await atomicRepo.load(), beforeFailure, 'failed creation cannot leave a pending tutorial');
const committed = await atomicRepo.transaction(save => createCharacter(save));
assert.equal(shouldShowIntroduction(committed), true, 'successful transaction returns committed tutorial state');
assert.equal(shouldShowIntroduction((await atomicRepo.load())!), true);

const interrupted = createNewArcSaveGame(); createCharacter(interrupted);
resetCharacterProgression(interrupted); createCharacter(interrupted);
assert.equal(shouldShowIntroduction(interrupted), true, 'successful recreation after interrupted tutorial rearms it');

const old = createNewArcSaveGame(); delete old.settings.introductionState;
createCharacter(old);
delete old.settings.introductionState; // Established save written before the tutorial existed.
assert.equal(shouldShowIntroduction(old), false);
old.economy.inventoryItemIds = ['skin-local'];
old.economy.inventory = [{ itemId: 'skin-local', itemType: 'skin', acquiredAt: new Date().toISOString(), source: 'test', referenceId: 'legacy:test', metadata: {} }];
const oldRepo = new ArcSaveRepository(new MemoryArcSaveStorage());
const oldSaved = await oldRepo.save(old);
assert.deepEqual(await oldRepo.load(), oldSaved, 'established saves without field load unchanged');
resetCharacterProgression(old); createCharacter(old);
assert.equal(shouldShowIntroduction(old), true, 'legacy user completing a new character gets tutorial');
const v0 = await new ArcSaveRepository(new MemoryArcSaveStorage()).migrate({ schemaVersion: 0, language: 'en' });
assert.equal(v0.settings.introductionState, undefined, 'legacy factory migration must not accidentally opt in');
const legacyStorage = { length: 1, key: () => 'arc_app_system_state_v1', getItem: () => JSON.stringify({ profile: { name: 'Legacy' } }) };
const imported = await new ArcSaveRepository(new MemoryArcSaveStorage()).initialize({ legacyStorage });
assert.equal(imported.save.settings.introductionState, undefined, 'legacy browser import must not opt in');
await assert.rejects(() => dismissIntroduction('automatic', async () => { throw new Error('storage unavailable'); }), /storage unavailable/);

assert.equal(INTRODUCTION_STEPS.length, 6);
const introKeys = Object.keys(TRANSLATIONS.de).filter(key => key.startsWith('intro'));
assert.deepEqual(Object.keys(TRANSLATIONS.en).filter(key => key.startsWith('intro')), introKeys);
for (const lang of ['de', 'en'] as const) {
  for (const key of introKeys) assert.ok(t(key as keyof typeof TRANSLATIONS.de, lang).length > 0);
  for (let step = 0; step < 6; step++) {
    const visual = renderToStaticMarkup(<IntroductionVisual step={step} lang={lang} />);
    assert.ok(visual.length > 100);
    assert.doesNotMatch(visual, /<button|src="https?:\/\//, 'visuals never navigate, spend or load remote assets');
  }
  const modal = renderToStaticMarkup(<AppIntroduction lang={lang} onDismiss={async () => {}} />);
  assert.match(modal, /aria-modal="true"/);
  assert.ok(modal.includes(t('introSkip', lang)) && modal.includes(t('introNext', lang)));
}
assert.match(read('src/components/Modals/SettingsModal.tsx'), /onClick=\{onReplayIntroduction\}/);
const app = read('src/App.tsx');
assert.match(app, /onReplayIntroduction=\{\(\) => \{ setIsSettingsOpen\(false\); setActiveDestination\('home'\); setIntroductionMode\('replay'\)/);
assert.match(app, /inert=\{introductionMode !== null\}/);
assert.match(app, /shouldShowIntroduction\(confirmed\)/);
assert.match(app, /shouldShowIntroduction\(save\)/);
const ui = read('src/components/Onboarding/AppIntroduction.tsx');
assert.match(ui, /step === 5 \? void dismiss\(\)/);
assert.match(ui, /introSkip/);
assert.match(ui, /document.body.style.overflow = 'hidden'/);
console.log('App introduction passed: first-time trigger, legacy compatibility, finish/skip/restart, backup, reset, read-only replay, save isolation, DE/EN and six inert visuals.');
