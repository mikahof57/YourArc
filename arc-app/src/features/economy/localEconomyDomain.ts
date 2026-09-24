import type { ArcEconomyTransaction, ArcInventoryItem, ArcSaveGame } from '../savegame/arcSaveGame';
import { getLocalShopItem, isDefaultLocalItem, type ArcLocalShopItem, type ArcShopItemType } from './localShopCatalog';

export interface ArcEconomyEntryInput {
  type: string;
  source: string;
  amount: number;
  referenceId: string;
  itemId?: string;
  rewardId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
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
    metadata: structuredClone(input.metadata ?? {}),
  };
  save.economy.credits = after;
  save.economy.transactions.push(transaction);
  save.economy.processedReferenceIds.push(input.referenceId);
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
