/** Release 1 regression: retired IAP must stay absent; its old saves remain valid. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShopModal } from '../../src/components/Modals/ShopModal';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { LocalEconomyService } from '../../src/features/economy/localEconomyService';
import { LocalGameService } from '../../src/features/runtime/localGameService';

const read = (file: string) => readFileSync(resolve(file), 'utf8');
for (const file of ['package.json', 'package-lock.json', 'bun.lock', 'android/app/capacitor.build.gradle', 'android/capacitor.settings.gradle']) {
  assert.doesNotMatch(read(file), /capacitor-plugin-cdv-purchase/);
}
function checkRuntime(directory: string) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${item.name}`;
    if (item.isDirectory()) checkRuntime(path);
    else if (/\.(ts|tsx)$/.test(path)) assert.doesNotMatch(read(path), /VITE_ARC_IAP|localIapService|ArcNativeIapPort|applyVerifiedExternalPurchase|capacitor-plugin-cdv-purchase/);
  }
}
checkRuntime('src');
for (const file of ['src/services/localIapService.ts', 'src/features/economy/localIapService.ts', 'src/features/economy/arcIapCatalog.ts', 'src/features/native/capacitorStoreIapAdapter.ts']) assert.equal(existsSync(file), false);
for (const lang of ['de', 'en']) {
  const html = renderToStaticMarkup(React.createElement(ShopModal, {
    lang, currentCredits: 600, ownedSkinIds: ['data-scholar'], equippedSkinId: 'data-scholar',
    onBuySkin: () => true, onEquipSkin: () => {}, onClose: () => {},
  }));
  assert.doesNotMatch(html, /Credit-Pakete|Credit packages|Top Up|REAL MONEY|Native app required|Credit-Vorschau|€|\$/);
  assert.match(html, /600/);
  assert.match(html, /Data Scholar/);
  assert.match(html, /Credits/);
}
for (const schemaVersion of [5, 6]) {
  const storage = new MemoryArcSaveStorage();
  const legacy = createNewArcSaveGame();
  assert.equal(legacy.economy.credits, 100, 'free starting grant remains');
  legacy.economy.credits = 600;
  legacy.economy.transactions.push({ id: 'legacy-store-tx', type: 'iap_credit_grant', source: 'ios',
    amount: 500, balanceBefore: 100, balanceAfter: 600, referenceId: 'iap:ios:legacy-tx',
    externalPurchaseId: 'legacy-tx', createdAt: '2026-09-01T12:00:00Z',
    metadata: { productId: 'retired-product', transactionId: 'legacy-tx', consumed: true } });
  legacy.economy.processedReferenceIds.push('iap:ios:legacy-tx');
  legacy.economy.processedExternalPurchaseIds.push('legacy-tx');
  await storage.set('save:primary', { ...legacy, schemaVersion });
  const repository = new ArcSaveRepository(storage);
  const initialized = await repository.initialize();
  assert.equal(initialized.save.saveId, legacy.saveId);
  assert.deepEqual(initialized.save.economy, legacy.economy, 'loading/migration does not replay or erase purchases');
  const service = new LocalEconomyService(repository);
  assert.equal('applyVerifiedExternalPurchase' in service, false);
  await service.applyReward('gameplay-proof', 25, 'mission');
  await service.purchaseItem('data-scholar');
  await service.equipItem('data-scholar');
  await service.spendForReload('gameplay-reload');
  const spent = (await repository.load())!;
  assert.equal(spent.economy.credits, 524);
  assert.equal(spent.economy.equippedSkinId, 'data-scholar');
  assert.ok(spent.economy.inventoryItemIds.includes('data-scholar'));
  assert.deepEqual(spent.economy.transactions.find(t => t.id === 'legacy-store-tx'), legacy.economy.transactions[1]);
  await repository.import(await repository.export());
  const restarted = new ArcSaveRepository(storage);
  assert.deepEqual((await restarted.load())?.economy, spent.economy, 'backup/import and restart preserve balance and inventory');
  const reset = await new LocalGameService(restarted).resetCharacter();
  assert.deepEqual(reset.economy, spent.economy, 'character reset preserves balance without another starting grant');
}
console.log('No-IAP release passed: no purchase runtime/plugin, DE/EN Shop, free grant, gameplay spending, legacy v5/v6 balances, backups and reset.');
