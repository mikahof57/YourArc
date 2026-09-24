import { AVAILABLE_SKINS } from '../../data/skinData';
import { INTERFACE_COLOR_PALETTE, UI_ANIMATION_OPTIONS } from '../../data/shopData';

export type ArcShopItemType = 'skin' | 'color' | 'animation' | 'other';
export interface ArcLocalShopItem {
  itemId: string;
  type: ArcShopItemType;
  name: string;
  description: string;
  priceCredits: number;
  assetReference: string | null;
  available: boolean;
  defaultOwned: boolean;
  metadata: Record<string, unknown>;
}

export const ARC_LOCAL_SHOP_CATALOG: readonly ArcLocalShopItem[] = [
  ...AVAILABLE_SKINS.map((skin): ArcLocalShopItem => ({
    itemId: skin.id, type: 'skin', name: skin.name, description: skin.description,
    priceCredits: skin.price, assetReference: skin.avatarUrl, available: true,
    defaultOwned: false, metadata: { tier: skin.tier, collection: skin.collection, order: skin.order },
  })),
  ...INTERFACE_COLOR_PALETTE.map((color): ArcLocalShopItem => ({
    itemId: color.id, type: 'color', name: color.name, description: color.description,
    priceCredits: color.price, assetReference: color.hex,
    available: color.id === 'color_cyan', defaultOwned: color.id === 'color_cyan',
    metadata: { compatibilityOnly: color.id !== 'color_cyan' },
  })),
  ...UI_ANIMATION_OPTIONS.map((animation): ArcLocalShopItem => ({
    itemId: animation.id, type: 'animation', name: animation.name, description: animation.description,
    priceCredits: animation.price, assetReference: null, available: false, defaultOwned: false,
    metadata: { compatibilityOnly: true, complexity: animation.complexity },
  })),
];

const catalogById = new Map(ARC_LOCAL_SHOP_CATALOG.map((item) => [item.itemId, item]));
export function getLocalShopItem(itemId: string): ArcLocalShopItem | null { return catalogById.get(itemId) ?? null; }
export function isDefaultLocalItem(itemId: string): boolean { return catalogById.get(itemId)?.defaultOwned === true; }
