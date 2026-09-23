import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppHubPage } from '../../src/components/Pages/AppHubPage';
import {
  ARC_APP_HUB_CATALOG_SCHEMA_VERSION,
  ARC_COMPANION_APP_CATALOG,
  applyCompanionRuntimeState,
  localizeCompanionApp,
  validateAppHubCatalog,
  type ArcCompanionAppDefinition,
} from '../../src/features/appHub/appHubCatalog';
import { LocalAppHubService, type ArcCompanionRuntimePort } from '../../src/features/appHub/localAppHubService';
import { createEmptyCompanionBridgeState } from '../../src/features/companion/companionPolicy';

const canonicalStats = ['wissen', 'muskeln', 'geist', 'beweglichkeit', 'business', 'geld'];
assert.equal(ARC_COMPANION_APP_CATALOG.length, 6);
assert.deepEqual(ARC_COMPANION_APP_CATALOG.map((app) => app.associatedStat), canonicalStats);
assert.deepEqual(ARC_COMPANION_APP_CATALOG.map((app) => app.sortOrder), [1, 2, 3, 4, 5, 6]);
assert.ok(ARC_COMPANION_APP_CATALOG.every((app) => app.status === 'coming_soon'));
assert.ok(ARC_COMPANION_APP_CATALOG.every((app) => !app.available && !app.installed && !app.connected));
assert.ok(ARC_COMPANION_APP_CATALOG.every((app) => app.deepLink === null && app.platformIdentifiers === null));
assert.ok(ARC_COMPANION_APP_CATALOG.every((app) => app.schemaVersion === ARC_APP_HUB_CATALOG_SCHEMA_VERSION));
assert.equal(new Set(ARC_COMPANION_APP_CATALOG.map((app) => app.slotId)).size, 6);
assert.equal(new Set(ARC_COMPANION_APP_CATALOG.map((app) => app.appId)).size, 6);
assert.doesNotThrow(() => validateAppHubCatalog(ARC_COMPANION_APP_CATALOG));
assert.throws(() => validateAppHubCatalog(ARC_COMPANION_APP_CATALOG.slice(0, 5)), /requires_six_slots/);

const first = ARC_COMPANION_APP_CATALOG[0];
assert.equal(localizeCompanionApp(first, 'de').displayName, 'Begleit-App Slot 01');
assert.equal(localizeCompanionApp(first, 'en').displayName, 'Companion App Slot 01');
assert.match(localizeCompanionApp(first, 'de').shortDescription, /Wissen/);
assert.match(localizeCompanionApp(first, 'en').shortDescription, /knowledge/);

const service = new LocalAppHubService();
assert.equal(service.getApps().length, 6);
assert.equal(service.getAppById(first.appId)?.slotId, first.slotId);
assert.equal(service.getAppsByStatus('coming_soon').length, 6);
assert.equal(await service.openCompanionApp(first.appId), false);
await assert.rejects(() => service.markInstalled(first.appId), /companion_unavailable/);

const runtimeCalls: string[] = [];
const runtime: ArcCompanionRuntimePort = {
  async markInstalled(appId) { runtimeCalls.push(`installed:${appId}`); },
  async markConnected(appId) { runtimeCalls.push(`connected:${appId}`); },
  async markDisconnected(appId) { runtimeCalls.push(`disconnected:${appId}`); },
  async updateLocalCompanionState(appId) { runtimeCalls.push(`state:${appId}`); },
  async openCompanionApp(app) { runtimeCalls.push(`open:${app.appId}`); return true; },
};
const availableApp: ArcCompanionAppDefinition = { ...structuredClone(first), status: 'available', available: true };
const futureService = new LocalAppHubService([availableApp], runtime);
await futureService.markInstalled(availableApp.appId);
await futureService.markConnected(availableApp.appId);
await futureService.markDisconnected(availableApp.appId);
await futureService.updateLocalCompanionState(availableApp.appId, { local: true });
assert.equal(await futureService.openCompanionApp(availableApp.appId), true);
assert.deepEqual(runtimeCalls, [
  `installed:${availableApp.appId}`,
  `connected:${availableApp.appId}`,
  `disconnected:${availableApp.appId}`,
  `state:${availableApp.appId}`,
  `open:${availableApp.appId}`,
]);

const persistedStates = createEmptyCompanionBridgeState().apps;
persistedStates[0].installed = true;
assert.equal(applyCompanionRuntimeState(first, persistedStates[0]).status, 'coming_soon', 'production Coming Soon cannot be overridden by local state');
assert.equal(applyCompanionRuntimeState(availableApp, persistedStates[0]).status, 'installed');
persistedStates[0].connected = true;
assert.equal(applyCompanionRuntimeState(availableApp, persistedStates[0]).status, 'connected');

const lifecycleApps = ARC_COMPANION_APP_CATALOG.map((app, index) => ({
  ...structuredClone(app),
  status: (['coming_soon', 'available', 'installed', 'connected'][index] ?? 'coming_soon') as ArcCompanionAppDefinition['status'],
  available: index > 0 && index < 4,
  installed: index > 1 && index < 4,
  connected: index === 3,
}));
const deMarkup = renderToStaticMarkup(React.createElement(AppHubPage, { lang: 'de', apps: lifecycleApps }));
const enMarkup = renderToStaticMarkup(React.createElement(AppHubPage, { lang: 'en', apps: lifecycleApps }));
const persistedMarkup = renderToStaticMarkup(React.createElement(AppHubPage, {
  lang: 'en', apps: [availableApp], companionStates: persistedStates,
}));
for (const status of ['coming_soon', 'available', 'installed', 'connected']) assert.match(enMarkup, new RegExp(`status-${status}`));
assert.match(deMarkup, /Demnächst|DEMÄCHST/);
assert.match(enMarkup, /COMING SOON/);
assert.equal((enMarkup.match(/data-app-id=/g) ?? []).length, 6);
assert.equal((enMarkup.match(/disabled=""/g) ?? []).length, 6);
assert.match(persistedMarkup, /status-connected/, 'controlled persisted state renders a future real connection');

const appHubSource = readFileSync(resolve('src/components/Pages/AppHubPage.tsx'), 'utf8');
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8');
const bottomBarSource = readFileSync(resolve('src/components/HUD/BottomBar.tsx'), 'utf8');
assert.doesNotMatch(appHubSource, /Community|Supabase|auth\.|fetch\(|https?:\/\//i);
assert.doesNotMatch(appHubSource, /not part of this migration|nicht Teil dieser Migrationsphase/i);
assert.match(appSource, /<AppHubPage lang=\{lang\}/);
assert.match(bottomBarSource, /id: 'appHub'/);
assert.doesNotMatch(appSource, /AppHubPlaceholder/);

console.log('ARC local App Hub tests passed: six slots, lifecycle model, localization, navigation, offline safety.');
