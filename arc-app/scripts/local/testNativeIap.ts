import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARC_IAP_PRODUCT_CATALOG } from '../../src/features/economy/arcIapCatalog';
import { LocalIapService, type ArcIapRuntime } from '../../src/features/economy/localIapService';
import { LocalEconomyService } from '../../src/features/economy/localEconomyService';
import { ArcSaveRepository, createNewArcSaveGame } from '../../src/features/savegame/arcSaveRepository';
import { MemoryArcSaveStorage } from '../../src/features/savegame/arcSaveStorage';
import type { ArcNativePurchaseResult, ArcPlatform } from '../../src/features/native/nativeRuntimeTypes';

const expectedPackages = [
  ['credits_100', 100, 0.99, 'standard'],
  ['credits_500', 500, 3.99, 'popular'],
  ['credits_1500', 1500, 9.99, 'best-value'],
] as const;
assert.deepEqual(
  ARC_IAP_PRODUCT_CATALOG.map((product) => [product.internalProductId, product.credits, product.targetLaunchPrice.amount, product.positioning]),
  expectedPackages,
);
assert.ok(ARC_IAP_PRODUCT_CATALOG.every((product) => product.targetLaunchPrice.currency === 'EUR'));

const products = ARC_IAP_PRODUCT_CATALOG as unknown as Array<{ internalProductId: string; appleProductId: string | null; googleProductId: string | null; credits: number }>;
for (const product of products) {
  product.appleProductId = `test.apple.${product.internalProductId}`;
  product.googleProductId = `test.google.${product.internalProductId}`;
}

class ControlledIapRuntime implements ArcIapRuntime {
  available = true;
  next: ArcNativePurchaseResult = { productId: '', state: 'cancelled' };
  reconciliation: ArcNativePurchaseResult[] = [];
  finishes: string[] = [];
  failFinish = false;
  failStore = false;
  constructor(private readonly value: ArcPlatform) {}
  platform() { return this.value; }
  capabilities() { return { iap: this.available }; }
  async loadIapProducts(ids: readonly string[]) {
    if (this.failStore) throw new Error('offline');
    return ids.map((id) => ({ id, displayName: `Store ${id}`, description: `Native ${id}`, displayPrice: '$0.99', currencyCode: 'USD' }));
  }
  async purchaseIapProduct(productId: string) {
    if (this.failStore) throw new Error('arc_iap_offline');
    return { ...this.next, productId: this.next.productId || productId };
  }
  async reconcileIapPurchases() { if (this.failStore) throw new Error('offline'); return this.reconciliation; }
  async finishIapPurchase(result: ArcNativePurchaseResult) {
    if (this.failFinish) throw new Error('finish interrupted');
    this.finishes.push(result.externalPurchaseId!);
  }
}

async function setup(platform: ArcPlatform = 'ios') {
  const repository = new ArcSaveRepository(new MemoryArcSaveStorage());
  await repository.save(createNewArcSaveGame('en'));
  const runtime = new ControlledIapRuntime(platform);
  return { repository, runtime, service: new LocalIapService(runtime, new LocalEconomyService(repository)) };
}

for (const platform of ['ios', 'android'] as const) {
  const { service } = await setup(platform);
  const loaded = await service.loadProducts('en');
  assert.equal(loaded.length, 3); assert.ok(loaded.every((item) => item.available && item.displayPrice === '$0.99'));
  assert.deepEqual(loaded.map((item) => item.positioning), ['standard', 'popular', 'best-value']);
}

{
  const { repository, runtime, service } = await setup();
  runtime.next = { productId: 'test.apple.credits_100', state: 'confirmed', externalPurchaseId: 'tx-100',
    transactionId: 'tx-100', purchaseTimestamp: '2026-09-10T10:00:00.000Z' };
  const outcome = await service.purchase('credits_100');
  assert.equal(outcome.state, 'success');
  if (outcome.state === 'success') { assert.equal(outcome.creditsAdded, 100); assert.equal(outcome.balance, 200); }
  assert.equal((await repository.load())!.economy.transactions.at(-1)!.amount, 100);
  assert.deepEqual(runtime.finishes, ['tx-100']);
  await assert.rejects(() => service.purchase('unknown'), /unknown_product/);

  runtime.reconciliation = [runtime.next, runtime.next];
  await service.reconcile();
  assert.equal((await repository.load())!.economy.credits, 200, 'duplicate callback/reconciliation grants once');
  const restarted = new LocalIapService(runtime, new LocalEconomyService(repository));
  await restarted.reconcile();
  assert.equal((await repository.load())!.economy.credits, 200, 'restart reconciliation grants once');
}

for (const [id, credits] of [['credits_500', 500], ['credits_1500', 1500]] as const) {
  const { runtime, service } = await setup('android');
  runtime.next = { productId: `test.google.${id}`, state: 'confirmed', externalPurchaseId: `token-${id}`,
    purchaseToken: `token-${id}`, orderId: `order-${id}`, purchaseTimestamp: '2026-09-10T10:00:00.000Z' };
  const outcome = await service.purchase(id);
  assert.equal(outcome.state === 'success' ? outcome.creditsAdded : 0, credits);
}

{
  const { repository, runtime, service } = await setup();
  const before = (await repository.load())!.economy.credits;
  runtime.next = { productId: 'test.apple.credits_100', state: 'cancelled' };
  assert.equal((await service.purchase('credits_100')).state, 'cancelled');
  runtime.next = { productId: 'test.apple.credits_100', state: 'pending', externalPurchaseId: 'pending-1' };
  assert.equal((await service.purchase('credits_100')).state, 'pending');
  assert.equal((await repository.load())!.economy.credits, before);
  runtime.reconciliation = [{ productId: 'test.apple.credits_100', state: 'confirmed', externalPurchaseId: 'pending-1',
    transactionId: 'pending-1', purchaseTimestamp: '2026-09-10T10:00:00.000Z' }];
  await service.reconcile();
  assert.equal((await repository.load())!.economy.credits, before + 100, 'pending later confirmation grants once');
}

{
  const web = await setup('web');
  assert.equal(web.service.isAvailable(), false);
  assert.ok((await web.service.loadProducts('de')).every((item) => !item.available && item.displayPrice === null));
  await assert.rejects(() => web.service.purchase('credits_100'), /native_app_required/);
  const offline = await setup('android'); offline.runtime.failStore = true;
  await assert.rejects(() => offline.service.loadProducts('en'), /offline/);
  assert.equal((await offline.repository.load())!.economy.credits, 100);
}

{
  const { repository, runtime, service } = await setup('android');
  runtime.reconciliation = [{ productId: 'unknown.store.product', state: 'confirmed', externalPurchaseId: 'unknown-1',
    purchaseTimestamp: '2026-09-10T10:00:00.000Z' }];
  await assert.rejects(() => service.reconcile(), /unknown_external_transaction/);
  assert.equal((await repository.load())!.economy.credits, 100);
}

{
  const { repository, runtime, service } = await setup();
  const save = (await repository.load())!;
  const before = save.economy.credits;
  const maximum = Number.MAX_SAFE_INTEGER - 50;
  save.economy.credits = maximum;
  save.economy.transactions.push({ id: 'test-near-limit', type: 'test', source: 'test', amount: maximum - before,
    balanceBefore: before, balanceAfter: maximum, referenceId: 'test-near-limit', createdAt: new Date().toISOString(), metadata: {} });
  save.economy.processedReferenceIds.push('test-near-limit');
  await repository.save(save);
  runtime.next = { productId: 'test.apple.credits_100', state: 'confirmed', externalPurchaseId: 'overflow',
    purchaseTimestamp: '2026-09-10T10:00:00.000Z' };
  await assert.rejects(() => service.purchase('credits_100'), /insufficient_balance/);
  assert.equal((await repository.load())!.economy.credits, maximum, 'failed atomic grant rolls back');
  assert.equal(runtime.finishes.length, 0, 'store transaction is not finished before durable ledger write');
}

const app = readFileSync(resolve('src/App.tsx'), 'utf8');
const shop = readFileSync(resolve('src/components/Modals/ShopModal.tsx'), 'utf8');
assert.ok(!/stripe|supabase|checkout-session/i.test(app + shop), 'active IAP UI has no cloud/web checkout fallback');
assert.ok(!/grantedCredits/.test(shop), 'UI cannot submit a credit amount');
assert.ok(!/targetLaunchPrice/.test(shop), 'Shop cannot display or settle against target launch pricing metadata');
assert.ok(!/targetLaunchPrice/.test(readFileSync(resolve('src/features/economy/localIapService.ts'), 'utf8')), 'runtime display model cannot source target launch pricing');

for (const product of products) { product.appleProductId = null; product.googleProductId = null; }
console.log('ARC native IAP tests passed: catalog mapping, iOS/Android, pending, cancellation, idempotency, recovery, offline, rollback.');
