import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AVAILABLE_SKINS, RETIRED_LEGACY_SKIN_IDS, SKIN_COLLECTIONS } from '../../src/data/skinData';

const shop = readFileSync(resolve('src/components/Modals/ShopModal.tsx'), 'utf8');
const app = readFileSync(resolve('src/App.tsx'), 'utf8');

assert.equal(AVAILABLE_SKINS.length, 22);
assert.equal(new Set(AVAILABLE_SKINS.map((skin) => skin.id)).size, 22);
assert.equal(new Set(AVAILABLE_SKINS.map((skin) => skin.order)).size, 22);
assert.deepEqual([...AVAILABLE_SKINS].map((skin) => skin.order), Array.from({ length: 22 }, (_, index) => index + 1));
assert.deepEqual(SKIN_COLLECTIONS.map((collection) => collection.id), ['entry', 'standard', 'premium', 'epic']);
assert.deepEqual(
  Object.fromEntries(SKIN_COLLECTIONS.map(({ id }) => [id, AVAILABLE_SKINS.filter((skin) => skin.collection === id).length])),
  { entry: 3, standard: 5, premium: 7, epic: 7 },
);

for (const skin of AVAILABLE_SKINS) {
  assert(existsSync(resolve('public', skin.avatarUrl.replace(/^\//, ''))), `missing asset: ${skin.avatarUrl}`);
}
assert.equal(RETIRED_LEGACY_SKIN_IDS.size, 19);
for (const retiredId of [...RETIRED_LEGACY_SKIN_IDS, 'title_teamleader', 'title_zenmaster', 'design_customizer']) {
  assert(!AVAILABLE_SKINS.some((skin) => skin.id === retiredId));
}

const expected = new Map([
  ['kinetic-phantom-2', ['standard', 'standard', 175]],
  ['urban-executive', ['premium', 'premium', 350]],
  ['fortune-sovereign-1', ['epic', 'epic', 1000]],
  ['fortune-sovereign-2', ['epic', 'epic', 1000]],
] as const);
for (const [id, [tier, collection, price]] of expected) {
  const skin = AVAILABLE_SKINS.find((candidate) => candidate.id === id);
  assert.deepEqual(skin && [skin.tier, skin.collection, skin.price], [tier, collection, price]);
}
assert.equal(AVAILABLE_SKINS.filter((skin) => skin.collection === 'entry' && skin.price <= 100).length, 3);

assert.doesNotMatch(app, /startCreditCheckout|onAddCredits=/);
assert.doesNotMatch(shop, /Jetzt Kostenpflichtig Kaufen|onAddCredits|grantedCredits/);
assert.match(shop, /Credit purchases require the native mobile app/);
assert.match(shop, /onPurchaseCredits\(productId\)/);
assert.match(shop, /displayPrice \?\? '—'/);
assert.match(app, /await localGameService\.purchaseAndEquip\(skin\.id\)/);
assert.match(app, /await localGameService\.claimWheel\(today\)/);
assert.doesNotMatch(app, /purchaseStoreItem|claimDailyWheel|startCreditCheckout/);
assert.match(app, /if \(!appState\.ownedSkinIds\?\.includes\(skin\.id\)\) return/);

console.log('Shop/economy catalog and static security tests passed.');
