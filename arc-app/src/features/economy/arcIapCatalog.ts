import type { ArcPlatform } from '../native/nativeRuntimeTypes';

export type ArcIapPlatform = Extract<ArcPlatform, 'ios' | 'android'>;
export type ArcIapPackagePositioning = 'standard' | 'popular' | 'best-value';

export interface ArcIapTargetLaunchPrice {
  amount: number;
  currency: 'EUR';
}

export interface ArcIapProductDefinition {
  internalProductId: string;
  appleProductId: string | null;
  googleProductId: string | null;
  credits: number;
  fallbackName: { de: string; en: string };
  fallbackDescription: { de: string; en: string };
  targetLaunchPrice: ArcIapTargetLaunchPrice;
  positioning: ArcIapPackagePositioning;
  type: 'consumable';
  sortOrder: number;
}

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const configured = (key: string): string | null => env[key]?.trim() || null;

export const ARC_IAP_PRODUCT_CATALOG: readonly ArcIapProductDefinition[] = [
  {
    internalProductId: 'credits_100', appleProductId: configured('VITE_ARC_IAP_APPLE_CREDITS_100'),
    googleProductId: configured('VITE_ARC_IAP_GOOGLE_CREDITS_100'), credits: 100,
    fallbackName: { de: '100 Credits', en: '100 Credits' },
    fallbackDescription: { de: '100 ARC Credits', en: '100 ARC Credits' },
    targetLaunchPrice: { amount: 0.99, currency: 'EUR' }, positioning: 'standard', type: 'consumable', sortOrder: 10,
  },
  {
    internalProductId: 'credits_500', appleProductId: configured('VITE_ARC_IAP_APPLE_CREDITS_500'),
    googleProductId: configured('VITE_ARC_IAP_GOOGLE_CREDITS_500'), credits: 500,
    fallbackName: { de: '500 Credits', en: '500 Credits' },
    fallbackDescription: { de: '500 ARC Credits', en: '500 ARC Credits' },
    targetLaunchPrice: { amount: 3.99, currency: 'EUR' }, positioning: 'popular', type: 'consumable', sortOrder: 20,
  },
  {
    internalProductId: 'credits_1500', appleProductId: configured('VITE_ARC_IAP_APPLE_CREDITS_1500'),
    googleProductId: configured('VITE_ARC_IAP_GOOGLE_CREDITS_1500'), credits: 1500,
    fallbackName: { de: '1.500 Credits', en: '1,500 Credits' },
    fallbackDescription: { de: '1.500 ARC Credits', en: '1,500 ARC Credits' },
    targetLaunchPrice: { amount: 9.99, currency: 'EUR' }, positioning: 'best-value', type: 'consumable', sortOrder: 30,
  },
] as const;

export function storeProductId(product: ArcIapProductDefinition, platform: ArcIapPlatform): string | null {
  return platform === 'ios' ? product.appleProductId : product.googleProductId;
}

export function getArcIapProduct(internalProductId: string): ArcIapProductDefinition | null {
  return ARC_IAP_PRODUCT_CATALOG.find((product) => product.internalProductId === internalProductId) ?? null;
}

export function getArcIapProductByStoreId(platform: ArcIapPlatform, id: string): ArcIapProductDefinition | null {
  return ARC_IAP_PRODUCT_CATALOG.find((product) => storeProductId(product, platform) === id) ?? null;
}
