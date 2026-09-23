import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import postcss from 'postcss';
import ts from 'typescript';
import { createServer } from 'vite';
import { CyberHeader } from '../../src/components/CyberHeader';
import { ExtraModuleModal } from '../../src/components/Modals/ExtraModuleModal';
import { ALL_EXTRA_MODULES } from '../../src/data/extraModules';
import { getLocalizedModuleConfig } from '../../src/data/extraModulesTranslations';

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const app = read('src/App.tsx');
const css = postcss.parse(read('src/index.css'));
const rules = (selector: string) => {
  const matches: postcss.Rule[] = [];
  css.walkRules(rule => { if (rule.selectors.includes(selector)) matches.push(rule); });
  return matches;
};
const values = (selector: string, property: string) => rules(selector).flatMap(rule => {
  const result: string[] = [];
  rule.walkDecls(property, decl => { result.push(decl.value); });
  return result;
});

// Check the actual JSX ancestry: every route must live inside the clearance owner.
const tree = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let routeContent: ts.JsxElement | undefined;
function find(node: ts.Node) {
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(prop =>
    ts.isJsxAttribute(prop) && prop.name.getText(tree) === 'className' && prop.initializer?.getText(tree) === '"arc-route-content"')) routeContent = node;
  ts.forEachChild(node, find);
}
find(tree);
assert.ok(routeContent, 'one shared route clearance owner exists');
const routeMarkup = routeContent.getText(tree);
for (const name of ['ProfileSection', 'MissionsPage', 'AppHubPage', 'ShopModal']) assert.ok(routeMarkup.includes(`<${name}`), `${name} is within the shell clearance`);
assert.ok(!routeMarkup.includes('<BottomBar'), 'fixed navigation is outside route content');
for (const selector of ['.arc-destination-page', '.arc-shop-page']) {
  assert.ok(values(selector, 'position').every(value => value === 'relative'), `${selector} uses document scrolling`);
  assert.equal(values(selector, 'inset').length, 0, `${selector} has no device-specific fixed offsets`);
}
assert.deepEqual(values('.arc-route-content', 'padding-bottom'), ['var(--arc-content-bottom-clearance)']);
assert.deepEqual(values(':root', '--arc-content-bottom-clearance'), ['calc(var(--arc-bottom-nav-height) + var(--arc-safe-bottom) + .75rem)']);
assert.deepEqual(values('.arc-v10-dock', 'height'), ['calc(var(--arc-bottom-nav-height) + var(--arc-safe-bottom))']);
assert.ok(values('.arc-v10-topbar', 'padding-block').some(value => value.includes('var(--arc-safe-top)')));
for (const rule of rules('.arc-header-utilities')) assert.ok(!rule.toString().includes('display:none'), 'mobile must not hide header utilities');
assert.deepEqual(values('.arc-module-header', 'grid-template-columns'), ['minmax(0, 1fr) 44px']);
assert.deepEqual(values('.arc-module-actions', 'flex-wrap'), ['wrap']);
assert.deepEqual(values('.arc-module-header', 'flex-shrink'), ['0']);
assert.deepEqual(values('.arc-module-body', 'min-height'), ['0']);
assert.deepEqual(values('.arc-module-body', 'overflow-y'), ['auto']);
assert.deepEqual(values('.arc-module-title', 'overflow-wrap'), ['anywhere']);
assert.ok(values('.arc-module-header', 'position').every(value => value !== 'absolute'));
assert.ok(values('.arc-module-actions', 'position').every(value => value !== 'absolute'));

const noop = () => {};
for (const lang of ['de', 'en'] as const) {
  const header = renderToStaticMarkup(<CyberHeader dateStr="2026-09-22" lang={lang} soundEnabled onSetLanguage={noop} onToggleSound={noop} onOpenCharacterCreation={noop} />);
  assert.match(header, /<span>DE<\/span>/);
  assert.match(header, /<span>EN<\/span>/);
  assert.equal((header.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.match(header, new RegExp(`aria-label="${lang === 'de' ? 'Deutsch' : 'English'}" aria-pressed="true"`));
  for (const moduleConfig of ALL_EXTRA_MODULES) {
    const modal = renderToStaticMarkup(<ExtraModuleModal moduleConfig={moduleConfig} lang={lang} currentCredits={115} reloadsCountToday={0} seenModuleItemIds={{}} onClose={noop} onOpenShop={noop} onPerformReload={() => true} />);
    assert.ok(modal.includes(getLocalizedModuleConfig(moduleConfig, lang).title));
    const moduleHeader = modal.match(/<header class="arc-module-header">([\s\S]*?)<\/header>/)?.[1];
    assert.ok(moduleHeader);
    assert.ok(moduleHeader.includes('115 Credits'));
    assert.ok(moduleHeader.includes(lang === 'de' ? 'Neu laden (1 Cr)' : 'Reload (1 Cr)'));
    assert.equal((moduleHeader.match(/<button/g) ?? []).length, 3, 'close, credits and reload stay in header flow');
    assert.doesNotMatch(moduleHeader, /absolute|pr-52/);
  }
}
for (const file of ['src/components/HUD/ProfileSection.tsx', 'src/components/Modals/ShopModal.tsx']) {
  assert.doesNotMatch(read(file), /characterCode|playerCharacterCode|CYBER-|SYSTEM ID PENDING/);
}
assert.doesNotMatch(app, /playerCharacterCode=|CommunityModal|ChatWindow|supabase/);
assert.match(read('src/components/HUD/CalendarWidget.tsx'), /ARC_GROUP_CALENDARS_ACTIVE = false/);
console.log('Responsive shell structural regressions passed: shared clearance, route ancestry, visible DE/EN, no displayed community code, all module headers. Browser geometry still requires visual QA.');

// The header uses natural document flow, with no measured placeholder.
assert.deepEqual(values('.arc-v10-topbar', 'position'), ['relative']);
const headerSource = read('src/components/CyberHeader.tsx');
assert.doesNotMatch(headerSource, /ResizeObserver|headerRef|arc-header-slot|sticky|fixed/);
assert.equal(values(':root', '--arc-header-height').length, 0);
assert.ok(values('.arc-v10-profile .arc-identity-hero', 'flex-direction').includes('column'));
assert.ok(values('.arc-v10-profile .arc-avatar-frame img', 'object-fit').includes('contain'));
assert.ok(values('.arc-v10-profile .arc-identity-copy h1', 'text-overflow').includes('ellipsis'));
assert.ok(values('.arc-v10-profile .arc-identity-copy h1', 'writing-mode').includes('horizontal-tb'));
const profileSource = read('src/components/HUD/ProfileSection.tsx');
assert.ok(profileSource.indexOf('arc-avatar-frame') < profileSource.indexOf('arc-identity-copy'));
assert.ok(profileSource.indexOf('arc-xp-label') < profileSource.indexOf('arc-level-track'));
assert.ok(profileSource.indexOf('arc-level-track') < profileSource.indexOf('arc-credit-plate'));
console.log('Mobile Overview structure passed: natural document header, portrait/name/XP/Credits hierarchy, uncropped image and horizontal name.');

const settingsSource = read('src/components/Modals/SettingsModal.tsx');
assert.deepEqual(values('.arc-settings-body', 'overflow-y'), ['auto']);
assert.deepEqual(values('.arc-settings-body', 'min-height'), ['0']);
assert.deepEqual(values('.arc-settings-console .arc-settings-navigation', 'margin-inline'), ['0']);
assert.deepEqual(values('.arc-settings-console .arc-settings-navigation', 'overflow-x'), ['auto']);
assert.ok(values('.arc-settings-navigation button', 'flex').includes('0 0 auto'));
assert.deepEqual(values('.arc-settings-task-actions', 'flex-direction'), ['column']);
assert.deepEqual(values('.arc-settings-task-filter', 'grid-template-columns'), ['repeat(3, minmax(0, 1fr))']);
assert.deepEqual(values('.arc-settings-percentage', 'grid-template-columns'), ['minmax(0, 1fr) 4rem auto']);
assert.equal((settingsSource.match(/aria-pressed={activeTab ===/g) ?? []).length, 6);
assert.match(settingsSource, /strip.scrollLeft/);
assert.doesNotMatch(settingsSource, /scrollIntoView/);
assert.ok(settingsSource.indexOf('className="arc-settings-body"') < settingsSource.indexOf('className="arc-settings-footer'));
console.log('Settings layout regressions passed: contained navigation, six selected states, independent body/footer, wrapping task controls.');

// Vite resolves Settings' existing bundled image imports for server rendering.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
const { SettingsModal } = await vite.ssrLoadModule('/src/components/Modals/SettingsModal.tsx');
const { getInitialState } = await vite.ssrLoadModule('/src/utils/storage.ts');
for (const lang of ['de', 'en'] as const) {
  const settings = renderToStaticMarkup(<SettingsModal appState={getInitialState()} lang={lang}
    onSaveProfile={async () => {}} onSaveStats={async () => {}} onSaveQuoteSettings={noop}
    onSaveBottomModules={noop} onClose={noop} onExportBackup={async () => {}}
    onImportBackup={async () => {}} onRequestReset={noop} onReplayIntroduction={noop} />);
  assert.equal((settings.match(/aria-pressed="(?:true|false)"/g) ?? []).length, 6);
  assert.equal((settings.match(/aria-pressed="true"/g) ?? []).length, 1);
  for (const label of (lang === 'de'
    ? ['SYSTEM EINSTELLUNGEN', 'Statuswerte &amp; Aufgaben', 'Eigene Aufgabe', 'Abbrechen', 'ÄNDERUNGEN SPEICHERN', 'App-Einführung erneut anzeigen']
    : ['SYSTEM SETTINGS', 'Attributes &amp; Tasks', 'Add Custom Task', 'Cancel', 'SAVE CHANGES', 'Replay app introduction'])) assert.ok(settings.includes(label), label);
}
console.log('DE/EN Settings rendering passed: categories, custom-task action, replay, Cancel and Save.');

} finally { await vite.close(); }

// Profile cleanup must not remove saved avatar/frame data or purchased cosmetics.
assert.doesNotMatch(settingsSource, /AVATAR_PRESETS|customAvatarInput|Standard-Profilbilder|Free Standard Avatars|showAvatarFrame|Ranking-Profilrahmen|Show Ranking Profile Frame/);
assert.match(settingsSource, /if \(ownedSkins.length === 0\) return null/);
assert.match(settingsSource, /appState.ownedSkinIds\?\.includes\(s.id\)/);
assert.match(settingsSource, /setProfile\(\{ \.\.\.profile, avatarUrl: skin.avatarUrl \|\| profile.avatarUrl \}\)/);
assert.match(read('src/types.ts'), /showAvatarFrame\?: boolean/);
assert.match(read('src/data/avatars.ts'), /LEGACY_AVATAR_URLS/);
assert.equal((read('src/data/avatars.ts').match(/import .*Img from/g) ?? []).length, 6);
assert.doesNotMatch(read('src/utils/i18n.ts'), /freeAvatars:/);
console.log('Profile cleanup passed: removed legacy controls, owned-skin selection retained, compatibility fields and six assets retained.');
