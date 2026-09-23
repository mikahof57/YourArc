import type { ArcEconomyTransaction, ArcInventoryItem, ArcSaveGame } from '../savegame/arcSaveGame';
import { getLocalShopItem, isDefaultLocalItem, type ArcLocalShopItem, type ArcShopItemType } from './localShopCatalog';
import { getArcIapProductByStoreId, type ArcIapPlatform } from './arcIapCatalog';

export interface ArcEconomyEntryInput {
  type: string;
  source: string;
  amount: number;
  referenceId: string;
  itemId?: string;
  rewardId?: string;
  externalPurchaseId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface ArcVerifiedExternalPurchase {
  externalPurchaseId: string;
  productId: string;
  platform: ArcIapPlatform;
  purchaseTimestamp: string;
  metadata?: Record<string, unknown>;
}

const validText = (value: string) => typeof value === 'string' && value.trim().length > 0;
export const getBalance = (save: ArcSaveGame): number => save.economy.credits;

function existingByReference(save: ArcSaveGame, referenceId: string): ArcEconomyTransaction | null {
  return save.economy.transactions.find((entry) => entry.referenceId === referenceId) ?? null;
}

function append(save: ArcSaveGame, input: ArcEconomyEntryInput): ArcEconomyTransaction {
  if (!validText(input.type) || !validText(input.source) || !validText(input.referenceId)
    || !Number.isSafeInteger(input.amount)) throw new Error('arc_local_economy_transaction_invalid');
  const existing = existingByReference(save, input.referenceId);
  if (existing) return existing;
  const before = save.economy.credits;
  const after = before + input.amount;
  if (!Number.isSafeInteger(after) || after < 0) throw new Error('arc_local_economy_insufficient_balance');
  const transaction: ArcEconomyTransaction = {
    id: `local-tx:${input.referenceId}`, type: input.type, source: input.source,
    amount: input.amount, balanceBefore: before, balanceAfter: after,
    referenceId: input.referenceId, createdAt: input.createdAt ?? new Date().toISOString(),
    ...(input.itemId ? { itemId: input.itemId } : {}),
    ...(input.rewardId ? { rewardId: input.rewardId } : {}),
    ...(input.externalPurchaseId ? { externalPurchaseId: input.externalPurchaseId } : {}),
    metadata: structuredClone(input.metadata ?? {}),
  };
  save.economy.credits = after;
  save.economy.transactions.push(transaction);
  save.economy.processedReferenceIds.push(input.referenceId);
  if (input.externalPurchaseId) save.economy.processedExternalPurchaseIds.push(input.externalPurchaseId);
  return transaction;
}

export function credit(save: ArcSaveGame, input: Omit<ArcEconomyEntryInput, 'amount'> & { amount: number }): ArcEconomyTransaction {
  if (input.amount <= 0) throw new Error('arc_local_credit_amount_invalid');
  return append(save, input);
}

export function debit(save: ArcSaveGame, input: Omit<ArcEconomyEntryInput, 'amount'> & { amount: number }): ArcEconomyTransaction {
  if (input.amount <= 0) throw new Error('arc_local_debit_amount_invalid');
  return append(save, { ...input, amount: -input.amount });
}

function owns(save: ArcSaveGame, itemId: string): boolean {
  return isDefaultLocalItem(itemId) || save.economy.inventoryItemIds.includes(itemId);
}

export function grantItem(save: ArcSaveGame, item: ArcLocalShopItem, referenceId: string, source: string): ArcInventoryItem | null {
  if (owns(save, item.itemId)) return null;
  const acquired: ArcInventoryItem = { itemId: item.itemId, itemType: item.type, acquiredAt: new Date().toISOString(), source, referenceId, metadata: {} };
  save.economy.inventory.push(acquired); save.economy.inventoryItemIds.push(item.itemId);
  return acquired;
}

export function purchaseItem(save: ArcSaveGame, itemId: string, referenceId = `shop_purchase:${itemId}`): ArcEconomyTransaction {
  const item = getLocalShopItem(itemId);
  if (!item) throw new Error('arc_local_shop_item_not_found');
  if (!item.available) throw new Error('arc_local_shop_item_unavailable');
  if (owns(save, itemId)) throw new Error('arc_local_shop_item_already_owned');
  const transaction = debit(save, { type: 'shop_purchase', source: 'local_shop', amount: item.priceCredits,
    referenceId, itemId, metadata: { itemType: item.type } });
  grantItem(save, item, referenceId, 'local_shop');
  return transaction;
}

export function equipItem(save: ArcSaveGame, itemId: string): void {
  const item = getLocalShopItem(itemId);
  if (!item) throw new Error('arc_local_inventory_item_not_found');
  if (!owns(save, itemId)) throw new Error('arc_local_inventory_item_not_owned');
  if (item.type === 'skin') save.economy.equippedSkinId = itemId;
  save.economy.equippedItemIds[item.type] = itemId;
}

export function unequipItem(save: ArcSaveGame, type: ArcShopItemType): void {
  if (type === 'skin') save.economy.equippedSkinId = '';
  save.economy.equippedItemIds[type] = null;
}

export function applyReward(save: ArcSaveGame, rewardId: string, amount: number, source: 'mission' | 'achievement' | 'other', metadata: Record<string, unknown> = {}): ArcEconomyTransaction {
  return credit(save, { type: `${source}_reward`, source, amount, rewardId,
    referenceId: `${source}_reward:${rewardId}`, metadata });
}

export function spendForReload(save: ArcSaveGame, operationId: string, cost = 1): ArcEconomyTransaction {
  const referenceId = `module_reload:${operationId}`;
  const existing = existingByReference(save, referenceId);
  if (existing) return existing;
  const transaction = debit(save, { type: 'module_reload', source: 'extra_module', amount: cost, referenceId, metadata: { operationId } });
  save.ui.moduleReloadsCountToday += 1;
  return transaction;
}

export function claimWheelReward(save: ArcSaveGame, arcDay: string, roll?: number): { reward: number; balance: number; transaction: ArcEconomyTransaction | null } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arcDay)) throw new Error('arc_local_wheel_day_invalid');
  if (save.economy.wheel.claimHistory.some((claim) => claim.date === arcDay)) throw new Error('arc_local_wheel_already_claimed');
  const value = roll ?? randomUnit();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('arc_local_wheel_roll_invalid');
  const reward = value < 0.01 ? 100 : value < 0.11 ? 25 : value < 0.51 ? 5 : 0;
  const referenceId = `daily_wheel:${arcDay}`;
  const transaction = reward > 0 ? credit(save, { type: 'daily_wheel', source: 'local_wheel', amount: reward,
    rewardId: arcDay, referenceId, metadata: { reward, arcDay } }) : null;
  save.economy.wheel.lastClaimDate = arcDay;
  save.economy.wheel.claimHistory.push({ date: arcDay, reward, transactionId: transaction?.id ?? null });
  return { reward, balance: save.economy.credits, transaction };
}

function randomUnit(): number {
  const values = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) { globalThis.crypto.getRandomValues(values); return values[0] / 0x1_0000_0000; }
  return Math.random();
}

/** Caller must provide a purchase already verified by a future native platform adapter. */
export function applyVerifiedExternalPurchase(save: ArcSaveGame, purchase: ArcVerifiedExternalPurchase): ArcEconomyTransaction {
  const product = getArcIapProductByStoreId(purchase.platform, purchase.productId);
  if (!validText(purchase.externalPurchaseId) || !validText(purchase.productId)
    || !['ios', 'android'].includes(purchase.platform) || !product
    || Number.isNaN(Date.parse(purchase.purchaseTimestamp))) throw new Error('arc_local_iap_event_invalid');
  const identities = [purchase.externalPurchaseId, purchase.metadata?.transactionId,
    purchase.metadata?.orderId, purchase.metadata?.purchaseToken].filter((value): value is string => validText(String(value ?? '')));
  const existing = save.economy.transactions.find((entry) => entry.externalPurchaseId === purchase.externalPurchaseId
    || identities.some((identity) => [entry.externalPurchaseId, entry.metadata.transactionId,
      entry.metadata.orderId, entry.metadata.purchaseToken].includes(identity)));
  if (existing) return existing;
  return credit(save, { type: 'iap_credit_grant', source: purchase.platform, amount: product.credits,
    externalPurchaseId: purchase.externalPurchaseId, referenceId: `iap:${purchase.platform}:${purchase.externalPurchaseId}`,
    createdAt: purchase.purchaseTimestamp, metadata: { productId: purchase.productId, ...(purchase.metadata ?? {}) } });
}
