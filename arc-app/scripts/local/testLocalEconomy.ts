import assert from 'node:assert/strict';
import { LocalEconomyService } from '../../src/features/economy/localEconomyService';
import { ARC_LOCAL_SHOP_CATALOG } from '../../src/features/economy/localShopCatalog';
import { applyReward, credit, debit, equipItem, purchaseItem, spendForReload } from '../../src/features/economy/localEconomyDomain';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';

{
  const save = createNewArcSaveGame();
  assert.equal(save.economy.credits, 100, 'current new-account starting grant is 100');
  assert.equal(save.economy.transactions[0].type, 'initial_grant');
  credit(save, { type: 'test_credit', source: 'test', amount: 50, referenceId: 'credit:1' });
  assert.equal(save.economy.credits, 150);
  debit(save, { type: 'test_debit', source: 'test', amount: 25, referenceId: 'debit:1' });
  assert.equal(save.economy.credits, 125);
  assert.throws(() => debit(save, { type: 'too_much', source: 'test', amount: 126, referenceId: 'debit:2' }), /insufficient_balance/);
  purchaseItem(save, 'data-scholar', 'purchase:data-scholar');
  assert.equal(save.economy.credits, 25); assert.ok(save.economy.inventoryItemIds.includes('data-scholar'));
  assert.throws(() => purchaseItem(save, 'data-scholar', 'purchase:data-scholar:again'), /already_owned/);
  assert.throws(() => purchaseItem(save, 'unknown'), /not_found/);
  assert.throws(() => purchaseItem(save, 'anim_gold_rain'), /unavailable/);
  equipItem(save, 'data-scholar'); assert.equal(save.economy.equippedSkinId, 'data-scholar');
  equipItem(save, 'color_cyan'); assert.equal(save.economy.equippedItemIds.color, 'color_cyan');
  assert.throws(() => equipItem(save, 'iron-athlete-1'), /not_owned/);
  const firstReward = applyReward(save, 'mission-1', 10, 'mission');
  const duplicateReward = applyReward(save, 'mission-1', 10, 'mission');
  assert.equal(firstReward.id, duplicateReward.id); assert.equal(save.economy.credits, 35);
  spendForReload(save, 'reload-1'); spendForReload(save, 'reload-1');
  assert.equal(save.economy.credits, 34); assert.equal(save.ui.moduleReloadsCountToday, 1);
}


{
  const storage = new MemoryArcSaveStorage(); const repository = new ArcSaveRepository(storage);
  const save = createNewArcSaveGame(); save.economy.credits = 10;
  save.economy.transactions.push({ id: 'adjust', type: 'test', source: 'test', amount: -90,
    balanceBefore: 100, balanceAfter: 10, referenceId: 'adjust', createdAt: new Date().toISOString(), metadata: {} });
  save.economy.processedReferenceIds.push('adjust'); await repository.save(save);
  const service = new LocalEconomyService(repository); const before = await repository.load();
  await assert.rejects(() => service.purchaseItem('data-scholar', 'atomic-fail'), /insufficient_balance/);
  assert.deepEqual(await repository.load(), before, 'failed purchase rolls back debit and inventory');
  await service.applyReward('achievement-1', 150, 'achievement');
  await service.purchaseItem('data-scholar', 'atomic-success'); await service.equipItem('data-scholar');
  const reloaded = await new ArcSaveRepository(storage).load();
  assert.ok(reloaded?.economy.inventoryItemIds.includes('data-scholar'));
  assert.equal(reloaded?.economy.equippedSkinId, 'data-scholar');
}

{
  const storage = new MemoryArcSaveStorage(); const repository = new ArcSaveRepository(storage);
  const source = createNewArcSaveGame(); source.profile.name = 'Preserve'; source.progression.canonicalStats.wissen.value = 42;
  const v3 = structuredClone(source) as unknown as Record<string, any>;
  v3.schemaVersion = 3; v3.economy.credits = 17; v3.economy.transactions = [];
  v3.economy.inventoryItemIds = ['data-scholar']; v3.economy.equippedSkinId = 'data-scholar';
  delete v3.economy.inventory; delete v3.economy.processedReferenceIds; delete v3.economy.processedExternalPurchaseIds;
  await storage.set('save:primary', v3);
  const migrated = await repository.initialize();
  assert.equal(migrated.save.schemaVersion, 6); assert.equal(migrated.save.economy.credits, 17);
  assert.equal(migrated.save.profile.name, 'Preserve'); assert.equal(migrated.save.progression.canonicalStats.wissen.value, 42);
  assert.ok(migrated.save.economy.inventory.some((item) => item.itemId === 'data-scholar'));
  assert.equal((await storage.keys('backup:')).length, 1);
  await repository.backup('manual');
  const corrupt = structuredClone(migrated.save); corrupt.economy.credits = -1;
  await storage.set('save:primary', corrupt);
  const recovered = await new ArcSaveRepository(storage).initialize();
  assert.equal(recovered.source, 'recovered'); assert.equal(recovered.save.economy.credits, 17);
}

// Retired wheel data remains inert and must never invalidate/reset a save.
{
  const storage = new MemoryArcSaveStorage();
  const repository = new ArcSaveRepository(storage);
  const legacy = createNewArcSaveGame();
  const reward = credit(legacy, { type: 'daily_wheel', source: 'local_wheel', amount: 25,
    referenceId: 'daily_wheel:2026-09-08' });
  legacy.economy.wheel = { lastClaimDate: '2026-09-08', claimHistory: [
    { date: '2026-09-08', reward: 25, transactionId: reward.id },
  ] };
  purchaseItem(legacy, 'data-scholar', 'legacy-skin');
  equipItem(legacy, 'data-scholar');
  await repository.save(legacy);
  const restarted = new ArcSaveRepository(storage);
  const loaded = await restarted.initialize();
  assert.equal(loaded.save.saveId, legacy.saveId);
  assert.deepEqual(loaded.save.economy, legacy.economy);
  await restarted.transaction(save => { save.profile.name = 'Still here'; });
  const reloaded = await restarted.load();
  assert.deepEqual(reloaded?.economy, legacy.economy, 'legacy history, Credits, inventory and equipped skin survive normal saves');
  assert.equal(reloaded?.profile.name, 'Still here');
  assert.equal('claimWheelReward' in new LocalEconomyService(restarted), false);
}

assert.equal(ARC_LOCAL_SHOP_CATALOG.filter((item) => item.type === 'skin' && item.available).length, 22);
console.log('ARC local economy/shop tests passed.');
