import type { ArcSaveRepository } from '../savegame/arcSaveRepository';
import { applyReward, credit, debit, equipItem,
  grantItem, purchaseItem, spendForReload, unequipItem, type ArcEconomyEntryInput } from './localEconomyDomain';
import { getLocalShopItem, type ArcShopItemType } from './localShopCatalog';

/** Atomic local economy API backed exclusively by ArcSaveRepository. */
export class LocalEconomyService {
  constructor(private readonly saves: ArcSaveRepository) {}
  load() { return this.saves.load(); }
  credit(input: ArcEconomyEntryInput) { return this.saves.transaction((save) => { credit(save, input); }); }
  debit(input: Omit<ArcEconomyEntryInput, 'amount'> & { amount: number }) { return this.saves.transaction((save) => { debit(save, input); }); }
  purchaseItem(itemId: string, referenceId?: string) { return this.saves.transaction((save) => { purchaseItem(save, itemId, referenceId); }); }
  grantItem(itemId: string, referenceId: string, source: string) { return this.saves.transaction((save) => {
    const item = getLocalShopItem(itemId); if (!item) throw new Error('arc_local_shop_item_not_found');
    grantItem(save, item, referenceId, source);
  }); }
  equipItem(itemId: string) { return this.saves.transaction((save) => equipItem(save, itemId)); }
  unequipItem(type: ArcShopItemType) { return this.saves.transaction((save) => unequipItem(save, type)); }
  spendForReload(operationId: string, cost = 1) { return this.saves.transaction((save) => { spendForReload(save, operationId, cost); }); }
  applyReward(rewardId: string, amount: number, source: 'mission' | 'achievement' | 'other', metadata?: Record<string, unknown>) {
    return this.saves.transaction((save) => { applyReward(save, rewardId, amount, source, metadata); });
  }
}
