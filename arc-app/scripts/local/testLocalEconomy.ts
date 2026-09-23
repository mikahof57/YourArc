import assert from 'node:assert/strict';
import { LocalEconomyService } from '../../src/features/economy/localEconomyService';
import { ARC_LOCAL_SHOP_CATALOG } from '../../src/features/economy/localShopCatalog';
import { applyReward, applyVerifiedExternalPurchase, claimWheelReward, credit, debit, equipItem, purchaseItem, spendForReload } from '../../src/features/economy/localEconomyDomain';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import { LocalGameService } from '../../src/features/runtime/localGameService';
import { getWheelTargetSliceDegree } from '../../src/components/Modals/ShopModal';
import { ARC_IAP_PRODUCT_CATALOG } from '../../src/features/economy/arcIapCatalog';

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
  const save = createNewArcSaveGame();
  const first = claimWheelReward(save, '2026-09-08', 0.005); assert.equal(first.reward, 100);
  assert.throws(() => claimWheelReward(save, '2026-09-08', 0.2), /already_claimed/);
  assert.equal(claimWheelReward(save, '2026-09-09', 0.05).reward, 25);
  assert.equal(claimWheelReward(save, '2026-09-10', 0.2).reward, 5);
  assert.equal(claimWheelReward(save, '2026-09-11', 0.9).reward, 0);
  const product = ARC_IAP_PRODUCT_CATALOG[0] as { appleProductId: string | null };
  product.appleProductId = 'test.arc.credits.100';
  const purchase = { externalPurchaseId: 'apple-tx-1', productId: 'test.arc.credits.100',
    platform: 'ios' as const, purchaseTimestamp: '2026-09-08T12:00:00.000Z' };
  const tx = applyVerifiedExternalPurchase(save, purchase);
  const retry = applyVerifiedExternalPurchase(save, purchase);
  assert.equal(tx.id, retry.id); assert.equal(save.economy.processedExternalPurchaseIds.length, 1);
  assert.equal(tx.amount, 100, 'credit amount comes from trusted ARC product mapping');
  product.appleProductId = null;
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

for (const scenario of [
  { day: '2026-10-01', roll: 0.005, reward: 100, slice: 30 },
  { day: '2026-10-02', roll: 0.05, reward: 25, slice: 150 },
  { day: '2026-10-03', roll: 0.2, reward: 5, slice: 270 },
  { day: '2026-10-04', roll: 0.9, reward: 0, slice: 90 },
]) {
  const storage = new MemoryArcSaveStorage();
  const repository = new ArcSaveRepository(storage);
  const initial = createNewArcSaveGame();
  await repository.save(initial);
  const game = new LocalGameService(repository);
  const claimed = await game.claimWheel(scenario.day, scenario.roll);
  assert.equal(claimed.result.reward, scenario.reward, 'the visual result uses the settled reward');
  assert.equal(getWheelTargetSliceDegree(claimed.result.reward), scenario.slice, 'the wheel lands on the settled reward slice');
  assert.equal(claimed.result.balance, initial.economy.credits + scenario.reward);
  assert.equal(claimed.save.economy.credits, initial.economy.credits + scenario.reward, 'Spin has no fixed 10-credit grant');
  const wheelTransactions = claimed.save.economy.transactions.filter((entry) => entry.referenceId === `daily_wheel:${scenario.day}`);
  assert.equal(wheelTransactions.length, scenario.reward > 0 ? 1 : 0);
  if (scenario.reward > 0) {
    assert.equal(wheelTransactions[0].amount, scenario.reward);
    assert.equal(wheelTransactions[0].balanceAfter, claimed.result.balance);
  }
  assert.deepEqual(claimed.save.economy.wheel.claimHistory.filter((entry) => entry.date === scenario.day).map((entry) => entry.reward), [scenario.reward]);
  await assert.rejects(() => game.claimWheel(scenario.day, scenario.roll), /already_claimed/);
  const restarted = new LocalGameService(new ArcSaveRepository(storage));
  await assert.rejects(() => restarted.claimWheel(scenario.day, scenario.roll), /already_claimed/);
  const persisted = await repository.load();
  assert.equal(persisted?.economy.credits, initial.economy.credits + scenario.reward);
  assert.equal(persisted?.economy.wheel.claimHistory.filter((entry) => entry.date === scenario.day).length, 1);
}

assert.equal(ARC_LOCAL_SHOP_CATALOG.filter((item) => item.type === 'skin' && item.available).length, 22);
console.log('ARC local economy/shop tests passed.');
